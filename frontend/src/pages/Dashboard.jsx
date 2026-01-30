import React, { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileText, Code, Activity, Layers, BarChart2, AlertTriangle, Trash2 } from 'lucide-react';
import { getAnalyticsOverview, getAnalyticsTrends, resetSystem } from '../services/api';

const StatCard = ({ title, value, label, icon: Icon, color }) => (
    <div className="bg-[#1a1b26] p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
            <Icon size={64} className={color} />
        </div>
        <div className="relative z-10">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">{title}</h3>
            <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold text-white">{value}</span>
                <span className="text-gray-500 text-xs mb-1">{label}</span>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [overviewData, trendsData] = await Promise.all([
                    getAnalyticsOverview(),
                    getAnalyticsTrends(7)
                ]);
                setOverview(overviewData);
                setTrends(trendsData);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSystemReset = async () => {
        if (window.confirm("⚠️ DANGER: Are you sure you want to RESET THE ENTIRE SYSTEM?\n\nThis will DELETE ALL uploaded files, extracted code, and statistics.\nThis action cannot be undone.")) {
            if (window.confirm("🔴 FINAL WARNING: ALL DATA WILL BE LOST.\n\nType 'OK' to proceed?")) {
                try {
                    await resetSystem();
                    alert("System has been reset successfully. Reloading...");
                    window.location.reload();
                } catch (err) {
                    alert("Failed to reset system: " + err.message);
                }
            }
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-500">Loading Premium Analytics...</div>;

    const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-8 animate-fade-in p-8 max-w-[1920px] mx-auto pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
                <p className="text-gray-400">Real-time system insights and extraction metrics.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Files"
                    value={overview?.total_files || 0}
                    label="Processed"
                    icon={FileText}
                    color="text-blue-500"
                />
                <StatCard
                    title="Extracted Blocks"
                    value={overview?.total_blocks || 0}
                    label="Code snippets"
                    icon={Code}
                    color="text-purple-500"
                />
                <StatCard
                    title="Avg Confidence"
                    value={`${(overview?.avg_confidence * 100).toFixed(1)}%`}
                    label="Accuracy score"
                    icon={Activity}
                    color="text-green-500"
                />
                <StatCard
                    title="Active Languages"
                    value={overview?.language_distribution?.length || 0}
                    label="Detected types"
                    icon={Layers}
                    color="text-pink-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trends Chart */}
                <div className="lg:col-span-2 bg-[#1a1b26] p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                        <BarChart2 size={18} className="mr-2 text-purple-400" />
                        Extraction Activity (7 Days)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends?.daily_stats || []}>
                                <defs>
                                    <linearGradient id="colorBlocks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#666"
                                    fontSize={12}
                                    tickFormatter={(val) => val.split('T')[0].slice(5)}
                                />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                    itemStyle={{ color: '#f3f4f6' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total_blocks"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorBlocks)"
                                    name="Blocks Extracted"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Language Distribution */}
                <div className="bg-[#1a1b26] p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                        <Layers size={18} className="mr-2 text-pink-400" />
                        Language Distribution
                    </h3>
                    <div className="h-80 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={overview?.language_distribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="language"
                                >
                                    {(overview?.language_distribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-8">
                            <div className="text-2xl font-bold text-white">{overview?.total_files || 0}</div>
                            <div className="text-xs text-gray-500">Files</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-12 border border-red-500/20 rounded-xl p-8 bg-red-500/5">
                <div className="flex items-center space-x-3 mb-4 text-red-400">
                    <AlertTriangle size={24} />
                    <h3 className="text-xl font-bold">Danger Zone</h3>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-gray-300 font-medium">Reset System Data</p>
                        <p className="text-sm text-gray-500 mt-1">
                            This will permanently delete all files, code blocks, and analytics data.
                            <br />
                            This action cannot be undone.
                        </p>
                    </div>
                    <button
                        onClick={handleSystemReset}
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-bold shadow-lg shadow-red-900/20"
                    >
                        <Trash2 size={18} />
                        <span>Reset System & Clear Data</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
