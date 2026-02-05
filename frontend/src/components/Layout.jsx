import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Upload, Search, Database, HelpCircle } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                ? 'bg-purple-600/20 text-purple-400 border-r-2 border-purple-500'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`
        }
    >
        <Icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />

        {/* Tooltip on hover */}
        <span className="absolute left-full ml-4 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
            {label}
        </span>
    </NavLink>
);

const Layout = () => {
    return (
        <div className="flex h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Sidebar - Icon Only, Permanent */}
            <aside className="w-20 bg-[#0F1016] border-r border-white/5 flex flex-col z-50 shadow-2xl relative">
                {/* Logo */}
                <div className="p-3 mb-4 mt-8">
                    <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 text-center tracking-wide">
                        SENTINEL
                    </div>
                    <div className="text-[8px] text-gray-500 text-center mt-0.5">v2.0</div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 mt-16">
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/upload" icon={Upload} label="Upload & Process" />
                    <SidebarItem to="/search" icon={Search} label="Search Engine" />
                    <SidebarItem to="/history" icon={Database} label="History" />
                    <SidebarItem to="/qa" icon={HelpCircle} label="Knowledge Base" />
                </nav>

                {/* Bottom User Section */}
                <div className="p-3 border-t border-white/5 bg-black/10">
                    <div className="flex flex-col items-center space-y-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="font-bold text-xs text-white">K</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative transition-all duration-300">
                {/* Background ambient glow */}
                <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]"></div>
                </div>

                {/* Top Right Command Trigger */}
                <div className="absolute top-6 right-8 z-50">
                    <button
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                        className="group flex items-center space-x-3 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:scale-105 transition-all duration-300 border border-white/20"
                    >
                        <Search size={16} className="text-white/90" />
                        <span className="text-sm font-bold tracking-wide">Quick Actions</span>
                        <div className="flex items-center ml-2 pl-2 border-l border-white/20">
                            <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded text-white/90">⌘K</span>
                        </div>
                    </button>
                </div>

                {/* Content Container */}
                <div className="relative z-10 w-full h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
