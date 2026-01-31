
import React, { useState } from 'react';
import { toast } from 'sonner';
import FileUpload from '../components/FileUpload';
import GitImport from '../components/GitImport';
import SplitView from '../components/SplitView';
import ExportPanel from '../components/ExportPanel';
import GitHubButton from '../components/GitHubButton';
import { uploadFile, extractBlocks, getFileContent } from '../services/api';
import { FileText, Github, CheckCircle, ChevronDown, ChevronUp, Folder, ArrowLeft, RefreshCw, Upload as UploadIcon } from 'lucide-react';
import TubesBackground from '../components/ui/neon-flow';

const FileList = ({ files, selectedId, onSelect }) => {
    // Determine initial state
    const [isOpen, setIsOpen] = useState(true);

    if (!files || files.length === 0) return null;

    return (
        <div className="w-full bg-[#16161e] border-r border-white/5 flex flex-col h-[calc(100vh-200px)] min-w-[280px]">
            {/* Sidebar Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Explorer</span>
                <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-1 rounded-full">
                    {files.length} Files
                </span>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {files.map((file, idx) => {
                    const isSelected = file.id === selectedId;
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelect(file)}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all font-mono truncate flex items-center group relative
                                ${isSelected
                                    ? 'bg-purple-600/20 text-white border border-purple-500/30 shadow-lg shadow-purple-900/10'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute left-0 w-1 h-full bg-purple-500 rounded-l-lg opacity-50"></div>
                            )}
                            <FileText size={14} className={`mr-2 flex-shrink-0 ${isSelected ? 'text-purple-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                            <span className="flex-1 truncate">{file.path || file}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const UploadPage = () => {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' (default) or 'explorer' (git result)

    // File Upload State
    const [uploadFileId, setUploadFileId] = useState(null);
    const [uploadFileName, setUploadFileName] = useState('');
    const [uploadContent, setUploadContent] = useState('');
    const [uploadBlocks, setUploadBlocks] = useState([]);

    // Git State
    const [gitResult, setGitResult] = useState(null);
    const [gitFileId, setGitFileId] = useState(null);
    const [gitFileName, setGitFileName] = useState('');
    const [gitContent, setGitContent] = useState('');
    const [gitBlocks, setGitBlocks] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Handlers for regular File Upload ---
    const handleFileUpload = async (file) => {
        try {
            setLoading(true);
            setError(null);
            setActiveTab('upload');
            setGitResult(null); // Clear git context if uploading new file manually

            // Upload
            const uploadResult = await uploadFile(file);
            setUploadFileId(uploadResult.file_id);
            setUploadFileName(uploadResult.filename);

            // Extract
            const extractionResult = await extractBlocks(uploadResult.file_id);
            setUploadBlocks(extractionResult.blocks);

            // Show Stats
            if (extractionResult.stats) {
                const { ast_parsed, fallback_extracted, total_extracted } = extractionResult.stats;

                if (fallback_extracted > 0) {
                    toast.warning(
                        <div className="flex flex-col space-y-1">
                            <span className="font-bold">Extraction Complete with Warnings</span>
                            <span className="text-xs opacity-90">
                                {ast_parsed} blocks parsed perfectly (AST).
                                <br />
                                {fallback_extracted} blocks used fallback text extraction (lower confidence).
                            </span>
                        </div>,
                        { duration: 6000 }
                    );
                } else {
                    toast.success(
                        <div className="flex flex-col space-y-1">
                            <span className="font-bold">Extraction Successful!</span>
                            <span className="text-xs opacity-90">
                                All {total_extracted} blocks parsed with full AST precision.
                            </span>
                        </div>
                    );
                }
            }

            // Read Content
            const reader = new FileReader();
            reader.onload = (e) => setUploadContent(e.target.result);
            reader.readAsText(file);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to process file');
            setLoading(false);
        }
    };

    // --- Handlers for Git Import ---
    const handleGitSuccess = (result) => {
        setGitResult(result);
        setActiveTab('explorer');
        setGitFileId(null); // Reset selection
        setGitBlocks([]);
        setGitContent('');
    };

    const handleGitFileSelect = async (file) => {
        if (!file.id) return;

        try {
            setLoading(true);
            setError(null);
            setGitFileId(file.id);
            setGitFileName(file.path);

            // 1. Get Content
            const contentData = await getFileContent(file.id);
            setGitContent(contentData.content);

            // 2. Get Blocks (Fetch or Extract)
            const extractionResult = await extractBlocks(file.id);
            setGitBlocks(extractionResult.blocks);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load file data');
            setLoading(false);
        }
    };

    const handleNewImport = () => {
        if (window.confirm("Start a new import? Current results will be cleared.")) {
            setGitResult(null);
            setActiveTab('upload');
        }
    };

    // --- Render Logic ---

    // 1. Explorer Mode (Sidebar Layout)
    if (gitResult && activeTab === 'explorer') {
        // Explorer View - Full Width & Height (No Container Constraints)
        return (
            <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0f1016]">
                {/* Note: Negative margins to stretch full width in layout if needed, or just normal container */}

                {/* Left Sidebar */}
                <div className="w-80 flex flex-col bg-[#13141c] border-r border-white/5">
                    <div className="p-4 border-b border-white/5 bg-[#1a1b26]">
                        <h3 className="font-bold text-white truncate text-sm" title={gitResult.repo_name}>
                            <Github size={14} className="inline mr-2 mb-1" />
                            {gitResult.repo_name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">
                                {gitResult.files.length} Files
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                                {gitResult.batch_id.slice(0, 8)}
                            </span>
                        </div>
                    </div>

                    <FileList
                        files={gitResult.files}
                        selectedId={gitFileId}
                        onSelect={handleGitFileSelect}
                    />

                    <div className="p-4 border-t border-white/5 bg-[#1a1b26]">
                        <button
                            onClick={handleNewImport}
                            className="w-full flex items-center justify-center space-x-2 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors text-xs font-medium"
                        >
                            <RefreshCw size={14} />
                            <span>Import Another Repo</span>
                        </button>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 overflow-y-auto bg-[#1a1b26] p-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                            <p className="mt-4 text-gray-400 animate-pulse text-sm">Analyzing file...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-400">
                            <p>{error}</p>
                        </div>
                    ) : gitFileId ? (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    <FileText className="mr-2 text-purple-400" size={24} />
                                    {gitFileName}
                                </h2>
                                <div className="text-gray-500 text-xs font-mono">
                                    ID: {gitFileId}
                                </div>
                            </div>

                            <SplitView
                                originalContent={gitContent}
                                extractedBlocks={gitBlocks}
                                onBlockUpdate={setGitBlocks}
                            />

                            {gitBlocks.length > 0 && (
                                <ExportPanel fileId={gitFileId} totalBlocks={gitBlocks.length} />
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center">
                                <Folder size={40} className="text-gray-600" />
                            </div>
                            <p className="text-lg">Select a file from the explorer to view analysis</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 2. Default Upload View
    return (
        <TubesBackground sidebarOffset={80}>
            <div className="flex items-center justify-center min-h-screen w-full pointer-events-auto" style={{ marginLeft: '-40px' }}>
                <div className="space-y-4 max-w-[1200px] w-full px-6 py-6">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-1">Upload & Analyze</h2>
                        <p className="text-sm text-gray-400">Upload files or import repositories for analysis.</p>
                    </div>

                    {/* If a file is uploaded, show it (similar to previous view) */}
                    {uploadFileId ? (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6 bg-[#1a1b26] p-4 rounded-xl border border-white/5">
                                <div>
                                    <h3 className="text-white font-medium">Active File: <span className="text-purple-400">{uploadFileName}</span></h3>
                                    <p className="text-xs text-gray-500">ID: {uploadFileId}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setUploadFileId(null);
                                        setUploadContent('');
                                        setUploadBlocks([]);
                                    }}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center space-x-2"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Back to Upload</span>
                                </button>
                            </div>

                            <SplitView
                                originalContent={uploadContent}
                                extractedBlocks={uploadBlocks}
                                onBlockUpdate={setUploadBlocks}
                            />

                            {uploadBlocks.length > 0 && (
                                <div className="mt-6">
                                    <ExportPanel fileId={uploadFileId} totalBlocks={uploadBlocks.length} />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Tab Selection for NEW Upload/Import */
                        <div className="w-full">
                            <div className="flex justify-center space-x-3 mb-6">
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${!gitResult && activeTab !== 'git-form'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                                        }`}
                                >
                                    <UploadIcon size={16} />
                                    <span>File Upload</span>
                                </button>
                                <GitHubButton onClick={() => setActiveTab('git-form')} />
                            </div>

                            <div className="w-full">
                                {activeTab === 'git-form' ? (
                                    <GitImport onImportSuccess={handleGitSuccess} />
                                ) : (
                                    <div className="w-full max-w-lg mx-auto">
                                        <FileUpload onUpload={handleFileUpload} loading={loading} />
                                        {error && (
                                            <div className="mt-4 p-4 bg-red-500/20 rounded-lg border border-red-500/50">
                                                <p className="text-red-200">{error}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TubesBackground>
    );
};

export default UploadPage;
