import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Github, GitBranch, ArrowRight, Loader, Lock, Timer, Link, Users } from 'lucide-react';
import { analyzeRepo, estimateRepo, getBatchStatus } from '../services/api';
import debounce from 'lodash.debounce';
import GitUserBrowser from './GitUserBrowser';

const AnalysisTerminal = ({ estimatedSeconds, isReady, onSkip }) => {
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

        // If ready, append success message
        if (isReady) {
            setLines(prev => [...prev, '> ANALYSIS COMPLETE: 100% success']);
            setLines(prev => [...prev, '> WAITING FOR SECURITY TIMER...']);
        }

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [isReady]);

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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                    <div className="relative">
                        <div className={`w-32 h-32 rounded-full absolute inset-0 ${isReady ? 'bg-green-500/20 animate-pulse' : 'bg-purple-500/10 animate-ping'}`}></div>
                        <div className={`w-32 h-32 border rounded-full ${isReady ? 'border-green-400 animate-none' : 'border-purple-500/30 animate-spin-slow'}`}></div>
                        <div className="w-32 h-32 flex items-center justify-center font-bold text-2xl z-10">
                            <span className={isReady ? 'text-green-400' : 'text-purple-200'}>{timeLeft}s</span>
                        </div>
                    </div>

                    <p className={`mt-8 text-xs uppercase tracking-widest animate-pulse ${isReady ? 'text-green-400' : 'text-purple-400/70'}`}>
                        {isReady ? 'Analysis Complete' : 'Processing Repository'}
                    </p>

                    {/* FAST FORWARD BUTTON */}
                    {isReady && (
                        <button
                            onClick={onSkip}
                            className="mt-6 flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-bounce"
                            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        >
                            <span>Ready - Fast Forward</span>
                            <ArrowRight size={18} />
                        </button>
                    )}
                </div>

                {/* Terminal Text */}
                <div className="relative z-10 space-y-2 flex-1 overflow-hidden opacity-50">
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
                    <span>Task: {isReady ? 'COMPLETE' : 'Analyze'}</span>
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
    const [activeTab, setActiveTab] = useState('url'); // 'url' or 'browse'

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

    // Fast Forward State
    const [analysisReady, setAnalysisReady] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [resolveWait, setResolveWait] = useState(null);

    const handleSkipWait = () => {
        if (resolveWait) {
            resolveWait(); // Break the wait promise
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!repoUrl) return;

        setLoading(true);
        setError(null);
        setAnalysisReady(false);
        setAnalysisResult(null);

        try {
            // 1. Ensure we have an estimate
            let currentEstimate = estimate;
            if (!currentEstimate && repoUrl) {
                try {
                    currentEstimate = await estimateRepo(repoUrl);
                    setEstimate(currentEstimate);
                } catch (err) {
                    console.warn('Late estimation failed', err);
                }
            }

            // 2. Start Analysis Request
            const result = await analyzeRepo(repoUrl, branch || null);
            const batchId = result.batch_id;

            // 3. Wait loop with Polling and "Early Exit"
            const waitSeconds = currentEstimate?.estimated_seconds || 15;
            const startTime = Date.now();
            const minWaitTime = waitSeconds * 1000;

            await new Promise((resolve) => {
                const interval = setInterval(async () => {
                    try {
                        // Check batch status using API client (handles base URL)
                        const status = await getBatchStatus(batchId);

                        // Check if complete
                        if (status.overall_status === 'complete' || status.overall_status === 'partial_failure') {
                            if (!analysisReady) {
                                setAnalysisReady(true);
                                setAnalysisResult(result);
                                setResolveWait(() => resolve); // Store resolver to call later
                            }

                            // If we already set ready, we just wait for user to click skip OR time to run out
                        }
                    } catch (err) {
                        console.error("Polling error", err);
                    }

                    // Auto-resolve if time is up
                    if (Date.now() - startTime > minWaitTime) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 2000);
            });

            onImportSuccess(result);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to analyze repository');
            setLoading(false);
        }
    };

    const handleRepoSelect = (cloneUrl) => {
        // When user selects a repo from browser, switch to URL tab and populate
        setRepoUrl(cloneUrl);
        setActiveTab('url');
        // Trigger estimate
        debouncedEstimate(cloneUrl);
    };

    if (loading && !error) {
        return (
            <AnalysisTerminal
                estimatedSeconds={estimate?.estimated_seconds}
                isReady={analysisReady}
                onSkip={handleSkipWait}
            />
        );
    }

    return (
        <div className={`w-full mx-auto transition-all duration-500 ease-in-out ${activeTab === 'url' ? 'max-w-2xl' : 'max-w-7xl'}`}>
            {/* Header Card with Gradient Border */}
            <div className="relative mb-8 group">
                {/* Gradient Border Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>

                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur-md opacity-50"></div>
                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                                <Github className="text-white" size={32} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Import from Git</h3>
                            <p className="text-gray-400 text-sm mt-1">Analyze public repositories directly</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Switcher - Enhanced */}
            <div className="flex space-x-3 mb-8 bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-xl">
                <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl transition-all duration-300 font-semibold text-sm relative overflow-hidden ${activeTab === 'url'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {activeTab === 'url' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse"></div>
                    )}
                    <Link size={18} className="relative z-10" />
                    <span className="relative z-10">Direct URL</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('browse')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl transition-all duration-300 font-semibold text-sm relative overflow-hidden ${activeTab === 'browse'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {activeTab === 'browse' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse"></div>
                    )}
                    <Users size={18} className="relative z-10" />
                    <span className="relative z-10">Browse User Repos</span>
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'url' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Repo URL Input - Premium */}
                    <div className="relative group">
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            <span>Repository URL</span>
                        </label>

                        {/* Gradient Border */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-40 group-focus-within:opacity-60 transition duration-500"></div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <Github className="text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                            </div>
                            <input
                                type="url"
                                placeholder="https://github.com/username/repo"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                className="relative w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-base placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all shadow-lg"
                                required
                            />
                        </div>

                        {estimate && repoUrl && (
                            <div className="mt-3 text-sm text-purple-400 flex items-center space-x-2 animate-fade-in bg-purple-500/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-purple-500/30 shadow-lg">
                                <Timer size={16} />
                                <span className="font-semibold">Estimated: ~{estimate.estimated_seconds}s</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400">{estimate.size_mb} MB</span>
                            </div>
                        )}
                    </div>

                    {/* Branch Input - Premium */}
                    <div className="relative group">
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            <span>Branch (Optional)</span>
                        </label>

                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 group-focus-within:opacity-60 transition duration-500"></div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <GitBranch className="text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="main"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                className="relative w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-base placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-lg"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-300 text-sm bg-red-500/10 backdrop-blur-sm p-4 rounded-xl border border-red-500/30 font-medium flex items-center space-x-2 shadow-lg">
                            <span className="text-red-500 text-xl">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button - Ultra Premium */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 group-active:opacity-40 transition duration-500 animate-gradient"></div>

                        <button
                            type="submit"
                            disabled={loading || !repoUrl}
                            className={`relative w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center space-x-3 transition-all duration-300 transform ${loading || !repoUrl
                                ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/50'
                                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-purple-900/50 border border-purple-400/30'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={24} />
                                    <span>Cloning & Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Start Analysis</span>
                                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <GitUserBrowser onRepoSelect={handleRepoSelect} />
            )}

            {/* Footer Note */}
            <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-black/20 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/5">
                    <Lock size={14} />
                    <span>{activeTab === 'url' ? 'Only public repositories are supported currently' : 'Browse all public repos from any GitHub user'}</span>
                </div>
            </div>
        </div>
    );
};

export default GitImport;
