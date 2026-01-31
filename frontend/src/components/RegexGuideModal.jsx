import React from 'react';
import { X, BookOpen, Copy } from 'lucide-react';

const RegexGuideModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const sections = [
        {
            title: "Anchors",
            items: [
                { pattern: "^", desc: "Start of string" },
                { pattern: "$", desc: "End of string" },
                { pattern: "\\b", desc: "Word boundary (e.g., \\bWord\\b)" }
            ]
        },
        {
            title: "Character Classes",
            items: [
                { pattern: ".", desc: "Any character (except newline)" },
                { pattern: "\\d", desc: "Any digit [0-9]" },
                { pattern: "\\w", desc: "Any word character [a-zA-Z0-9_]" },
                { pattern: "\\s", desc: "Any whitespace" },
                { pattern: "[abc]", desc: "Any character from the set" },
                { pattern: "[^abc]", desc: "Any character NOT in the set" }
            ]
        },
        {
            title: "Quantifiers",
            items: [
                { pattern: "*", desc: "0 or more times" },
                { pattern: "+", desc: "1 or more times" },
                { pattern: "?", desc: "0 or 1 time (optional)" },
                { pattern: "{3}", desc: "Exactly 3 times" },
                { pattern: "{2,5}", desc: "Between 2 and 5 times" }
            ]
        },
        {
            title: "Examples",
            items: [
                { pattern: "def.*main", desc: "Functions named 'main' (Python)" },
                { pattern: "class\\s+\\w+", desc: "Class definitions" },
                { pattern: "api_key.*=.*", desc: "API Key assignments" },
                { pattern: "(?i)password", desc: "Case-insensitive 'password'" }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1b26] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Regex Cheat Sheet</h2>
                            <p className="text-sm text-gray-400">Quick reference for regular expressions</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sections.map((section, idx) => (
                            <div key={idx} className="bg-black/20 rounded-xl p-4 border border-white/5">
                                <h3 className="text-pink-400 font-bold mb-3 text-sm uppercase tracking-wider">
                                    {section.title}
                                </h3>
                                <div className="space-y-2">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-start text-sm group">
                                            <code className="font-mono bg-[#13141c] text-green-400 px-2 py-0.5 rounded border border-white/5 group-hover:border-pink-500/30 transition-colors">
                                                {item.pattern}
                                            </code>
                                            <span className="text-gray-400 text-right ml-4 flex-1">
                                                {item.desc}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start space-x-3">
                        <div className="text-blue-400 mt-1">💡</div>
                        <div>
                            <h4 className="text-blue-400 font-bold text-sm mb-1">Did you know?</h4>
                            <p className="text-gray-300 text-sm">
                                Sentinel uses SQLite's <code>REGEXP</code> engine. Pattern matching is powerful but can be slower on very large datasets. Use regex filters to refine your search precisely!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 text-center">
                    <button
                        onClick={onClose}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close Guide
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegexGuideModal;
