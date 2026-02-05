import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Home, LayoutDashboard, Upload, Clock, Sun, Moon, RefreshCw, X, HelpCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resetSystem } from '../services/api';
import { toast } from 'sonner';

const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const commandInputRef = React.useRef(null);

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Force focus when opened
    useEffect(() => {
        if (open) {
            // Small timeout to ensure DOM is ready
            setTimeout(() => {
                commandInputRef.current?.focus();
            }, 50);
        }
    }, [open]);

    // Navigation Helper
    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            <div className="relative w-full max-w-2xl animate-fade-in-up">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-30 animate-pulse"></div>
                <Command className="relative w-full bg-[#0f1016]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="flex items-center border-b border-white/5 px-4 py-4">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <Command.Input
                            ref={commandInputRef}
                            autoFocus
                            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                            placeholder="Type a command or search..."
                        />
                        <div className="flex items-center gap-2">
                            <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-medium text-gray-400">
                                <span className="text-xs">ESC</span>
                            </kbd>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
                        <Command.Empty className="py-6 text-center text-sm text-gray-500">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Navigation" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">
                            <CommandItem icon={Home} label="Home" onSelect={() => runCommand(() => navigate('/'))} />
                            <CommandItem icon={LayoutDashboard} label="Dashboard" onSelect={() => runCommand(() => navigate('/dashboard'))} />
                            <CommandItem icon={Upload} label="Upload" onSelect={() => runCommand(() => navigate('/upload'))} />
                            <CommandItem icon={Search} label="Search" onSelect={() => runCommand(() => navigate('/search'))} />
                            <CommandItem icon={Clock} label="History" onSelect={() => runCommand(() => navigate('/history'))} />
                            <CommandItem icon={HelpCircle} label="Q&A Knowledge Base" onSelect={() => runCommand(() => navigate('/qa'))} />
                        </Command.Group>

                        <Command.Group heading="System" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-4">
                            <CommandItem icon={RefreshCw} label="Reload Application" onSelect={() => runCommand(() => window.location.reload())} />
                            <CommandItem
                                icon={Trash2}
                                label="Reset System (Danger)"
                                onSelect={() => runCommand(async () => {
                                    if (window.confirm("⚠️ DANGER: Reset System and delete all data?")) {
                                        try {
                                            await resetSystem();
                                            toast.success("System reset complete");
                                            setTimeout(() => window.location.reload(), 1000);
                                        } catch (e) {
                                            toast.error("Reset failed");
                                        }
                                    }
                                })}
                                className="text-red-400 group-hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                            />
                        </Command.Group>
                    </Command.List>

                    <div className="border-t border-white/5 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500">
                        <div className="flex items-center gap-2">
                            <span>SENTINEL v2.0</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span>Use arrows to navigate</span>
                            <span>Enter to select</span>
                        </div>
                    </div>
                </Command>
            </div>
        </div>
    );
};

// Helper Item Component
const CommandItem = ({ icon: Icon, label, onSelect, className = "" }) => {
    return (
        <Command.Item
            value={label}
            onSelect={onSelect}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-gray-400 border border-transparent 
            aria-selected:bg-[#2e233d] aria-selected:text-white aria-selected:border-purple-500/30 
            hover:bg-[#2e233d] hover:text-white hover:border-purple-500/30 font-medium transition-all duration-200 group ${className}`}
        >
            <div className={`p-2 rounded-md bg-white/5 group-hover:bg-purple-500/20 group-aria-selected:bg-purple-500/20 transition-colors ${className ? 'group-hover:bg-red-500/20 group-aria-selected:bg-red-500/20' : ''}`}>
                <Icon size={18} />
            </div>
            <span className="text-sm">{label}</span>
        </Command.Item>
    );
};

export default CommandMenu;
