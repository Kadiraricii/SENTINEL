import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import SplitView from './components/SplitView';
import ExportPanel from './components/ExportPanel';
import { uploadFile, extractBlocks } from './services/api';

function App() {
    const [fileId, setFileId] = useState(null);
    const [fileName, setFileName] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [extractedBlocks, setExtractedBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileUpload = async (file) => {
        try {
            setLoading(true);
            setError(null);

            // Upload file
            const uploadResult = await uploadFile(file);
            setFileId(uploadResult.file_id);
            setFileName(uploadResult.filename);

            // Trigger extraction
            const extractionResult = await extractBlocks(uploadResult.file_id);
            setExtractedBlocks(extractionResult.blocks);

            // For display purposes, we can't get original content from backend easily
            // In a real scenario, you might want to read the file client-side too
            const reader = new FileReader();
            reader.onload = (e) => {
                setOriginalContent(e.target.result);
            };
            reader.readAsText(file);

            setLoading(false);
        } catch (err) {
            console.error('Upload/extraction error:', err);
            setError(err.response?.data?.detail || 'Failed to process file');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-5xl font-bold gradient-text mb-2">
                    HPES
                </h1>
                <p className="text-gray-300 text-lg">
                    Hybrid-Professional Extraction System
                </p>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {!fileId ? (
                    <div className="glass-strong p-12 text-center">
                        <FileUpload onUpload={handleFileUpload} loading={loading} />
                        {error && (
                            <div className="mt-4 p-4 bg-red-500/20 rounded-lg border border-red-500/50">
                                <p className="text-red-200">{error}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                                <p className="mt-4 text-gray-300">Processing your file...</p>
                            </div>
                        ) : (
                            <>
                                <SplitView
                                    originalContent={originalContent}
                                    extractedBlocks={extractedBlocks}
                                    onBlockUpdate={setExtractedBlocks}
                                />

                                {extractedBlocks.length > 0 && (
                                    <div className="mt-6">
                                        <ExportPanel fileId={fileId} totalBlocks={extractedBlocks.length} />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="max-w-7xl mx-auto mt-12 text-center text-gray-400 text-sm">
                <p>Powered by Tree-sitter AST · FastAPI · React</p>
            </div>
        </div>
    );
}

export default App;
