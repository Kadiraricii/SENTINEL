import React, { useState } from 'react';
import { Github } from 'lucide-react';
import { Liquid } from './ui/button-1';

const COLORS = {
    color1: '#FFFFFF',
    color2: '#1E10C5',
    color3: '#9089E2',
    color4: '#FCFCFE',
    color5: '#F9F9FD',
    color6: '#B2B8E7',
    color7: '#0E2DCB',
    color8: '#0017E9',
    color9: '#4743EF',
    color10: '#7D7BF4',
    color11: '#0B06FC',
    color12: '#C5C1EA',
    color13: '#1403DE',
    color14: '#B6BAF6',
    color15: '#C1BEEB',
    color16: '#290ECB',
    color17: '#3F4CC0',
};

const GitHubButton = ({ onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="inline-block relative">
            <div className="relative overflow-hidden rounded-xl">
                <button
                    onClick={onClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all group bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-purple-900/40 backdrop-blur-md border border-purple-500/30"
                    aria-label="Git Repository"
                    type="button"
                >
                    {/* Simplified Background Effects - Contained */}
                    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                        <div className="absolute inset-[-20%] opacity-60">
                            <Liquid isHovered={isHovered} colors={COLORS} />
                        </div>
                    </div>

                    {/* Subtle Glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-purple-600/30 opacity-70 blur-xl pointer-events-none"></div>

                    {/* Content */}
                    <div className="relative z-10 flex items-center space-x-2">
                        <Github size={18} className="group-hover:fill-yellow-400 fill-white transition-all" />
                        <span className="group-hover:text-yellow-400 text-white transition-all">Git Repository</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default GitHubButton;
