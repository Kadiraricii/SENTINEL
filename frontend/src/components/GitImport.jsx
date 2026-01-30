
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Github, GitBranch, ArrowRight, Loader, Lock, Timer } from 'lucide-react';
import { analyzeRepo, estimateRepo } from '../services/api';
import debounce from 'lodash.debounce';

const AnalysisTerminal = ({ estimatedSeconds }) => {
    const [lines, setLines] = useState([]);
    const [timeLeft, setTimeLeft] = useState(estimatedSeconds || 15);

    // Sync timeLeft when estimatedSeconds updates (e.g. late fetch)
    useEffect(() => {
        if (estimatedSeconds) {
            setTimeLeft(estimatedSeconds);
        }
    }, [estimatedSeconds]);

    useEffect(() => {
        // Countdown timer
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const textLines = [
            { text: '> INITIALIZING SENTINEL PROTOCOL...', delay: 0 },
            { text: '> LOCKING DOWN INTERFACE [SECURITY PROTOCOL ALPHA]...', delay: 500 },
            { text: '> ESTABLISHING SECURE CONNECTION TO GIT HOST...', delay: 1200 },
            { text: '> HANDSHAKE VERIFIED [200 OK]', delay: 2000 },
            { text: '> CLONING REPOSITORY OBJECTS...', delay: 3000 },
            { text: '> DELTA COMPRESSION: 100% (Done)', delay: 4500 },
            { text: '> ANALYZING FILE STRUCTURE...', delay: 5500 },
            { text: '> DETECTING PROGRAMMING LANGUAGES...', delay: 6500 },
            { text: '> QUEUING BATCH JOB...', delay: 7500 }
        ];

        let timeouts = [];
        textLines.forEach(({ text, delay }) => {
            const timeout = setTimeout(() => {
                setLines(prev => [...prev, text]);
            }, delay);
            timeouts.push(timeout);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, []);

    return createPortal(
        // Full screen blocking overlay
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in cursor-not-allowed">
            <div className="w-full max-w-3xl font-mono text-sm bg-black/50 p-6 rounded-xl border border-purple-500/30 h-[500px] flex flex-col relative overflow-hidden shadow-2xl shadow-purple-900/40">
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scanline"></div>

                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center space-x-2 text-red-400 animate-pulse">
                        <Lock size={16} />
                        <span className="font-bold uppercase tracking-wider">Interface Locked</span>
                    </div>
                    <div className="text-gray-400 text-xs">
                        SENTINEL v2.0
                    </div>
                </div>

                {/* Pulsing Orb & Timer */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="relative">
                        <div className="w-32 h-32 bg-purple-500/10 rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-32 h-32 border border-purple-500/30 rounded-full animate-spin-slow"></div>
                        <div className="w-32 h-32 flex items-center justify-center text-purple-200 font-bold text-2xl z-10">
                            {timeLeft}s
                        </div>
                    </div>
                    <p className="mt-8 text-purple-400/70 text-xs uppercase tracking-widest animate-pulse">Processing Repository</p>
                </div>

                {/* Terminal Text */}
                <div className="relative z-10 space-y-2 flex-1 overflow-hidden">
                    {lines.map((line, index) => (
                        <div key={index} className="text-green-400 animate-fade-in shadow-green-glow text-xs md:text-sm">
                            {line}
                        </div>
                    ))}
                    <div className="flex items-center space-x-2 text-purple-400 animate-pulse">
                        <span>{'>'}</span>
                        <span className="w-2 h-4 bg-purple-400 block"></span>
                    </div>
                </div>

                <div className="relative z-10 mt-4 border-t border-white/10 pt-2 flex justify-between text-xs text-gray-500 uppercase tracking-widest">
                    <span>Task: Git Clone</span>
                    <div className="flex items-center space-x-2">
                        <Timer size={14} />
                        <span>Est. Remaining: {timeLeft}s</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const GitImport = ({ onImportSuccess }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [estimate, setEstimate] = useState(null);

    // Debounced estimation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedEstimate = useCallback(
        debounce(async (url) => {
            if (!url || !url.includes('github.com')) return;
            try {
                const data = await estimateRepo(url);
                setEstimate(data);
            } catch (err) {
                console.warn('Estimation failed', err);
            }
        }, 1000),
        []
    );

    useEffect(() => {
        debouncedEstimate(repoUrl);
    }, [repoUrl, debouncedEstimate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!repoUrl) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Ensure we have an estimate (fetch if missing/stale)
            let currentEstimate = estimate;
            if (!currentEstimate && repoUrl) {
                try {
                    currentEstimate = await estimateRepo(repoUrl);
                    setEstimate(currentEstimate); // Update UI
                } catch (err) {
                    console.warn('Late estimation failed', err);
                }
            }

            // 2. Determine wait time
            const waitSeconds = currentEstimate?.estimated_seconds || 15;

            const minWaitPromise = new Promise(resolve => {
                setTimeout(resolve, waitSeconds * 1000);
            });

            // 3. Call API and wait
            const [result] = await Promise.all([
                analyzeRepo(repoUrl, branch || null),
                minWaitPromise
            ]);

            // Pass result up only
            onImportSuccess(result);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to analyze repository');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !error) {
        return <AnalysisTerminal estimatedSeconds={estimate?.estimated_seconds} />;
    }

    return (
        <div className="glass-strong p-8 rounded-2xl border border-white/5 bg-[#1a1b26]">
            <div className="flex items-center space-x-3 mb-6">
                <Github className="text-white" size={32} />
                <div>
                    <h3 className="text-xl font-bold text-white">Import from Git</h3>
                    <p className="text-gray-400 text-sm">Analyze public repositories directly</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Repo URL */}
                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Repository URL
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Github className="text-gray-500 group-focus-within:text-purple-400" size={18} />
                        </div>
                        <input
                            type="url"
                            placeholder="https://github.com/username/repo"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                            required
                        />
                    </div>
                    {estimate && repoUrl && (
                        <div className="mt-2 text-xs text-purple-400 flex items-center space-x-2 animate-fade-in">
                            <Timer size={12} />
                            <span>Estimated Time: ~{estimate.estimated_seconds}s ({estimate.size_mb} MB)</span>
                        </div>
                    )}
                </div>

                {/* Branch (Optional) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Branch (Optional)
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <GitBranch className="text-gray-500 group-focus-within:text-purple-400" size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="main"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !repoUrl}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading || !repoUrl
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/20'
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader className="animate-spin" size={20} />
                            <span>Cloning & Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <span>Start Analysis</span>
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-500">
                Only public repositories are supported currently.
            </div>
        </div>
    );
};

export default GitImport;
