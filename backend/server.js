const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch'); // Using v2 for CommonJS compatibility
const db = require('./database');

const app = express();
const PORT = 3001;
const N8N_BASE_URL = 'https://n8n-n8n.rcnvtl.easypanel.host';

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for memory storage (crucial for buffer forwarding)
const upload = multer({ storage: multer.memoryStorage() });

// =========================================================================
// ROUTE A: Upload Document (POST)
// =========================================================================
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
        const { tenant_id, document_id, file_name, notas_contexto } = req.body;
        const file = req.file;

        if (!file || !tenant_id || !document_id || !file_name) {
            return res.status(400).json({ error: 'Missing required fields or file' });
        }

        // 1. Save mapping to local SQLite
        db.run(
            `INSERT INTO document_mappings (tenant_id, document_id, file_name) VALUES (?, ?, ?)`,
            [tenant_id, document_id, file_name],
            async function(err) {
                if (err) {
                    console.error('Failed to insert into SQLite:', err);
                    return res.status(500).json({ error: 'Failed to record document mapping locally' });
                }

                // 2. Forward to N8N using correct form-data construction
                const form = new FormData();
                form.append('file', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
                form.append('tenant_id', tenant_id);
                form.append('document_id', document_id);
                form.append('notas_contexto', notas_contexto || '');

                try {
                    const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook-test/subir-pdf-mvp`, {
                        method: 'POST',
                        body: form,
                        headers: form.getHeaders() // Automatically sets correct boundary
                    });

                    if (n8nResponse.ok) {
                        res.status(200).json({ message: 'Upload successful to N8N' });
                    } else {
                        console.error("N8N Webhook rejected:", n8nResponse.status);
                        // Optional fallback: delete from local SQLite if N8N fails
                        db.run(`DELETE FROM document_mappings WHERE document_id = ?`, [document_id]);
                        res.status(502).json({ error: 'N8N webhook rejected the request' });
                    }
                } catch (fetchError) {
                    console.error('N8N Fetch Error:', fetchError);
                    db.run(`DELETE FROM document_mappings WHERE document_id = ?`, [document_id]);
                    res.status(502).json({ error: 'Failed to communicate with N8N' });
                }
            }
        );
    } catch (error) {
        console.error('Upload Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// =========================================================================
// ROUTE B: Update Context Notes (PUT)
// =========================================================================
app.put('/api/documents/notes', async (req, res) => {
    try {
        const { document_id, tenant_id, notas_contexto } = req.body;

        if (!document_id || !tenant_id) {
            return res.status(400).json({ error: 'Missing document_id or tenant_id' });
        }

        const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook-test/actualizar-notas-pdf`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id, tenant_id, notas_contexto })
        });

        if (n8nResponse.ok) {
            res.status(200).json({ message: 'Notes updated successfully in N8N' });
        } else {
            console.error("N8N Webhook rejected notes update:", n8nResponse.status);
            res.status(502).json({ error: 'Failed to update notes in N8N' });
        }
    } catch (error) {
        console.error('Update Notes Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// =========================================================================
// ROUTE C: Delete Document (DELETE)
// =========================================================================
app.delete('/api/documents/:documentId', async (req, res) => {
    try {
        const { documentId } = req.params;
        const tenant_id = req.headers['tenant_id'] || req.body.tenant_id || req.query.tenant_id || '1';

        // 1. Send DELETE to N8N
        const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook-test/borrar-pdf-seguro`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: documentId, tenant_id })
        });

        if (n8nResponse.ok) {
            // 2. Remove from local SQLite mapping only if N8N confirms
            db.run(`DELETE FROM document_mappings WHERE document_id = ? AND tenant_id = ?`, [documentId, tenant_id], (err) => {
                if (err) console.error("Failed to delete local map:", err);
            });
            res.status(200).json({ message: 'Deleted successfully from N8N and local DB' });
        } else {
            console.error("N8N Webhook rejected delete:", n8nResponse.status);
            res.status(502).json({ error: 'Failed to perform delete in N8N' });
        }
    } catch (error) {
        console.error('Delete Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// =========================================================================
// ROUTE D: Fetch Documents with Name Mapping (POST)
// =========================================================================
app.post('/api/documents/fetch', async (req, res) => {
    try {
        const { tenant_id } = req.body;
        if (!tenant_id) return res.status(400).json({ error: 'Missing tenant_id' });

        // 1. Ask N8N for vector metadata using GET
        const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook-test/obtener-documentos-seguros?tenant_id=${tenant_id}`, {
            method: 'GET'
        });

        const rawText = await n8nResponse.text();
        let n8nDocs = [];
        try {
            n8nDocs = JSON.parse(rawText);
        } catch (e) {
            console.error("N8N did not return JSON. Raw response was:", rawText);
            return res.status(502).json({ error: 'N8N returned invalid JSON or empty response. Check N8N Webhook response settings.' });
        }
        
        if (!Array.isArray(n8nDocs) || n8nDocs.length === 0) {
            return res.status(200).json([]); // No documents found
        }

        // 2. Query local mapping
        const documentIds = n8nDocs.map(d => d.document_id).filter(id => id);
        
        if (documentIds.length === 0) {
            // Return N8N docs properly formatted for React even if SQLite is empty
            const fallbackDocs = n8nDocs.map(doc => ({
                id: doc.document_id,
                type: 'pdf',
                name: 'Unknown Document',
                description: doc.notas_humanas || 'Recently uploaded PDF document.',
                status: 'Indexed',
                timeAgo: 'Just now',
                notas_humanas: doc.notas_humanas || ''
            }));
            return res.status(200).json(fallbackDocs);
        }

        const placeholders = documentIds.map(() => '?').join(',');
        const query = `SELECT document_id, file_name FROM document_mappings WHERE tenant_id = ? AND document_id IN (${placeholders})`;

        // Pass 'tenant_id' as the first param, then spread the documentIds
        db.all(query, [tenant_id, ...documentIds], (err, rows) => {
            if (err) {
                console.error("Local mapping query error:", err);
                return res.status(200).json(n8nDocs); // Fallback to raw N8N response without mapping
            }

            // Create a lookup dictionary
            const namesMap = {};
            rows.forEach(row => {
                namesMap[row.document_id] = row.file_name;
            });

            // 3. Merge data
            const enrichedDocs = n8nDocs.map(doc => ({
                id: doc.document_id,
                type: 'pdf',
                name: namesMap[doc.document_id] || 'Unknown Document',
                description: doc.notas_humanas || 'Recently uploaded PDF document.',
                status: 'Indexed',
                timeAgo: 'Just now',
                notas_humanas: doc.notas_humanas || ''
            }));

            res.status(200).json(enrichedDocs);
        });

    } catch (error) {
        console.error('Fetch Docs Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ CustomerAGI Backend Gateway running on http://localhost:${PORT}`);
});
