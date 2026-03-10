import React, { useState, useEffect } from 'react';
import { Responsive } from 'react-grid-layout';
import { WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
    Plus, Search, GripHorizontal, X, MessageSquare, Bot, Send, Database,
    Zap, Sparkles, TrendingUp, Bell, ChevronDown, Trash2
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- Mock Data ---

const kpiData = [
    { id: 'kpi_1', label: 'Active Conversations', value: '847', icon: MessageSquare, color: '#55b7e0' },
    { id: 'kpi_2', label: 'Total Agents Deployed', value: '12', icon: Bot, color: '#fab728' },
    { id: 'kpi_3', label: 'Messages Processed Today', value: '3,291', icon: Send, color: '#0ea5e9' },
    { id: 'kpi_4', label: 'Average Resolution Time', value: '4m 12s', icon: Zap, color: '#8b5cf6' },
];

const conversationsData = [
    { day: 'Mon', count: 120 }, { day: 'Tue', count: 180 }, { day: 'Wed', count: 150 },
    { day: 'Thu', count: 240 }, { day: 'Fri', count: 210 }, { day: 'Sat', count: 90 }, { day: 'Sun', count: 110 }
];

const sentimentData = [
    { time: '10am', positive: 80, neutral: 45, negative: 10 },
    { time: '12pm', positive: 85, neutral: 40, negative: 15 },
    { time: '2pm', positive: 95, neutral: 30, negative: 5 },
    { time: '4pm', positive: 60, neutral: 50, negative: 20 },
    { time: '6pm', positive: 110, neutral: 20, negative: 8 },
];

const humanVsAiData = [
    { day: 'Mon', ai: 400, human: 120 },
    { day: 'Tue', ai: 500, human: 90 },
    { day: 'Wed', ai: 450, human: 150 },
    { day: 'Thu', ai: 600, human: 80 },
    { day: 'Fri', ai: 550, human: 110 },
];

const topicsData = [
    { name: 'Billing', value: 400, color: '#55b7e0' },
    { name: 'Technical', value: 300, color: '#8b5cf6' },
    { name: 'Onboarding', value: 300, color: '#fab728' },
    { name: 'Account', value: 200, color: '#f43f5e' },
];

const radarData = [
    { subject: 'Speed', A: 120, B: 110, fullMark: 150 },
    { subject: 'Accuracy', A: 98, B: 130, fullMark: 150 },
    { subject: 'Sentiment', A: 86, B: 130, fullMark: 150 },
    { subject: 'Handling', A: 99, B: 100, fullMark: 150 },
    { subject: 'Retention', A: 85, B: 90, fullMark: 150 },
];

const mountainAgents = [
    { name: 'Support Bot', score: 98, color: '#10b981' },
    { name: 'Sales Agent', score: 75, color: '#55b7e0' },
    { name: 'FAQ Helper', score: 62, color: '#8b5cf6' },
    { name: 'Billing Bot', score: 40, color: '#fab728' },
    { name: 'Onboarding AI', score: 25, color: '#f43f5e' }
];

const agents = ['Support Bot', 'Sales Agent', 'Onboarding AI', 'Billing Bot', 'FAQ Helper'];
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const heatmapData = agents.map(agent => ({
    agent,
    data: daysOfWeek.map(day => ({
        day,
        value: Math.floor(Math.random() * 100),
    })),
}));
const getHeatmapColor = (value: number): string => {
    if (value < 15) return '#1e293b';
    if (value < 30) return '#1a3a4a';
    if (value < 50) return '#1a5066';
    if (value < 70) return '#2a7a99';
    if (value < 85) return '#55b7e0';
    return '#7dd3fc';
};

// --- Sub-Components ---

const GlowFilter = () => (
    <defs>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#55b7e0" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#55b7e0" stopOpacity={0} />
        </linearGradient>
    </defs>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-3 text-xs text-white">
                <p className="font-bold text-slate-300 mb-1">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} style={{ color: entry.color }} className="font-medium drop-shadow-md">
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Extracted Complex Charts
const MountainTracker = () => {
    const layers = 18;
    const topoLayers = React.useMemo(() => {
        let paths = [];
        for (let i = 0; i < layers; i++) {
            const scale = 1 - (i / layers);
            const yOffset = 260 - (i * 12);
            const points = [];
            const numPoints = 14 + Math.floor(scale * 12);
            for (let j = 0; j <= numPoints; j++) {
                const angle = (j / numPoints) * Math.PI * 2;
                const baseRX = 200 * scale;
                const baseRY = 80 * scale;
                const noise = 1 + (Math.sin(angle * 5 + i) * 0.15) + (Math.cos(angle * 3 - i) * 0.1);
                const px = 250 + (Math.cos(angle) * baseRX * noise);
                const py = yOffset + (Math.sin(angle) * baseRY * noise);
                points.push(`${j === 0 ? 'M' : 'L'} ${px} ${py}`);
            }
            paths.push({ key: `topo-${i}`, d: points.join(' ') + ' Z', opacity: 0.35 + (i * 0.03) });
        }
        return paths;
    }, []);

    // Compute pin positions (these stay fixed in 2D overlay)
    const sortedAgents = React.useMemo(() => [...mountainAgents].sort((a, b) => a.score - b.score), []);
    const pinPositions = React.useMemo(() => {
        return sortedAgents.map(agent => {
            const ratio = agent.score / 100;
            const sx = 130, sy = 290, ex = 250, ey = 50;
            const cx = sx + ((ex - sx) * ratio) + (Math.sin(ratio * Math.PI) * 45);
            const cy = sy - ((sy - ey) * ratio);
            const pinH = 35 + (agent.score * 0.12);
            return { ...agent, cx, cy, pinH };
        });
    }, []);

    return (
        <div className="w-full h-full relative overflow-hidden rounded-xl" style={{ perspective: '800px' }}>
            {/* 3D Rotating Mountain Body */}
            <div className="absolute inset-0 flex items-center justify-center mountain-rotate-container" style={{ transformStyle: 'preserve-3d' }}>
                <svg className="w-full h-full" viewBox="0 0 500 350" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#55b7e0" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#55b7e0" stopOpacity={0.05} />
                        </linearGradient>
                        <filter id="mountainGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Topo Layers */}
                    {topoLayers.map(layer => (
                        <path key={layer.key} d={layer.d}
                            fill={`rgba(20, 30, 50, ${layer.opacity})`}
                            stroke="rgba(85, 183, 224, 0.15)"
                            strokeWidth="1.2" />
                    ))}

                    {/* Mountain silhouette fill */}
                    <path d="M50 290 Q150 260 250 40 Q350 260 450 290 Z"
                        fill="url(#mountainGrad)" stroke="#55b7e0" strokeWidth="2" filter="url(#mountainGlow)" />

                    {/* Route Dashed Line */}
                    <path d="M120 280 C180 250, 160 200, 220 180 C260 160, 240 120, 248 55"
                        fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeDasharray="6,4" />
                </svg>
            </div>

            {/* 2D Fixed Pin Overlay (does NOT rotate) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 350" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <filter id="pinGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                {pinPositions.map(agent => (
                    <g key={agent.name} className="pointer-events-auto cursor-pointer">
                        <line x1={agent.cx} y1={agent.cy} x2={agent.cx} y2={agent.cy - agent.pinH}
                            stroke={agent.color} strokeWidth="2.5" opacity="0.85" />
                        <ellipse cx={agent.cx} cy={agent.cy} rx="8" ry="4"
                            fill="transparent" stroke={agent.color} strokeWidth="1.5" opacity="0.5" />
                        <circle cx={agent.cx} cy={agent.cy} r="2.5" fill={agent.color} />
                        <circle cx={agent.cx} cy={agent.cy - agent.pinH} r="16"
                            fill={agent.color} filter="url(#pinGlow)" />
                        <text x={agent.cx} y={agent.cy - agent.pinH + 5} fontSize="12" fill="white"
                            textAnchor="middle" fontWeight="bold">{agent.score}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

// --- Main Component ---

export const DashboardStyle: React.FC = () => {
    // Layout State
    const [layouts, setLayouts] = useState<any>({
        lg: [
            { i: 'kpi_1', x: 0, y: 0, w: 3, h: 2 },
            { i: 'kpi_2', x: 3, y: 0, w: 3, h: 2 },
            { i: 'kpi_3', x: 6, y: 0, w: 3, h: 2 },
            { i: 'kpi_4', x: 9, y: 0, w: 3, h: 2 },
            { i: 'chart_trend', x: 0, y: 2, w: 6, h: 4 },
            { i: 'chart_mountain', x: 6, y: 2, w: 6, h: 4 },
            { i: 'chart_sentiment', x: 0, y: 6, w: 6, h: 4 },
            { i: 'chart_human_ai', x: 6, y: 6, w: 3, h: 4 },
            { i: 'chart_radar', x: 9, y: 6, w: 3, h: 4 },
        ]
    });

    const [activeWidgets, setActiveWidgets] = useState([
        'kpi_1', 'kpi_2', 'kpi_3', 'kpi_4', 'chart_trend', 'chart_mountain', 'chart_sentiment', 'chart_human_ai', 'chart_radar'
    ]);

    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showGraphModal, setShowGraphModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

    // Available catalog of widgets
    const widgetCatalog = [
        { id: 'chart_trend', title: 'Conversations Over Time' },
        { id: 'chart_mountain', title: 'Peak Performance Tracker' },
        { id: 'chart_sentiment', title: 'Sentiment Analysis Trends' },
        { id: 'chart_human_ai', title: 'Human vs. AI Intervention' },
        { id: 'chart_radar', title: 'Agent Performance Matrix' },
        { id: 'chart_topics', title: 'Top Resolution Topics' },
        { id: 'chart_heatmap', title: 'Agent Usage Heatmap' },
    ];

    const removeWidget = (id: string) => {
        setActiveWidgets(prev => prev.filter(w => w !== id));
        setShowConfirmModal(null);
    };

    const addWidget = (id: string) => {
        if (!activeWidgets.includes(id)) {
            setActiveWidgets(prev => [...prev, id]);
            
            // Add to layout
            const newLayout = [...layouts.lg];
            newLayout.push({ i: id, x: 0, y: Infinity, w: 6, h: 4 });
            setLayouts({ ...layouts, lg: newLayout });
        }
        setShowGraphModal(false);
    };

    const WidgetWrapper = ({ id, title, children, isKpi = false }: any) => {
        return (
            <div className={`w-full h-full rounded-[2rem] border relative group transition-colors duration-300
                ${isDarkMode ? 'bg-[#10141d]/80 border-white/5 shadow-2xl shadow-black/50 backdrop-blur-md' : 'bg-white border-slate-200 shadow-xl'}`}>
                
                {/* Header (Hidden until hover) */}
                <div className={`absolute top-0 left-0 right-0 h-10 px-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-t-[2rem]
                    ${isDarkMode ? 'bg-gradient-to-b from-[#1c212c] to-transparent' : 'bg-gradient-to-b from-slate-100 to-transparent'}`}>
                    
                    <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing draggable-handle">
                        <GripHorizontal size={14} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{title}</span>
                    </div>

                    <button onClick={() => setShowConfirmModal(id)} className="p-1 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                        <X size={14} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-6 h-full w-full pt-8 flex flex-col">
                    {!isKpi && <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>}
                    <div className="flex-1 w-full min-h-0 relative">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const renderWidget = (id: string) => {
        // KPI Render
        const kpi = kpiData.find(k => k.id === id);
        if (kpi) {
            return (
                <WidgetWrapper id={id} title={kpi.label} isKpi>
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div className={`size-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `${kpi.color}20`, color: kpi.color }}>
                                <kpi.icon size={24} style={{ filter: `drop-shadow(0 0 8px ${kpi.color}80)` }} />
                            </div>
                            <TrendingUp size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <h4 className={`text-3xl font-black mt-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</h4>
                            <p className="text-sm text-slate-500 mt-1 font-medium">{kpi.label}</p>
                        </div>
                    </div>
                </WidgetWrapper>
            );
        }

        // Feature Charts Render
        switch(id) {
            case 'chart_trend':
                return (
                    <WidgetWrapper id={id} title="Conversations Over Time">
                        <div className="relative w-full h-full">
                            <div className="absolute -inset-4 bg-[#55b7e0]/10 rounded-3xl blur-2xl pointer-events-none"></div>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={conversationsData}>
                                    <GlowFilter />
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600}} />
                                    <Area type="monotone" dataKey="count" name="Conversations" stroke="#55b7e0" strokeWidth={3} fill="url(#areaGrad)" filter="url(#neonGlow)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </WidgetWrapper>
                );
            case 'chart_mountain':
                return (
                    <WidgetWrapper id={id} title="Peak Performance Tracker">
                        <MountainTracker />
                    </WidgetWrapper>
                );
            case 'chart_sentiment':
                return (
                    <WidgetWrapper id={id} title="Sentiment Analysis Trends">
                        <div className="relative w-full h-full">
                            <div className="absolute -inset-4 bg-[#10b981]/10 rounded-3xl blur-2xl pointer-events-none"></div>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sentimentData}>
                                    <GlowFilter />
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} vertical={false} opacity={0.5}/>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600}} />
                                    <Line type="monotone" dataKey="positive" name="Positive" stroke="#10b981" strokeWidth={3} dot={{r: 4}} filter="url(#neonGlow)" />
                                    <Line type="monotone" dataKey="negative" name="Negative" stroke="#f43f5e" strokeWidth={3} dot={{r: 4}} filter="url(#neonGlow)" />
                                    <Line type="monotone" dataKey="neutral" name="Neutral" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} filter="url(#neonGlow)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </WidgetWrapper>
                );
            case 'chart_human_ai':
                return (
                    <WidgetWrapper id={id} title="Human vs. AI Intervention">
                        <div className="relative w-full h-full">
                            <div className="absolute -inset-4 bg-[#55b7e0]/10 rounded-3xl blur-2xl pointer-events-none"></div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={humanVsAiData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} horizontal={false} opacity={0.5} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="day" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} width={40} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600}} />
                                    <Bar dataKey="ai" name="AI Handled" stackId="a" fill="#55b7e0" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="human" name="Human Escalated" stackId="a" fill="#fab728" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </WidgetWrapper>
                );
            case 'chart_radar':
                return (
                    <WidgetWrapper id={id} title="Agent Performance Matrix">
                        <div className="relative w-full h-full">
                            <div className="absolute -inset-4 bg-[#8b5cf6]/10 rounded-3xl blur-2xl pointer-events-none"></div>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                                    <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10}} />
                                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600}} />
                                    <Radar name="Support Bot" dataKey="A" stroke="#55b7e0" fill="#55b7e0" fillOpacity={0.4} strokeWidth={2} />
                                    <Radar name="Sales Agent" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </WidgetWrapper>
                );
            case 'chart_topics':
                return (
                    <WidgetWrapper id={id} title="Top Resolution Topics">
                        <div className="relative w-full h-full">
                            <div className="absolute -inset-4 bg-[#55b7e0]/10 rounded-3xl blur-2xl pointer-events-none"></div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <GlowFilter />
                                    <Pie data={topicsData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                                        {topicsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} filter="url(#neonGlow)" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </WidgetWrapper>
                );
            case 'chart_heatmap':
                return (
                    <WidgetWrapper id={id} title="Agent Usage Heatmap">
                        <div className="relative w-full h-full">
                            <div className="absolute -inset-4 bg-[#55b7e0]/10 rounded-3xl blur-2xl pointer-events-none"></div>
                            <div className="w-full h-full overflow-auto">
                                {/* Legend bar */}
                                <div className="flex items-center justify-end gap-1.5 mb-3 text-[10px] font-medium" style={{color: '#64748b'}}>
                                    <span>Low</span>
                                    <div className="flex gap-0.5">
                                        {['#1e293b','#1a3a4a','#1a5066','#2a7a99','#55b7e0','#7dd3fc'].map(c => (
                                            <div key={c} className="w-3 h-3 rounded-sm" style={{backgroundColor: c}} />
                                        ))}
                                    </div>
                                    <span>High</span>
                                </div>
                                {/* Column headers */}
                                <div className="flex items-center mb-1">
                                    <div className="w-24 shrink-0" />
                                    {daysOfWeek.map(day => (
                                        <div key={day} className="flex-1 text-center text-[10px] font-bold uppercase tracking-wider" style={{color: '#64748b'}}>{day}</div>
                                    ))}
                                </div>
                                {/* Rows */}
                                {heatmapData.map(row => (
                                    <div key={row.agent} className="flex items-center gap-1 mb-1">
                                        <div className="w-24 shrink-0 text-xs font-semibold truncate pr-2" style={{color: '#94a3b8'}}>{row.agent}</div>
                                        {row.data.map(cell => (
                                            <div key={cell.day} className="flex-1 aspect-[2/1] rounded-md transition-colors"
                                                style={{backgroundColor: getHeatmapColor(cell.value)}}
                                                title={`${row.agent} — ${cell.day}: ${cell.value}`} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </WidgetWrapper>
                );
            default:
                return <WidgetWrapper id={id} title="Widget" />;
        }
    };

    return (
        <div className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-500
            ${isDarkMode ? 'bg-[#0d1017] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
            
            {/* --- Global Header --- */}
            <header className="flex justify-between items-center p-6 mb-2 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black tracking-tight" style={{fontFamily: "'Inter', sans-serif"}}>
                        Welcome, Alex <span className="inline-block hover:animate-pulse cursor-default">👋</span>
                    </h1>
                </div>

                {/* Central Tabs Navigation */}
                <div className={`hidden lg:flex items-center p-1.5 rounded-full border shadow-sm
                    ${isDarkMode ? 'bg-[#151a23] border-white/5' : 'bg-white border-slate-200'}`}>
                    {['Overview', 'Add Knowledge Source', 'View Latest Conversation', 'Add New Tool'].map((tab, i) => (
                        <button key={tab} className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300
                            ${i === 0 
                                ? 'bg-[#55b7e0] text-white shadow-[0_0_15px_rgba(85,183,224,0.4)]' 
                                : `hover:text-[#55b7e0] ${isDarkMode ? 'text-slate-400 relative' : 'text-slate-500 relative'} `
                            }`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full border ${isDarkMode ? 'bg-[#151a23] border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                        <Sparkles size={16} />
                    </button>
                    
                    {/* CTA */}
                    <button className="flex items-center gap-2 bg-[#55b7e0] hover:bg-[#3ba2cf] transition-all duration-300 rounded-full py-2.5 px-6 font-bold text-white shadow-[0_0_20px_rgba(85,183,224,0.3)] hover:shadow-[0_0_30px_rgba(85,183,224,0.6)]">
                        <Plus size={18} />
                        <span>Create a New Agent</span>
                    </button>
                </div>
            </header>

            {/* --- Dashboard Toolbar --- */}
            <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center z-20 relative">
                <div>
                     <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        AI Agent building platform and customer support
                    </p>
                </div>

                <button onClick={() => setShowGraphModal(true)} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border
                    ${isDarkMode ? 'bg-[#1c212c] text-white border-white/10 hover:bg-[#252b38]' : 'bg-white text-slate-800 border-slate-200 shadow-sm hover:bg-slate-50'}`}>
                    <Plus size={16} className="text-[#55b7e0]" /> Add Widget
                </button>
            </div>

            {/* --- The Grid Area --- */}
            <div className="max-w-[1600px] mx-auto px-4 pb-20 relative">
                {/* Background ambient glow */}
                {isDarkMode && <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-[#55b7e0]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>}

                {/* @ts-ignore - draggableHandle is valid but missing from ResponsiveGridLayout typedefs */}
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={80}
                    onLayoutChange={(layout, allLayouts) => setLayouts(allLayouts)}
                    draggableHandle=".draggable-handle"
                    margin={[20, 20]}
                >
                    {activeWidgets.map(id => (
                        <div key={id}>
                            {renderWidget(id)}
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>

            {/* --- Modals --- */}
            
            {/* Widget Removal Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`p-8 rounded-3xl max-w-sm w-full mx-4 border animate-in fade-in zoom-in duration-200
                        ${isDarkMode ? 'bg-[#10141d] border-white/10 shadow-2xl shadow-black' : 'bg-white border-slate-200 shadow-xl'}`}>
                        <div className="flex justify-center mb-6">
                            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <Trash2 size={32} />
                            </div>
                        </div>
                        <h3 className={`text-xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Remove Widget?</h3>
                        <p className={`text-center text-sm mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Are you sure you want to remove this widget from your dashboard? You can always add it back later.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirmModal(null)} 
                                className={`flex-1 py-3 rounded-xl font-semibold transition-colors
                                ${isDarkMode ? 'bg-[#1c212c] text-white hover:bg-[#252b38]' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
                                Cancel
                            </button>
                            <button onClick={() => removeWidget(showConfirmModal)} 
                                className="flex-1 py-3 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Graph / Request Modal */}
            {showGraphModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 overflow-hidden">
                    <div className={`h-full w-full max-w-md p-6 overflow-y-auto border-l animate-in slide-in-from-right duration-300
                        ${isDarkMode ? 'bg-[#10141d] border-white/10 shadow-2xl shadow-black relative' : 'bg-white border-slate-200 relative'}`}>
                        
                        <button onClick={() => setShowGraphModal(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <X size={20} />
                        </button>

                        <h2 className={`text-2xl font-bold mb-6 mt-12 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Widget Library</h2>
                        
                        <div className="space-y-3 mb-10">
                            {widgetCatalog.map(widget => {
                                const isActive = activeWidgets.includes(widget.id);
                                return (
                                    <div key={widget.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all
                                        ${isDarkMode ? 'bg-[#1c212c] border-white/5' : 'bg-slate-50 border-slate-200'}
                                        ${isActive ? 'opacity-50 grayscale' : 'hover:border-[#55b7e0]'}`}>
                                        <span className={`font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{widget.title}</span>
                                        <button 
                                            disabled={isActive}
                                            onClick={() => addWidget(widget.id)}
                                            className={`size-8 rounded-full flex items-center justify-center transition-colors
                                            ${isActive 
                                                ? (isDarkMode ? 'bg-white/5 text-white/30' : 'bg-slate-200 text-slate-400')
                                                : 'bg-[#55b7e0] text-white shadow-[0_0_10px_rgba(85,183,224,0.4)] hover:bg-[#3ba2cf]'
                                            }`}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Request a Metric Box */}
                        <div className={`p-6 rounded-3xl border mt-8 ${isDarkMode ? 'bg-gradient-to-br from-[#1c212c] to-[#151a23] border-[#55b7e0]/20' : 'bg-sky-50 border-sky-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={18} className="text-[#55b7e0]" />
                                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Request a Metric</h3>
                            </div>
                            <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Don't see the specific data you need? Tell our AI what you want to track.</p>
                            <textarea 
                                placeholder="E.g. I want to see average wait time mapped across different top-level intents..."
                                className={`w-full p-4 rounded-xl text-sm min-h-[100px] border focus:outline-none focus:ring-2 focus:ring-[#55b7e0] resize-none mb-4
                                ${isDarkMode ? 'bg-[#10141d] border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'}`}
                            ></textarea>
                            <button className="w-full py-3 rounded-xl bg-[#55b7e0] text-white font-bold text-sm hover:bg-[#3ba2cf] transition-colors shadow-[0_0_15px_rgba(85,183,224,0.3)]">
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom CSS for standardizing the draggable look and glowing animations */}
            <style>
                {`
                    .react-grid-item > .react-resizable-handle::after {
                        border-right: 2px solid #55b7e0;
                        border-bottom: 2px solid #55b7e0;
                        right: 8px;
                        bottom: 8px;
                        width: 10px;
                        height: 10px;
                    }
                    .react-grid-item > .react-resizable-handle {
                        width: 30px;
                        height: 30px;
                        bottom: 0px;
                        right: 0px;
                        z-index: 20;
                    }
                    @keyframes mountainRotate {
                        0%   { transform: rotateY(0deg); }
                        100% { transform: rotateY(360deg); }
                    }
                    .mountain-rotate-container {
                        animation: mountainRotate 30s linear infinite;
                        transform-style: preserve-3d;
                    }
                `}
            </style>
        </div>
    );
};
