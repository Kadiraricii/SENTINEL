import React, { useState } from 'react';
import { Search, Star, GitFork, ExternalLink, Loader, Sparkles, Code2 } from 'lucide-react';
import { fetchUserRepos, analyzeRepo } from '../services/api';

const GitUserBrowser = ({ onRepoSelect }) => {
    const [username, setUsername] = useState('');
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalRepos, setTotalRepos] = useState(0);

    const handleFetchRepos = async () => {
        if (!username.trim()) {
            setError('Please enter a GitHub username');
            return;
        }

        setLoading(true);
        setError(null);
        setRepos([]);

        try {
            const data = await fetchUserRepos(username.trim());
            setRepos(data.repositories);
            setTotalRepos(data.total_repos);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to fetch repositories. User may not exist or rate limit exceeded.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeRepo = (repoUrl) => {
        onRepoSelect(repoUrl);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleFetchRepos();
        }
    };

    const getLanguageColor = (language) => {
        const colors = {
            'JavaScript': 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40 text-yellow-400',
            'TypeScript': 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-400',
            'Python': 'from-blue-600/20 to-cyan-600/20 border-blue-600/40 text-blue-300',
            'Java': 'from-red-500/20 to-orange-500/20 border-red-500/40 text-red-400',
            'C++': 'from-pink-500/20 to-purple-500/20 border-pink-500/40 text-pink-400',
            'C': 'from-gray-500/20 to-slate-500/20 border-gray-500/40 text-gray-300',
            'Go': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400',
            'Rust': 'from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-400',
            'Ruby': 'from-red-600/20 to-pink-600/20 border-red-600/40 text-red-300',
            'PHP': 'from-purple-600/20 to-indigo-600/20 border-purple-600/40 text-purple-300',
        };
        return colors[language] || 'from-gray-500/20 to-gray-600/20 border-gray-500/40 text-gray-400';
    };

    return (
        <div className="space-y-4">
            {/* Premium Search Header */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative flex gap-3 bg-[#1a1b26]/90 backdrop-blur-xl p-1.5 rounded-xl border border-white/10">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" size={16} />
                        <input
                            type="text"
                            placeholder="GitHub username (torvalds, microsoft, openai...)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={handleKeyPress}
                            autoComplete="off"
                            className="w-full bg-transparent border-none rounded-lg px-11 py-2.5 text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                        />
                        {username && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                <Sparkles className="text-purple-400 animate-pulse" size={14} />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleFetchRepos}
                        disabled={loading}
                        className="relative px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <span className="relative flex items-center gap-2">
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={16} />
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <>
                                    <Search size={16} />
                                    <span>Explore</span>
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 animate-pulse"></div>
                    <div className="relative bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
                        <p className="text-red-400 font-medium flex items-center gap-3 text-base">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Bar with User Avatar */}
            {totalRepos > 0 && (
                <div className="flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 animate-fade-in">
                    <div className="flex items-center gap-4">
                        {/* User Avatar */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur opacity-60 group-hover:opacity-80 transition"></div>
                            <div className="relative w-11 h-11 rounded-full border-2 border-white/20 overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <img
                                    src={`https://github.com/${username}.png?size=200`}
                                    alt={`@${username}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                @{username}
                            </p>
                            <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                {totalRepos} {totalRepos === 1 ? 'repository' : 'repositories'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Repository Grid - 3 Column Wide Cards */}
            {repos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {repos.map((repo, index) => (
                        <div
                            key={index}
                            className="group relative"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Glow Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>

                            {/* Card - Premium Large Design */}
                            <div className="relative bg-[#1a1b26] border border-white/5 rounded-xl p-5 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300 h-full flex flex-col min-h-[280px] group-hover:-translate-y-1">
                                {/* Gradient Header Accent */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-t-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

                                {/* Header */}
                                <div className="flex items-start justify-between mb-4 mt-2">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                                <GitFork size={18} />
                                            </div>
                                            <h3 className="text-white font-bold text-base group-hover:text-purple-300 transition-colors break-words leading-tight">
                                                {repo.name}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono break-all opacity-60 ml-1">{repo.full_name}</p>
                                    </div>
                                    <a
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-all flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                </div>

                                {/* Description */}
                                <div className="flex-grow mb-6 relative">
                                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-4 font-medium opacity-90">
                                        {repo.description || 'No description available for this repository.'}
                                    </p>
                                    {!repo.description && <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1b26]/50"></div>}
                                </div>

                                {/* Metadata & Action Footer */}
                                <div className="mt-auto space-y-4">
                                    {/* Tags Row */}
                                    <div className="flex items-center gap-3 flex-wrap border-t border-white/5 pt-4">
                                        {repo.language && (
                                            <div className={`px-3 py-1.5 bg-gradient-to-r ${getLanguageColor(repo.language)} rounded-lg text-xs font-bold border shadow-sm flex-shrink-0 flex items-center gap-1.5`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                                                {repo.language}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium bg-white/5 px-2.5 py-1.5 rounded-lg">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                            <span>{repo.stargazers_count.toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 ml-auto font-mono opacity-50">
                                            {(repo.size / 1024).toFixed(1)} MB
                                        </div>
                                    </div>

                                    {/* Analyze Button */}
                                    <button
                                        onClick={() => handleAnalyzeRepo(repo.clone_url)}
                                        className="relative w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden group/btn bg-white/5 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/25">
                                        <span className="relative flex items-center justify-center gap-2 z-10">
                                            <Search size={16} />
                                            Analyze Repository
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && repos.length === 0 && !error && (
                <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1b26] via-purple-900/5 to-pink-900/5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]"></div>
                    <div className="relative text-center py-28 px-8">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-8 animate-pulse">
                            <Search size={40} className="text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Discover GitHub Repositories</h3>
                        <p className="text-gray-400 max-w-lg mx-auto text-lg leading-relaxed">
                            Enter any GitHub username to explore their public repositories and analyze their code instantly
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-3 text-base text-gray-500">
                            <Sparkles size={16} className="text-purple-400" />
                            <span>Try: torvalds, microsoft, openai, facebook</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GitUserBrowser;
