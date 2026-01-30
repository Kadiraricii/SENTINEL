import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Upload, Search, FileText, Settings, Database } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                ? 'bg-purple-600/20 text-purple-400 border-r-2 border-purple-500'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`
        }
    >
        <Icon size={20} className="group-hover:scale-110 transition-transform" />
        <span className="font-medium">{label}</span>
    </NavLink>
);

const Layout = () => {
    return (
        <div className="flex h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0F1016] border-r border-white/5 flex flex-col z-20 shadow-2xl">
                {/* Logo */}
                <div className="p-6 mb-4">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        HPES <span className="text-xs text-gray-500 font-mono border border-gray-700 px-1 rounded">v2.0</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Hybrid Extraction System</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1">
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/upload" icon={Upload} label="Upload & Process" />
                    <SidebarItem to="/search" icon={Search} label="Search Engine" />
                    <SidebarItem to="/history" icon={Database} label="History" />
                </nav>

                {/* Bottom Stats / Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="font-bold text-xs text-white">K</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-200">Kadir Arıcı</p>
                            <p className="text-xs text-green-400 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                                Online
                            </p>
                            <a
                                href="https://github.com/Kadiraricii"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-yellow-400 hover:underline"
                            >
                                github.com/Kadiraricii
                            </a>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                {/* Background ambient glow */}
                <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]"></div>
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
