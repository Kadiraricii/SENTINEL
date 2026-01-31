
import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Code, CheckCircle, File, Trash2, X, AlertTriangle, CheckSquare, Square, Edit, Download, Copy, Check, FileJson, FileText } from 'lucide-react';
import { searchBlocks, deleteBlock, batchDeleteBlocks, updateBlock } from '../services/api';
import MonacoEditorModal from '../components/MonacoEditor';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';
import RegexGuideModal from '../components/RegexGuideModal';
import { Particles } from '../components/ui/particles';

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [editingBlock, setEditingBlock] = useState(null);

    // Dialog States
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, blockId: null });
    const [batchDeleteDialog, setBatchDeleteDialog] = useState({ isOpen: false });

    const handleSaveEdit = async (updatedBlock) => {
        try {
            const result = await updateBlock(updatedBlock.block_id, updatedBlock.content, updatedBlock.language);

            // Optimistic update
            setResults(prev => prev.map(b =>
                b.block_id === updatedBlock.block_id
                    ? { ...b, content: result.content, language: result.language }
                    : b
            ));

            setEditingBlock(null);
            toast.success('Block updated successfully');
        } catch (err) {
            console.error('Update failed:', err);
            toast.error('Failed to update block');
        }
    };

    // Filters
    const [filters, setFilters] = useState({
        languages: [],
        min_confidence: 0,
        date_from: '',
        date_to: ''
    });

    // Debounce search triggers
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 500);

        return () => clearTimeout(timer);
    }, [query, filters]);

    // Clear selection when results change
    useEffect(() => {
        setSelectedIds(new Set());
    }, [results]);

    // Regex Search State
    const [useRegex, setUseRegex] = useState(false);
    const [showRegexGuide, setShowRegexGuide] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = {
                q: query,
                languages: filters.languages,
                min_confidence: filters.min_confidence > 0 ? filters.min_confidence : undefined,
                secret_type: filters.secret_type,
                use_regex: useRegex
            };

            const data = await searchBlocks(params);
            setResults(data.results);
            setTotalResults(data.total_results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (blockId) => {
        setDeleteDialog({ isOpen: true, blockId });
    };

    const confirmDelete = async () => {
        const blockId = deleteDialog.blockId;
        if (!blockId) return;

        try {
            await deleteBlock(blockId);
            setResults(prev => prev.filter(b => b.block_id !== blockId));
            setTotalResults(prev => prev - 1);

            // Remove from selection if selected
            const newSelected = new Set(selectedIds);
            newSelected.delete(blockId);
            setSelectedIds(newSelected);

        } catch (err) {
            console.error('Delete failed:', err);
            toast.error('Failed to delete block');
        }
    };


    const handleBatchDeleteClick = () => {
        if (selectedIds.size === 0) return;
        setBatchDeleteDialog({ isOpen: true });
    };

    const confirmBatchDelete = async () => {

        try {
            const ids = Array.from(selectedIds);
            await batchDeleteBlocks(ids);

            // Update local state
            setResults(prev => prev.filter(b => !selectedIds.has(b.block_id)));
            setTotalResults(prev => prev - selectedIds.size);
            setSelectedIds(new Set());

        } catch (err) {
            console.error('Batch delete failed:', err);
            toast.error('Batch delete failed');
        }
    };

    const toggleSelection = (blockId) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(blockId)) {
            newSelected.delete(blockId);
        } else {
            newSelected.add(blockId);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === results.length && results.length > 0) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(results.map(r => r.block_id));
            setSelectedIds(allIds);
        }
    };

    const clearFilters = () => {
        setFilters({
            languages: [],
            min_confidence: 0,
            date_from: '',
            date_to: ''
        });
        setQuery('');
    };

    const toggleLanguage = (lang) => {
        setFilters(prev => {
            const langs = prev.languages.includes(lang)
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang];
            return { ...prev, languages: langs };
        });
    };

    // New Features: Copy & Export
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (content, id) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        toast.success('Code copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleExport = (format) => {
        if (results.length === 0) return;

        let content = '';
        let type = '';
        let extension = '';

        if (format === 'json') {
            const dataToExport = results.map(r => ({
                filename: r.filename,
                language: r.language,
                content: r.content,
                confidence: r.confidence_score,
                match_score: r.match_score
            }));
            content = JSON.stringify(dataToExport, null, 2);
            type = 'application/json';
            extension = 'json';
        } else if (format === 'csv') {
            // Simple CSV implementation
            const headers = ['Filename', 'Language', 'Confidence', 'Match Score', 'Content'];
            const rows = results.map(r => [
                r.filename,
                r.language,
                r.confidence_score,
                r.match_score,
                `"${r.content.replace(/"/g, '""')}"` // Escape quotes
            ]);

            content = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');
            type = 'text/csv';
            extension = 'csv';
        }

        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sentinel-export-${new Date().toISOString().slice(0, 10)}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 max-w-[1920px] mx-auto pb-20 relative p-8 min-h-screen">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <Particles
                    className="absolute inset-0 z-0"
                    quantity={150}
                    ease={80}
                    color="#ffffff"
                    refresh
                />
            </div>

            {/* Header */}
            <div className="flex justify-between items-end relative z-10">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Advanced Search</h2>
                    <p className="text-gray-400">Deep search across all extracted code blocks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1a1b26] p-5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-gray-200 font-semibold mb-4">
                            <div className="flex items-center space-x-2">
                                <Filter size={18} />
                                <span>Filters</span>
                            </div>
                            {(filters.languages.length > 0 || filters.min_confidence > 0 || query) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                                >
                                    <X size={12} />
                                    <span>Clear</span>
                                </button>
                            )}
                        </div>

                        {/* Language Filter */}
                        <div className="mb-6">
                            <h4 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-wider">Language</h4>
                            <div className="space-y-2">
                                {['python', 'javascript', 'typescript', 'java', 'c', 'cpp', 'go', 'rust', 'ruby', 'php', 'c_sharp', 'kotlin', 'bash', 'json', 'markdown'].map(lang => (
                                    <label key={lang} className="flex items-center space-x-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filters.languages.includes(lang)
                                            ? 'bg-purple-500 border-purple-500'
                                            : 'border-gray-600 group-hover:border-gray-400'
                                            }`}>
                                            {filters.languages.includes(lang) && <CheckCircle size={10} className="text-white" />}
                                        </div>
                                        <span className={`text-sm capitalize ${filters.languages.includes(lang) ? 'text-white' : 'text-gray-400'}`}>
                                            {lang}
                                        </span>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={filters.languages.includes(lang)}
                                            onChange={() => toggleLanguage(lang)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Confidence Filter */}
                        <div className="mb-6">
                            <h4 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-wider">Min Confidence</h4>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={filters.min_confidence}
                                onChange={(e) => setFilters({ ...filters, min_confidence: parseFloat(e.target.value) })}
                                className="w-full accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>0%</span>
                                <span className="text-purple-400 font-bold">{(filters.min_confidence * 100).toFixed(0)}%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Secret Type Filter */}
                        <div className="mb-6">
                            <h4 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-wider">Secret Type</h4>
                            <select
                                value={filters.secret_type || ''}
                                onChange={(e) => setFilters({ ...filters, secret_type: e.target.value || null })}
                                className="w-full bg-[#13141c] border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                            >
                                <option value="">All Content</option>
                                <option value="Any Secret">🔥 Any Secret</option>
                                <option value="AWS">AWS Keys</option>
                                <option value="Google">Google API</option>
                                <option value="Generic API Key">Generic API Key</option>
                                <option value="Password">Passwords</option>
                                <option value="Slack">Slack Tokens</option>
                                <option value="Private Key">Private Keys</option>
                                <option value="DB">DB Connection</option>
                            </select>
                        </div>

                        {/* Date Filter (Placeholder) */}
                        <div className="mb-2">
                            <h4 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-wider">Date Range</h4>
                            <div className="flex items-center space-x-2 text-gray-600 text-sm italic">
                                <Calendar size={14} />
                                <span>Coming soon</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Search Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Search Bar */}
                    <div className="relative group flex items-center gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-[#1a1b26] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all shadow-lg"
                                placeholder={useRegex ? "Enter regex pattern (e.g. ^def.*Login)..." : "Search code blocks, filenames, or content..."}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {loading && (
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div>
                                </div>
                            )}
                        </div>

                        {/* Regex Toggle */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setUseRegex(!useRegex)}
                                className={`p-4 rounded-xl border transition-all flex items-center space-x-2 font-mono text-sm font-bold ${useRegex
                                    ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                                    : 'bg-[#1a1b26] text-gray-400 border-white/5 hover:border-white/20'
                                    }`}
                                title="Toggle Regex Mode"
                            >
                                <span>.*</span>
                                <span className="hidden sm:inline">Regex</span>
                            </button>

                            {/* Regex Help Button - Only visible when enabled or desired */}
                            {useRegex && (
                                <button
                                    onClick={() => setShowRegexGuide(true)}
                                    className="p-4 rounded-xl border border-white/10 bg-[#1a1b26] text-gray-400 hover:text-white hover:bg-white/5 transition-colors animate-fade-in"
                                    title="Regex Guide"
                                >
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">?</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Actions Header */}
                    {results.length > 0 && (
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <button
                                onClick={toggleSelectAll}
                                className="text-sm text-gray-400 hover:text-white flex items-center space-x-2"
                            >
                                {selectedIds.size === results.length && results.length > 0 ? (
                                    <CheckSquare size={16} className="text-purple-500" />
                                ) : (
                                    <Square size={16} />
                                )}
                                <span>Select All ({results.length})</span>
                            </button>

                            <div className="flex items-center space-x-4">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="text-xs flex items-center space-x-1 text-purple-400 hover:text-white border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-500 transition-colors"
                                        title="Export as JSON"
                                    >
                                        <FileJson size={14} />
                                        <span>JSON</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="text-xs flex items-center space-x-1 text-blue-400 hover:text-white border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors"
                                        title="Export as CSV"
                                    >
                                        <FileText size={14} />
                                        <span>CSV</span>
                                    </button>
                                </div>
                                <div className="text-gray-400 text-sm border-l border-white/10 pl-4">
                                    Found {totalResults} matches
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="space-y-4">
                        {loading && results.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">Searching...</div>
                        ) : results.length > 0 ? (
                            <>
                                {results.map(result => {
                                    const isSelected = selectedIds.has(result.block_id);
                                    return (
                                        <div
                                            key={result.block_id}
                                            className={`bg-[#1a1b26] rounded-xl border p-5 transition-all group relative ${isSelected
                                                ? 'border-purple-500/50 bg-purple-500/5'
                                                : 'border-white/5 hover:border-purple-500/30 hover:bg-white/5'
                                                }`}
                                        >
                                            {/* Selection Checkbox */}
                                            <div className="absolute left-4 top-5">
                                                <button
                                                    onClick={() => toggleSelection(result.block_id)}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                                                        ? 'bg-purple-500 border-purple-500'
                                                        : 'border-gray-600 hover:border-white bg-black/20'
                                                        }`}
                                                >
                                                    {isSelected && <CheckSquare size={12} className="text-white" />}
                                                </button>
                                            </div>

                                            <div className="ml-8"> {/* Indent content for checkbox */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-2 rounded-lg ${result.language === 'python' ? 'bg-blue-500/10 text-blue-400' :
                                                            result.language === 'javascript' ? 'bg-yellow-500/10 text-yellow-400' :
                                                                'bg-gray-700/30 text-gray-400'
                                                            }`}>
                                                            <Code size={18} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-gray-200 font-medium text-sm flex items-center">
                                                                <File size={14} className="mr-1 text-gray-500" />
                                                                {result.filename}
                                                            </h4>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="text-xs text-gray-500 uppercase font-mono">{result.language || 'Unknown'}</span>
                                                                {result.has_secrets && (
                                                                    <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                                                        <AlertTriangle size={10} />
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                                                            {result.secret_type || 'SECRET DETECTED'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex flex-col items-end">
                                                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${result.confidence_score > 0.8 ? 'bg-green-500/10 text-green-400' :
                                                                result.confidence_score > 0.5 ? 'bg-yellow-500/10 text-yellow-400' :
                                                                    'bg-red-500/10 text-red-400'
                                                                }`}>
                                                                {(result.confidence_score * 100).toFixed(0)}% Conf
                                                            </div>
                                                            <span className="text-[10px] text-gray-600 mt-1">
                                                                Match: {(result.match_score * 100).toFixed(0)}%
                                                            </span>
                                                        </div>

                                                        {/* Edit Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingBlock({
                                                                    id: result.block_id,
                                                                    block_id: result.block_id,
                                                                    content: result.content,
                                                                    language: result.language
                                                                });
                                                            }}
                                                            className="text-gray-600 hover:text-purple-400 transition-colors p-1"
                                                            title="Edit Block"
                                                        >
                                                            <Edit size={16} />
                                                        </button>

                                                        {/* Copy Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(result.content, result.block_id);
                                                            }}
                                                            className={`transition-colors p-1 ${copiedId === result.block_id ? 'text-green-400' : 'text-gray-600 hover:text-blue-400'}`}
                                                            title="Copy Code"
                                                        >
                                                            {copiedId === result.block_id ? <Check size={16} /> : <Copy size={16} />}
                                                        </button>

                                                        {/* Single Delete Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(result.block_id);
                                                            }}
                                                            className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                                            title="Delete Block"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div
                                                    className="rounded-lg overflow-hidden border border-white/5 cursor-pointer relative group/code"
                                                    onClick={() => toggleSelection(result.block_id)}
                                                >
                                                    <SyntaxHighlighter
                                                        language={result.language || 'text'}
                                                        style={vscDarkPlus}
                                                        customStyle={{
                                                            margin: 0,
                                                            padding: '1rem',
                                                            backgroundColor: 'rgba(0,0,0,0.3)',
                                                            fontSize: '13px',
                                                        }}
                                                        wrapLongLines={true}
                                                    >
                                                        {result.content}
                                                    </SyntaxHighlighter>

                                                    {/* Copy Overlay */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(result.content, result.block_id);
                                                            }}
                                                            className="bg-black/80 text-white p-1.5 rounded-lg shadow-lg hover:bg-purple-600 transition-colors"
                                                        >
                                                            {copiedId === result.block_id ? <Check size={14} /> : <Copy size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            query && <div className="text-center py-20 text-gray-600">No results found for "{query}"</div>
                        )}

                        {!loading && results.length === 0 && (
                            <div className="text-center py-20 text-gray-700">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No results found. Try adjusting your filters or query.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Bulk Action Bar */}
            {
                selectedIds.size > 0 && (
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1a1b26] border border-purple-500/50 shadow-2xl shadow-purple-900/40 rounded-full px-6 py-3 flex items-center space-x-6 z-50 animate-fade-in-up">
                        <span className="text-white font-medium text-sm">
                            {selectedIds.size} items selected
                        </span>
                        <button
                            onClick={handleBatchDeleteClick}
                            className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-full transition-colors text-sm font-bold border border-red-500/20"
                        >
                            <Trash2 size={16} />
                            <span>Delete Selected</span>
                        </button>
                    </div>
                )
            }

            {/* Confirm Dialogs */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, blockId: null })}
                onConfirm={confirmDelete}
                title="Delete Block"
                message="Are you sure you want to delete this block? This action cannot be undone."
                confirmText="Delete"
                isDestructive={true}
            />

            <ConfirmDialog
                isOpen={batchDeleteDialog.isOpen}
                onClose={() => setBatchDeleteDialog({ isOpen: false })}
                onConfirm={confirmBatchDelete}
                title={`Delete ${selectedIds.size} Items`}
                message={`Are you sure you want to delete ${selectedIds.size} selected items? This action cannot be undone.`}
                confirmText="Delete All"
                isDestructive={true}
            />

            {/* Editor Modal */}
            {editingBlock && (
                <MonacoEditorModal
                    code={editingBlock.content}
                    language={editingBlock.language}
                    onClose={() => setEditingBlock(null)}
                    onSave={(newContent) => handleSaveEdit({ ...editingBlock, content: newContent })}
                />
            )}
            {/* Regex Guide Modal */}
            <RegexGuideModal
                isOpen={showRegexGuide}
                onClose={() => setShowRegexGuide(false)}
            />
        </div >
    );
};

export default SearchPage;
