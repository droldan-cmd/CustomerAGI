# CustomerAGI — Website Structure Document

> **Project Name:** CustomerAGI (internally: Innagent)  
> **Version:** Workspace v2.4  
> **Last Updated:** February 19, 2026

---

## 1. Website Purpose

CustomerAGI is a **unified AI Agent Management Platform** designed for teams that build, configure, test, and monitor AI-powered agents for **any business function** — customer support, sales, onboarding, internal operations, and more. It provides a single dashboard to:

- **Build AI agents** — define their personality, system prompt, tone, and behavior type.
- **Configure knowledge sources** — feed agents with PDFs and web crawls.
- **Connect external tools** — attach REST APIs, JavaScript snippets, and third-party integrations.
- **Review conversations** — browse historical interactions, tag them, and analyze them.
- **Manage workspace settings** — handle team members, branding, localization, and billing.

> [!NOTE]
> No AI service is currently connected to power the agent preview or conversation analysis. These features exist as UI scaffolding and will display placeholder messages (e.g., "No AI Connected yet") when triggered.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 (port 3000) |
| **Styling** | TailwindCSS (CDN with custom config) |
| **Icons** | Lucide React v0.574 |
| **Routing** | React Router DOM v7 (HashRouter) |
| **Font** | Inter (Google Fonts, weights 300–900) |

> [!IMPORTANT]
> This tech stack may change as the project evolves to ensure **scalability** and a more **aesthetically pleasing** result.

---

## 3. Application Layout

The app uses a **fixed sidebar + main content** layout:

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (264px)  │         Main Content Area        │
│                   │                                  │
│  Logo + Brand     │  Page Header (sticky, 64px)      │
│  Nav Links        │──────────────────────────────────│
│  Admin Section    │                                  │
│                   │  Page Body (scrollable)           │
│  "New Agent" Btn  │                                  │
│  User Profile     │                                  │
└──────────────────────────────────────────────────────┘
```

The root component [App.tsx](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/App.tsx) wraps every page inside a `<Layout>` that renders the Sidebar alongside the routed page content.

---

## 4. Main Pages

### 4.1 AI Team (`/agents`) — Default route

> Previously called "Agent Builder." This is now the **AI Team** section, with the **Agent Builder** as a sub-page for configuring individual agents.

**File:** [AgentBuilder.tsx](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/AgentBuilder.tsx)

**Purpose:** The core page for creating and configuring an AI agent. Uses a **split-panel layout** — configuration form on the left, chat preview panel on the right (400px).

**Left Panel — Agent Configuration:**
- **Header bar** with breadcrumb (`AI Team / {Agent Name}`) and action buttons.
- **Identity card:**
  - `Agent Name` — text input
  - `Agent Type` — dropdown (`Goal-driven`, `Script-based`, `Hybrid`)
  - `Description` — textarea (2 rows)
- **AI Role & Instructions card** (sparkle icon accent):
  - `System Prompt` — large textarea (8 rows, monospaced font)
  - Helper text: "Changes here will affect the preview after you click Refresh."
- **Tone & Style card:**
  - 5 selectable pill buttons: `Professional`, `Friendly`, `Concise`, `Empathetic`, **[Custom](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/Dashboard.tsx#111-126)**
  - The **Custom** option reveals a text input where the user can type their preferred tonality
  - Selected state shows primary blue border + tinted background

**Right Panel — Agent Preview (400px):**
- Header with green pulsing dot ("Agent Preview") and Refresh button
- Chat interface with message bubbles (static — no AI connected)
- Text input with Send button (disabled when empty)
- Footer with "Testing as: Standard User" label and "Clear History" link

---

### 4.2 Knowledge & Tools (`/knowledge`)

**File:** [KnowledgeBase.tsx](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/KnowledgeBase.tsx)

**Purpose:** Manage the data sources that feed agent intelligence, and configure external tool integrations.

**Header:**
- Title "Knowledge & Tools"
- Storage usage indicator: `2.4 GB / 10 GB` with a thin progress bar (24% filled)

**Tab Bar:**
- `📄 Knowledge Base` — active (primary underline)
- `🧩 Tools & API` — navigates to the **Tool Config** sub-page (`/tools/:id`)

**Data Sources Section (grid):**

| Card | Icon Color | Status | Details |
|---|---|---|---|
| `Company_Policy_2024.pdf` | Accent | Indexed | 1.2 MB · 42 Pages · Added 2d ago |
| `docs.product.com` | Accent | Processing | Crawl Depth: 3 · ⟳ Updating… (spinning) |

Each card has:
- Source-type icon (colored background)
- Status badge (slate tones for all states)
- Title (hover → primary color transition)
- Description (1-line clamp)
- Metadata row
- Footer with **Manage** button and **Delete** (trash) icon button

**Tools & Extensions Section:**
- Table listing connected tools (e.g., "Customer CRM API")
- Columns: Name & Status, Type, Last Sync, Actions
- **Config** pill button navigates to `/tools/:id`
- Settings gear icon button

**Floating Status Widget (fixed bottom-right):**
- Dark pill showing "Global Index Health: 98.2% Accurate"
- Checkmark badge

---

### 4.3 Tool Configuration (`/tools/:id`)

**File:** [ToolConfig.tsx](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/ToolConfig.tsx)

**Purpose:** Detail page for configuring a specific tool's API connection, headers, request body, and custom code.

**Header:**
- Back link → `/knowledge`
- Title: "Configure Customer CRM API"
- Active status badge
- Delete button (trash icon)

**Tab Bar (functional):**
- `🔗 API Connection` — contains the HTTP request configuration (method, endpoint URL, headers, add/remove headers, body, content type) — full RESTful API requirements for any HTTP request
- `💻 Custom JS Code` — contains a **mini JavaScript code editor** for writing custom integration scripts

**Left Panel — Configuration Form:**
- **Request Configuration:** HTTP Method dropdown (`GET`, `POST`, `PUT`, `DELETE`) + Endpoint URL input (monospaced)
- **Headers:** Key-value pair rows with Add Header link and Remove (X) buttons
- **Request Body (JSON):** Styled code block with syntax highlighting (dark background, colored keys/values, line numbers)
- Utility links: Beautify, Copy

**Right Panel — Test Console (400px):**
- **Input Data (Mock):** Key-value pairs (`user_id`, `context`) with editable values
- **Output Console:** Dark terminal-style panel showing mock response with color-coded syntax
- **Run Test** button

---

### 4.4 Conversation History (`/conversations`)

**File:** [ConversationHistory.tsx](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/ConversationHistory.tsx)

**Purpose:** Browse, search, and analyze past interactions.

**Left Sidebar (400px) — Conversation List:**
- Header with "History" title and **Analyze Bulk** button (sparkle icon)
- Search input with magnifier icon
- Conversation items showing: User ID, timestamp, message preview (1-line clamp), status badge, agent name

**Main Panel — Message Reading Pane:**
- Header bar: User avatar, ID, session info, action buttons (**Tag**, **Export**, **Analyze Flow**)
- Date divider
- Chat messages with role-specific styling (bot left-aligned, user right-aligned, human agent amber-styled)
- **Escalation divider** — orange line with "Escalated to Agent Sarah Miller"

**Bottom Bar — Metadata Panel:**
- **Applied Tags:** Fully customizable — users can **add**, **remove**, and **edit** tag names
- **AI Summary:** Displays placeholder text (no AI connected)

---

### 4.5 Settings (`/settings`)

**File:** [Settings.tsx](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/Settings.tsx)

**Purpose:** Workspace configuration — branding, localization, team management.

**Tab Bar (3 tabs):**
- `🏢 General` — active
- `👥 Workspace`
- `💳 Billing`

**General Settings Section:**
- **Workspace Branding:** Logo upload area (dashed border, hover effect), Workspace Name input
- **Localization:** Language dropdown + Timezone dropdown
- **Save Changes** button → displays **"Saved"** confirmation when clicked

**Team Management Section:**
- **Invite Member** button (ghost style, primary tint)
- Team table: Name (avatar initials + email), Role, Status badge, Options (three-dot menu)

---

### 4.6 Planned but Disabled Pages

Two sidebar links exist but are **disabled** (greyed out, unclickable):
- `📊 Dashboard` (`/dashboard`)
- `📈 Analytics` (`/analytics`)

---

## 5. Sidebar Component

**File:** [Sidebar.tsx](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/components/Sidebar.tsx)

**Structure (top to bottom):**

1. **Logo Block:** Primary colored square (rounded-xl) with Bot icon + "BotNexus" title + "Workspace v2.4" subtitle
2. **Navigation Links:**
   - Dashboard *(disabled)*
   - AI Team (formerly "Agents")
   - Knowledge Base
   - Conversations
   - Analytics *(disabled)*
3. **Administration Section** ("ADMINISTRATION" label, uppercase)
4. **Admin Links:**
   - Settings
5. **Bottom Section:**
   - **"+ New Agent" button** — full-width, primary color, bold, with `active:scale-[0.98]` press effect
   - **User profile row:** Avatar, "Alex Rivera", "Pro Plan"

---

## 6. Complete Button Inventory

### Sidebar
| Button | Action |
|---|---|
| `+ New Agent` | *Placeholder — no handler* |
| Nav links | Navigate to respective routes |

### AI Team / Agent Builder Page
| Button | Action |
|---|---|
| `Save Draft` | *Placeholder* |
| `Publish Agent` | *Placeholder* |
| Tone pills (Professional, Friendly, Concise, Empathetic, **Custom**) | Updates `config.tone` state; Custom reveals a text input |
| `Duplicate into a Team` *(new — via dropdown)* | Duplicates the current agent config into the team |
| `Refresh ↻` (preview panel) | Restarts the preview chat |
| `Send ➤` (preview panel) | *No AI connected — blank/placeholder* |
| `Clear History` | Empties message array |

### Knowledge & Tools Page
| Button | Action |
|---|---|
| `Filter` | *Placeholder* |
| `+ Add New Source` | *Placeholder* |
| `Manage` (per card) | *Placeholder* |
| `🗑️ Delete` (per card) | *Placeholder* |
| `Connect Tool` | *Placeholder* |
| [Config](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/types.ts#1-10) (tools table) | Navigates to `/tools/:id` |
| `⚙️ Settings` (tools table) | *Placeholder* |
| Tab: `Tools & API` | Opens the Tool Config sub-page |

### Tool Config Page
| Button | Action |
|---|---|
| `← Back to Knowledge & Tools` | Navigates to `/knowledge` |
| `🗑️ Delete` (header) | *Placeholder* |
| `Add Header` | *Placeholder* |
| `✕ Remove` (per header row) | *Placeholder* |
| `Beautify` / `Copy` | *Placeholder* |
| `▶ Run Test` | *Placeholder* |
| Tab: `API Connection` | Shows RESTful API configuration form |
| Tab: `Custom JS Code` | Shows mini JS code editor |

### Conversation History Page
| Button | Action |
|---|---|
| `✨ Analyze Bulk` | *Placeholder* |
| `🏷️ Tag` | **Customizable** — add, remove, or edit tag names |
| `📥 Export` | *Placeholder* |
| `✨ Analyze Flow` | Displays **"No AI Connected yet"** popup |

### Settings Page
| Button | Action |
|---|---|
| `Save Changes` | Displays **"Saved"** confirmation |
| `Upload new logo` | *Placeholder* |
| `Invite Member` | *Placeholder* |
| `⋯` More options (team table) | *Placeholder* |

---

## 7. Design Choices

### 7.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| **Primary (brand blue)** | **`#55b7e0`** | CTAs, active states, links, accents |
| **Light mode BG** | `#f5f6f8` | Main area background |
| **Dark mode BG** | `#101422` | Root dark background |
| Dark card BG | `#161b2e` | Cards, sidebar, headers in dark mode |
| Dark deepest | `#0a0d18` | Page body in dark mode |
| **Orange** | **`#fab728`** | "Processing" / "Escalated" warning states |
| **Slate grays** | Various | Text hierarchy, borders, muted elements, **all status badges** ("Active", "Indexed", "Resolved"), **delete hover states**, and icon accents |

> [!NOTE]
> The palette is intentionally minimal — slate tones are used for **all** status badges and destructive-action hover states rather than semantic greens/reds. This keeps the UI cohesive and brand-focused.

### 7.2 Typography

- **Font family:** Inter (Google Fonts) — clean, modern sans-serif
- **Weights used:** 300–900
- **Code/mono text:** Default monospace for API URLs, JSON, system prompts
- **Label patterns:** `text-[10px] uppercase tracking-wider font-bold text-slate-400` for section sub-labels
- **Anti-aliased** rendering via `antialiased` on `<body>`

### 7.3 UI Aesthetic

- Professional SaaS dashboard, inspired by tools like Linear, Vercel, and Retool
- **Card-based layout** — all form sections wrapped in `rounded-xl border shadow-sm` cards
- **Full dark-mode support** via Tailwind's `dark:` modifier (class-based, no visible toggle yet)
- **Custom scrollbars** — 6px thin thumbs, transparent tracks, dark-mode aware
- **Hidden scrollbars** on certain panels via `.no-scrollbar`

### 7.4 Animations & Micro-interactions

| Element | Animation |
|---|---|
| Agent preview "online" dot | **Pulsing glow** (`animate-pulse`) |
| Typing indicator (3 dots) | **Bouncing dots** (`animate-bounce` with staggered delays) |
| Web source "Updating…" spinner | **Rotating symbol** (`animate-spin`) |
| AI analysis indicator | **Pulsing dot** (`animate-pulse`) |
| "New Agent" button press | **Scale down** (`active:scale-[0.98]`) |
| All buttons | **Color transitions** (`transition-colors` / `transition-all`) |
| Data source cards on hover | **Shadow lift** (`hover:shadow-lg transition-all duration-300`) |
| Card titles on hover | **Color shift** (`group-hover:text-primary transition-colors`) |
| Form inputs on focus | **Ring highlight** (`focus:ring-2 focus:ring-primary`) |
| Nav links | **Background highlight** on hover/active |
| Chat messages | **Smooth auto-scroll** (`scrollIntoView({ behavior: 'smooth' })`) |
| Status badges | **Pill-shaped** (`rounded-full`) |

---

## 8. Routing Structure

| Path | Component | Status |
|---|---|---|
| `/` | → Redirect to `/agents` | Active |
| `/agents` | `AI Team / AgentBuilder` | Active |
| `/knowledge` | [KnowledgeBase](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/KnowledgeBase.tsx#82-772) | Active |
| `/tools/:id` | `ToolConfig` | Active (param-based) |
| `/conversations` | [ConversationHistory](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/ConversationHistory.tsx#19-302) | Active |
| `/settings` | [Settings](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/pages/Settings.tsx#19-379) | Active |
| `/dashboard` | *None (disabled link)* | Planned |
| `/analytics` | *None (disabled link)* | Planned |

**Router type:** `HashRouter` (fragment-based URLs)

---

## 9. Data Models

Defined in [types.ts](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/types.ts):

| Interface | Fields |
|---|---|
| [AgentConfig](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/types.ts#1-10) | id, name, description, role, type (goal-driven/script-based/hybrid), tone (professional/friendly/concise/empathetic/**custom**) |
| [Message](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/types.ts#11-17) | id, role (user/model), text, timestamp |
| [KnowledgeSource](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/types.ts#18-26) | id, name, type (**pdf/web**), status (indexed/processing/error), meta, date |
| [Tool](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/types.ts#27-35) | id, name, type (REST API/JS Snippet/Integration), description, lastSync, status (active/inactive) |
| [Conversation](file:///c:/Users/Daniel%20Roldan%20CT/Desktop/Innagent%20%20CustomerAGI%20Proyect/Innagent/types.ts#36-44) | id, userId, preview, timestamp, status (resolved/escalated/ongoing), agent |

---

## 10. Key Observations

> [!NOTE]
> Most buttons are **UI placeholders**. The only functional interactions currently are:
> - Tone selection (updates component state)
> - Navigation between pages (React Router)
> - "Analyze Flow" → shows "No AI Connected yet"
> - "Save Changes" in Settings → shows "Saved"
> - Tags in Conversations → customizable (add, remove, edit)

> [!IMPORTANT]
> The application is in a **prototype/demonstration stage**. Data is hardcoded (mock), there is no backend, and no AI service is connected. Features like Dashboard, Analytics, bulk analysis, and tool testing are not yet implemented.

> [!TIP]
> Dark mode is class-based (`darkMode: "class"`) but has no visible toggle in the UI yet.
