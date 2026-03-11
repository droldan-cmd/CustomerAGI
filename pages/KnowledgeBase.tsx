import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FileText,
    Globe,
    Trash2,
    Filter,
    Plus,
    Link,
    Puzzle,
    Settings,
    CheckCircle2,
    Database,
    ExternalLink,
    Search,
    Clock,
    LayoutGrid,
    ChevronRight,
    Loader2,
    Code2,
    Cpu,
    Zap,
    Users,
    X,
    MessageSquare,
    Send,
    FileSpreadsheet,
    HelpCircle,
    File
} from 'lucide-react';

interface Tool {
    id: string;
    name: string;
    description: string;
    type: 'api' | 'script';
    status: 'Active' | 'Resolved' | 'Testing';
    lastSync: string;
    agents: string[];
}

const mockTools: Tool[] = [
    {
        id: '1',
        name: 'Customer CRM API',
        description: 'Fetch user profile, purchase history, and loyalty tier.',
        type: 'api',
        status: 'Active',
        lastSync: '12 mins ago',
        agents: ['Support Pro', 'Loyalty Bot']
    },
    {
        id: '2',
        name: 'Inventory Sync',
        description: 'Real-time stock availability and warehouse locations.',
        type: 'api',
        status: 'Active',
        lastSync: '45 mins ago',
        agents: ['Sales Agent']
    },
    {
        id: '3',
        name: 'Order Formatter',
        description: 'Custom script to clean up raw JSON order data for human review.',
        type: 'script',
        status: 'Resolved',
        lastSync: '2h ago',
        agents: ['Support Pro', 'Logistics Bot']
    },
    {
        id: '4',
        name: 'Lead Scorer',
        description: 'JS Logic to calculate lead priority based on activity.',
        type: 'script',
        status: 'Testing',
        lastSync: 'Just now',
        agents: ['Marketing Lead']
    }
];

export const KnowledgeBase: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'knowledge' | 'tools'>('knowledge');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
    const [isManageSourceOpen, setIsManageSourceOpen] = useState(false);
    const [isAddToolOpen, setIsAddToolOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // AI Chat Notes State
    const [aiNote, setAiNote] = useState('');
    const [chatNotes, setChatNotes] = useState([
        { id: 1, text: "Make sure to prioritize section 3 for refund policies.", time: "2 days ago" },
        { id: 2, text: "Updated the contact numbers in this document.", time: "5 hrs ago" }
    ]);

    // N8N File Upload State
    const [selectedDocument, setSelectedDocument] = useState<{ file: File | null, documentId: string, name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const API_BASE = 'http://localhost:3001/api/documents';

    const uploadToN8n = async (file: File, documentId: string, aiNote: string) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("tenant_id", "1");
            formData.append("document_id", documentId);
            formData.append("file_name", file.name); // Pass original file name to local backend mapping
            formData.append("notas_contexto", aiNote);

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                console.log("Uploaded successfully to Local Backend -> N8N");
            } else {
                console.error("Failed to upload to Local Backend -> N8N");
            }
        } catch (error) {
            console.error("Error uploading to Local Backend -> N8N:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const updateNotesInN8n = async (documentId: string, notes: string[]) => {
        try {
            const notas_contexto = notes.map(n => `- ${n}`).join('\n');
            const response = await fetch(`${API_BASE}/notes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    document_id: documentId,
                    tenant_id: '1',
                    notas_contexto
                }),
            });
            if (!response.ok) {
                console.error("Failed to update notes in Local Backend -> N8N");
            } else {
                // Update local cached state so it persists without reloading
                setDataSources(prev => prev.map(s => {
                    if (s.id === documentId) {
                        return { ...s, notas_humanas: notas_contexto };
                    }
                    return s;
                }));
            }
        } catch (error) {
            console.error("Error updating notes in Local Backend -> N8N:", error);
        }
    };

    const handleDeleteSource = async (documentId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this document? This action cannot be undone.");
        if (!confirmed) return;
        
        try {
            const response = await fetch(`${API_BASE}/${documentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'tenant_id': '1'
                }
            });
            if (response.ok) {
                setDataSources(prev => prev.filter(s => s.id !== documentId));
                setIsManageSourceOpen(false);
            } else {
                console.error("Failed to delete document in Local Backend -> N8N");
            }
        } catch (error) {
            console.error("Error deleting document in Local Backend -> N8N:", error);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const documentId = crypto.randomUUID();
            setSelectedDocument({ file, documentId, name: file.name });
            setChatNotes([]); // Clear previous notes for new document
            // Do not upload or close modal immediately; wait for explicit Save and Sync.
        }
    };

    const handleManageSource = (source: DataSource) => {
        setSelectedDocument({ file: null, documentId: source.id, name: source.name });
        
        // Render any existing notes from the database onto the chat UI
        if (source.notas_humanas && source.notas_humanas.trim() !== '') {
            const rawNotes = source.notas_humanas.split('\n');
            const parsedNotes = rawNotes
                .filter(n => n.trim() !== '')
                .map((n, idx) => ({ id: Date.now() + idx, text: n.replace('- ', ''), time: 'Previously' }));
            
            setChatNotes(parsedNotes);
        } else {
            setChatNotes([]);
        }
        setIsManageSourceOpen(true);
    };

    interface DataSource {
        id: string;
        type: 'pdf' | 'web';
        name: string;
        description: string;
        status: string;
        pages?: number;
        depth?: number;
        timeAgo: string;
        notas_humanas?: string;
    }

    const fetchDocumentsFromN8n = async () => {
        try {
            // Solicitamos a Nuestro Backend NodeJS la lista de documentos vinculados al tenant_id '1'
            const response = await fetch(`${API_BASE}/fetch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_id: '1' })
            });

            if (response.ok) {
                const data = await response.json();
                // Si el Backend devuelve un array (ya cruzado con SQLite), actualizamos el estado global
                if (Array.isArray(data)) {
                    setDataSources(data);
                }
            }
        } catch (error) {
            console.error("Error fetching documents from Local Backend:", error);
        }
    };

    useEffect(() => {
        fetchDocumentsFromN8n();
    }, []);

    const [dataSources, setDataSources] = useState<DataSource[]>(() => {
        const cached = sessionStorage.getItem('customeragi_data_sources');
        return cached ? JSON.parse(cached) : [];
    });

    useEffect(() => {
        sessionStorage.setItem('customeragi_data_sources', JSON.stringify(dataSources));
    }, [dataSources]);

    const handleConfirmSync = () => {
        if (selectedDocument && selectedDocument.file) {
            uploadToN8n(selectedDocument.file, selectedDocument.documentId, "");

            // Add to UI state
            setDataSources([
                {
                    id: selectedDocument.documentId,
                    type: 'pdf',
                    name: selectedDocument.name,
                    description: 'Recently uploaded PDF document.',
                    status: 'Indexed',
                    pages: 1,
                    timeAgo: 'Just now'
                },
                ...dataSources
            ]);

            setIsAddSourceOpen(false); // Close modal only after confirmation
            setSelectedDocument(null);
        }
    };

    const handleSendNote = () => {
        if (!aiNote.trim()) return;

        const newNotes = [...chatNotes, { id: Date.now(), text: aiNote, time: "Just now" }];

        if (selectedDocument) {
            const confirmSync = window.confirm("Sync Knowledge Base with this note?");
            if (confirmSync) {
                setChatNotes(newNotes);
                updateNotesInN8n(selectedDocument.documentId, newNotes.map(n => n.text));
            }
        } else {
            // Mock fallback if no document is dynamically uploaded
            setChatNotes(newNotes);
        }

        setAiNote('');
    };

    // Reusable Framer Motion Carousel for Mobile
    const MobileCarousel = ({ children }: { children: React.ReactNode }) => {
        const carouselRef = useRef<HTMLDivElement>(null);
        const [width, setWidth] = useState(0);

        useEffect(() => {
            const updateWidth = () => {
                if (carouselRef.current) {
                    setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
                }
            };
            updateWidth();
            const timeoutId = setTimeout(updateWidth, 100);
            window.addEventListener('resize', updateWidth);
            return () => {
                clearTimeout(timeoutId);
                window.removeEventListener('resize', updateWidth);
            };
        }, [children, activeTab]);

        return (
            <div className="md:hidden overflow-hidden active:cursor-grabbing cursor-grab" ref={carouselRef}>
                <motion.div drag="x" dragConstraints={{ right: 0, left: -width }} className="flex">
                    {children}
                </motion.div>
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa] dark:bg-[#0a0d18] custom-scrollbar relative">
            {/* Header */}
            <header className="h-20 px-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#161b2e]/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Knowledge & Tools</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Manage your agent's brain and external connections.</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage Efficiency</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">2.4 / 10 GB</span>
                            <div className="w-32 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 p-[1px]">
                                <div className="bg-gradient-to-r from-[#55b7e0] to-[#4aa3c8] h-full w-[24%] rounded-full shadow-[0_0_10px_rgba(85,183,224,0.3)] transition-all duration-1000"></div>
                            </div>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:bg-slate-800"></div>
                    <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all hover:shadow-md">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            <div className="p-10 max-w-7xl mx-auto space-y-10 pb-32">
                {/* Tabs & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="bg-white dark:bg-[#161b2e] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex shadow-sm w-fit relative overflow-hidden">
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary-500 rounded-xl transition-transform duration-300 ease-out shadow-lg shadow-primary-500/20 ${activeTab === 'knowledge' ? 'translate-x-0' : 'translate-x-full'
                                }`}
                        />
                        <button
                            onClick={() => setActiveTab('knowledge')}
                            className={`relative z-10 px-6 py-2.5 text-sm font-bold flex items-center gap-2.5 transition-colors duration-300 ${activeTab === 'knowledge' ? 'text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <Database size={18} /> Knowledge
                        </button>
                        <button
                            onClick={() => setActiveTab('tools')}
                            className={`relative z-10 px-6 py-2.5 text-sm font-bold flex items-center gap-2.5 transition-colors duration-300 ${activeTab === 'tools' ? 'text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <Puzzle size={18} /> Tools & API
                        </button>
                    </div>

                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#55b7e0] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'knowledge' ? 'sources' : 'tools'}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-[#161b2e] border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none shadow-sm transition-all"
                        />
                    </div>
                </div>

                {activeTab === 'knowledge' ? (
                    /* Data Sources Grid */
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Sources</h2>
                                <p className="text-xs text-slate-500 font-medium">Manage the context your agents rely on.</p>
                            </div>
                            <div className="flex gap-4 relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="bg-white dark:bg-[#161b2e] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm shadow-sm"
                                >
                                    <Filter size={16} /> Filters
                                </button>

                                {/* Filter Dropdown Menu */}
                                {isFilterOpen && (
                                    <div className="absolute top-14 right-40 w-64 bg-white dark:bg-[#161b2e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source Type</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {['PDF', 'Web', 'CSV', 'Word', 'FAQ'].map(t => (
                                                        <span key={t} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</h4>
                                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold px-3 py-2 text-slate-600 outline-none">
                                                    <option>All Statuses</option>
                                                    <option>Indexed</option>
                                                    <option>Processing</option>
                                                </select>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date Added</h4>
                                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold px-3 py-2 text-slate-600 outline-none">
                                                    <option>Any Time</option>
                                                    <option>Last 7 Days</option>
                                                    <option>Last 30 Days</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsAddSourceOpen(true)}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2.5 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
                                >
                                    <Plus size={18} /> Add Source
                                </button>

                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    accept=".pdf"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        </div>

                        {/* Data Sources Grid / Carousel */}
                        <MobileCarousel>
                            {dataSources.map((source: DataSource) => (
                                <div key={source.id} className="min-w-[85vw] mr-4 snap-center">
                                    <div className="bg-white dark:bg-[#161b2e] border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] hover:shadow-2xl transition-all duration-500 group relative overflow-hidden flex flex-col justify-between min-h-[260px] h-full">
                                        <div className={`absolute top-0 right-0 w-32 h-32 ${source.type === 'pdf' ? 'bg-primary-500/5 group-hover:bg-primary-500/10' : 'bg-amber-500/5 group-hover:bg-amber-500/10'} blur-[60px] rounded-full pointer-events-none transition-all`}></div>
                                        <div>
                                            <div className="flex justify-between items-start mb-8">
                                                <div className={`size-14 bg-slate-50 dark:bg-[#1e253c] ${source.type === 'pdf' ? 'text-primary-500 group-hover:rotate-3' : 'text-[#fab728] group-hover:-rotate-3'} rounded-2xl flex items-center justify-center shadow-inner border border-slate-100/50 dark:border-slate-700/50 transform transition-transform group-hover:scale-110`}>
                                                    {source.type === 'pdf' ? <FileText size={28} strokeWidth={1.5} /> : <Globe size={28} strokeWidth={1.5} />}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{source.status}</span>
                                                </div>
                                            </div>
                                            <h3 className={`text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight ${source.type === 'pdf' ? 'group-hover:text-primary-500' : 'group-hover:text-[#fab728]'} transition-colors line-clamp-2`}>{source.name}</h3>
                                            <p className="text-xs text-slate-500 mb-6 font-medium">{source.description}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                                <div className="flex items-center gap-1.5">
                                                    {source.type === 'pdf' ? <LayoutGrid size={12} /> : <Link size={12} />}
                                                    <span>{source.type === 'pdf' ? `${source.pages} Pages` : `Depth: ${source.depth}`}</span>
                                                </div>
                                                <div className={`flex items-center gap-1.5 ${source.type === 'web' && source.status === 'Processing' ? 'text-[#fab728]' : ''}`}>
                                                    {source.type === 'web' && source.status === 'Processing' ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                                                    <span>{source.timeAgo}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleManageSource(source)}
                                                    className={`flex-1 py-3 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${source.type === 'pdf' ? 'bg-primary-500 hover:bg-primary-400 shadow-primary-500/20' : 'bg-[#fab728] hover:bg-[#e6a623] shadow-amber-500/20'}`}
                                                >
                                                    Manage <ChevronRight size={14} strokeWidth={3} />
                                                </button>
                                                <button onClick={() => handleDeleteSource(source.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-700"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </MobileCarousel>

                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {dataSources.map((source: DataSource) => (
                                <div key={source.id} className="bg-white dark:bg-[#161b2e] border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] hover:shadow-2xl transition-all duration-500 group relative overflow-hidden flex flex-col justify-between min-h-[260px] h-full">
                                    <div className={`absolute top-0 right-0 w-32 h-32 ${source.type === 'pdf' ? 'bg-primary-500/5 group-hover:bg-primary-500/10' : 'bg-amber-500/5 group-hover:bg-amber-500/10'} blur-[60px] rounded-full pointer-events-none transition-all`}></div>
                                    <div>
                                        <div className="flex justify-between items-start mb-8">
                                            <div className={`size-14 bg-slate-50 dark:bg-[#1e253c] ${source.type === 'pdf' ? 'text-primary-500 group-hover:rotate-3' : 'text-[#fab728] group-hover:-rotate-3'} rounded-2xl flex items-center justify-center shadow-inner border border-slate-100/50 dark:border-slate-700/50 transform transition-transform group-hover:scale-110`}>
                                                {source.type === 'pdf' ? <FileText size={28} strokeWidth={1.5} /> : <Globe size={28} strokeWidth={1.5} />}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{source.status}</span>
                                            </div>
                                        </div>
                                        <h3 className={`text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight ${source.type === 'pdf' ? 'group-hover:text-primary-500' : 'group-hover:text-[#fab728]'} transition-colors line-clamp-2`}>{source.name}</h3>
                                        <p className="text-xs text-slate-500 mb-6 font-medium">{source.description}</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                            <div className="flex items-center gap-1.5">
                                                {source.type === 'pdf' ? <LayoutGrid size={12} /> : <Link size={12} />}
                                                <span>{source.type === 'pdf' ? `${source.pages} Pages` : `Depth: ${source.depth}`}</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${source.type === 'web' && source.status === 'Processing' ? 'text-[#fab728]' : ''}`}>
                                                {source.type === 'web' && source.status === 'Processing' ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                                                <span>{source.timeAgo}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleManageSource(source)}
                                                className={`flex-1 py-3 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${source.type === 'pdf' ? 'bg-primary-500 hover:bg-primary-400 shadow-primary-500/20' : 'bg-[#fab728] hover:bg-[#e6a623] shadow-amber-500/20'}`}
                                            >
                                                Manage <ChevronRight size={14} strokeWidth={3} />
                                            </button>
                                            <button onClick={() => handleDeleteSource(source.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-700"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : (
                    /* Tools Gallery Grid */
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Integrations</h2>
                                <p className="text-xs text-slate-500 font-medium">Power up your agents with custom APIs and logic scripts.</p>
                            </div>
                            <button
                                onClick={() => setIsAddToolOpen(true)}
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-[1.25rem] font-bold flex items-center gap-2.5 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
                            >
                                <Plus size={20} /> New Tool
                            </button>
                        </div>

                        {/* Mobile Tools Carousel */}
                        <MobileCarousel>
                            {mockTools.map((tool) => (
                                <div key={tool.id} className="min-w-[85vw] mr-4 snap-center">
                                    <div className="bg-white dark:bg-[#161b2e] border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] hover:shadow-2xl transition-all duration-500 group flex flex-col justify-between min-h-[300px] h-full">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div className={`size-14 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100/50 dark:border-slate-700/50 transform transition-transform group-hover:scale-110 ${tool.type === 'api' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'
                                                    }`}>
                                                    {tool.type === 'api' ? <Cpu size={28} /> : <Code2 size={28} />}
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{tool.status}</span>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary-500 transition-colors">{tool.name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 underline decoration-slate-200 dark:decoration-slate-800 underline-offset-4 uppercase tracking-[0.1em] mb-4">
                                                    {tool.type === 'api' ? 'REST API Endpoint' : 'JavaScript Script'}
                                                </p>
                                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{tool.description}</p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users size={12} className="text-slate-400" />
                                                    <div className="flex -space-x-2">
                                                        {tool.agents.map((_, i) => (
                                                            <div key={i} className="size-5 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-[#161b2e]"></div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{tool.agents.length} Agent{tool.agents.length !== 1 && 's'}</span>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-400 lowercase italic">{tool.lastSync}</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(tool.type === 'api' ? `/tools/${tool.id}` : `/tools/script/${tool.id}`)}
                                                    className="flex-1 py-3 bg-primary-500 hover:bg-primary-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary-500/10 active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    Configure
                                                </button>
                                                <button className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-700">
                                                    <Settings size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </MobileCarousel>

                        {/* Desktop Tools Grid */}
                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {mockTools.map((tool) => (
                                <div key={tool.id} className="bg-white dark:bg-[#161b2e] border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] hover:shadow-2xl transition-all duration-500 group flex flex-col justify-between min-h-[300px] h-full">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className={`size-14 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100/50 dark:border-slate-700/50 transform transition-transform group-hover:scale-110 ${tool.type === 'api' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'
                                                }`}>
                                                {tool.type === 'api' ? <Cpu size={28} /> : <Code2 size={28} />}
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{tool.status}</span>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary-500 transition-colors">{tool.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 underline decoration-slate-200 dark:decoration-slate-800 underline-offset-4 uppercase tracking-[0.1em] mb-4">
                                                {tool.type === 'api' ? 'REST API Endpoint' : 'JavaScript Script'}
                                            </p>
                                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{tool.description}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users size={12} className="text-slate-400" />
                                                <div className="flex -space-x-2">
                                                    {tool.agents.map((_, i) => (
                                                        <div key={i} className="size-5 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-[#161b2e]"></div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{tool.agents.length} Agent{tool.agents.length !== 1 && 's'}</span>
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-400 lowercase italic">{tool.lastSync}</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(tool.type === 'api' ? `/tools/${tool.id}` : `/tools/script/${tool.id}`)}
                                                className="flex-1 py-3 bg-primary-500 hover:bg-primary-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary-500/10 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Configure
                                            </button>
                                            <button className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-700">
                                                <Settings size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Floating Health Status */}
            <div className="fixed bottom-8 right-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 pl-8 pr-4 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 border border-white/10 dark:border-black/5 z-50 backdrop-blur-xl group hover:scale-105 transition-all duration-500">
                <div className="flex gap-8 items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#55b7e0]">System Health</span>
                        <span className="text-lg font-black flex items-center gap-2">
                            98.2%
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Optimal</span>
                        </span>
                    </div>
                    <div className="h-10 w-px bg-white/10 dark:bg-slate-200"></div>
                </div>
                <button className="size-14 bg-[#55b7e0] text-white rounded-full flex items-center justify-center shadow-lg shadow-sky-500/40 group-hover:rotate-[360deg] transition-all duration-1000 ease-in-out">
                    <CheckCircle2 size={24} strokeWidth={3} />
                </button>
            </div>

            {/* MODALS */}

            {/* Add Source Modal */}
            {isAddSourceOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#161b2e] w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Data Source</h2>
                                <p className="text-sm text-slate-500 mt-1">Select the type of content you want to upload or connect.</p>
                            </div>
                            <button onClick={() => setIsAddSourceOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10 bg-[#f8f9fa] dark:bg-[#0a0d18]">
                            {selectedDocument ? (
                                <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in fade-in duration-300">
                                    <div className="size-20 bg-primary-50 dark:bg-[#1e253c] text-primary-500 rounded-3xl flex items-center justify-center shadow-inner border border-primary-100 dark:border-primary-500/20">
                                        <FileText size={40} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedDocument.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium">Ready to be indexed into the AI Knowledge Base.</p>
                                    </div>
                                    <div className="flex gap-4 w-full max-w-sm mt-4">
                                        <button
                                            onClick={() => setSelectedDocument(null)}
                                            className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-all flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirmSync}
                                            disabled={isUploading}
                                            className="px-6 py-3.5 bg-[#55b7e0] hover:bg-[#4aa3c8] text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex-[2] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                            Save and Sync with AI Agent
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                    {[
                                        { icon: FileText, label: "PDF", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
                                        { icon: File, label: "Word", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                                        { icon: FileSpreadsheet, label: "CSV", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                                        { icon: HelpCircle, label: "FAQ", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
                                        { icon: Globe, label: "Website", color: "text-[#fab728]", bg: "bg-amber-50 dark:bg-amber-900/20" }
                                    ].map((type, idx) => (
                                        <button
                                            key={idx}
                                            onClick={type.label === 'PDF' ? () => fileInputRef.current?.click() : undefined}
                                            className="flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#161b2e] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-[#55b7e0] hover:shadow-xl transition-all group"
                                        >
                                            <div className={`size-14 rounded-2xl flex items-center justify-center ${type.bg} ${type.color} group-hover:scale-110 transition-transform`}>
                                                <type.icon size={28} strokeWidth={1.5} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Source & AI Notes Chat Modal */}
            {isManageSourceOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#161b2e] w-full max-w-4xl h-[600px] rounded-[2rem] shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-200">
                        {/* Summary / Meta Section */}
                        <div className="w-1/3 bg-[#f8f9fa] dark:bg-[#0a0d18] p-10 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                            <div className="size-24 bg-slate-100 dark:bg-[#161b2e] border border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-center text-[#55b7e0] shadow-inner mb-6">
                                <FileText size={48} strokeWidth={1} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center leading-tight">{selectedDocument ? selectedDocument.name : "Company_Policy_2024.pdf"}</h3>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 mb-10">Indexed</span>

                            <button onClick={() => selectedDocument && handleDeleteSource(selectedDocument.documentId)} className="w-full py-3.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                <Trash2 size={18} /> Delete Source
                            </button>
                        </div>

                        {/* AI Notes Sidebar Chat */}
                        <div className="flex-1 flex flex-col p-10">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <MessageSquare size={20} className="text-[#55b7e0]" />
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Context Notes</h2>
                                </div>
                                <button onClick={() => setIsManageSourceOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-4">
                                {chatNotes.map(note => (
                                    <div key={note.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 group relative">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 pr-8">{note.text}</p>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 block">{note.time}</span>
                                        <button
                                            onClick={() => {
                                                const confirmDelete = window.confirm("Are you sure you want to delete this note from the Knowledge Base?");
                                                if (!confirmDelete) return;
                                                
                                                const newNotes = chatNotes.filter(n => n.id !== note.id);
                                                setChatNotes(newNotes);
                                                if (selectedDocument) updateNotesInN8n(selectedDocument.documentId, newNotes.map(n => n.text));
                                            }}
                                            className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 relative">
                                <input
                                    type="text"
                                    placeholder="Add a context note for the AI to follow..."
                                    className="w-full bg-[#f8f9fa] dark:bg-[#0a0d18] border border-slate-200 dark:border-slate-800 rounded-xl text-sm px-5 py-4 text-slate-700 dark:text-slate-300 focus:border-[#55b7e0] outline-none transition-all pr-14"
                                    value={aiNote}
                                    onChange={(e) => setAiNote(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                                />
                                <button
                                    onClick={handleSendNote}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#55b7e0] text-white rounded-lg hover:bg-[#4aa3c8] transition-all"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tool Selection Modal */}
            {isAddToolOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#161b2e] w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-[#f8f9fa] dark:bg-[#0a0d18]">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Active Integration</h2>
                                <p className="text-sm text-slate-500 mt-1">Select the type of capability you want to add.</p>
                            </div>
                            <button onClick={() => setIsAddToolOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-12 flex gap-8">
                            <div
                                onClick={() => navigate('/tools/new/api')}
                                className="flex-1 bg-white dark:bg-[#0a0d18] border-2 border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:border-[#55b7e0] hover:shadow-2xl transition-all cursor-pointer group flex flex-col items-center text-center"
                            >
                                <div className="size-20 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-[#55b7e0] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                    <Cpu size={40} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">API Connection</h3>
                                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">Connect to external RESTful services to fetch live data or trigger background systems.</p>
                            </div>

                            <div
                                onClick={() => navigate('/tools/new/script')}
                                className="flex-1 bg-white dark:bg-[#0a0d18] border-2 border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:border-purple-500 hover:shadow-2xl transition-all cursor-pointer group flex flex-col items-center text-center"
                            >
                                <div className="size-20 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                    <Code2 size={40} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">JS Script</h3>
                                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">Write native JavaScript to perform data formatting, math calculations, and custom local logic.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};