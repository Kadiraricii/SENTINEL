import React, { useState } from 'react';
import { Check, X, Edit3, Code } from 'lucide-react';
import { submitFeedback } from '../services/api';
import MonacoEditorModal from './MonacoEditor';

function CodeCard({ block, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);

    const getLanguageColor = (language) => {
        const colors = {
            python: 'from-blue-500 to-cyan-500',
            javascript: 'from-yellow-500 to-orange-500',
            java: 'from-red-500 to-pink-500',
            c: 'from-gray-500 to-gray-700',
            cpp: 'from-purple-500 to-indigo-500',
            go: 'from-cyan-500 to-blue-500',
            rust: 'from-orange-600 to-red-600',
            json: 'from-green-500 to-emerald-500',
            yaml: 'from-purple-400 to-pink-400',
            cisco_ios: 'from-teal-500 to-green-500',
            nginx: 'from-green-600 to-emerald-600',
            log: 'from-gray-600 to-gray-800',
        };
        return colors[language] || 'from-gray-500 to-gray-700';
    };

    const handleFeedback = async (action) => {
        try {
            await submitFeedback({
                block_id: block.id,
                action,
            });
            setFeedbackSent(true);

            // Update local state
            onUpdate({ ...block, status: action === 'accept' ? 'accepted' : 'rejected' });
        } catch (error) {
            console.error('Feedback error:', error);
        }
    };

    const handleEdit = (newContent) => {
        onUpdate({ ...block, content: newContent });
        setIsEditing(false);
    };

    return (
        <>
            <div className="glass p-5 rounded-xl hover-glow relative overflow-hidden">
                {/* Gradient accent border */}
                <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getLanguageColor(block.language)}`}
                />

                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <Code className="w-5 h-5 text-purple-400" />
                        <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getLanguageColor(block.language)} bg-opacity-20`}>
                                {block.language || block.block_type}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                                Lines {block.start_line}-{block.end_line}
                            </span>
                        </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-12 h-12">
                            <svg className="transform -rotate-90 w-12 h-12">
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="url(#gradient)"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray={`${block.confidence_score * 125.6} 125.6`}
                                    className="transition-all duration-500"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#667eea" />
                                        <stop offset="100%" stopColor="#764ba2" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold">
                                    {Math.round(block.confidence_score * 100)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Code Preview */}
                <pre className="bg-black/30 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto font-mono max-h-60">
                    {block.content}
                </pre>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => handleFeedback('accept')}
                        disabled={feedbackSent}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" />
                        Accept
                    </button>

                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => handleFeedback('reject')}
                        disabled={feedbackSent}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                        Reject
                    </button>
                </div>
            </div>

            {isEditing && (
                <MonacoEditorModal
                    code={block.content}
                    language={block.language}
                    onSave={handleEdit}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </>
    );
}

export default CodeCard;
