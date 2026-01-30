import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';

function FileUpload({ onUpload, loading }) {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            onUpload(acceptedFiles[0]);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt', '.log', '.sh', '.bat', '.config', '.ini', '.env'],
            'text/markdown': ['.md'],
            'application/x-python': ['.py'],
            'text/javascript': ['.js', '.jsx', '.ts', '.tsx'],
            'application/x-ruby': ['.rb'],
            'application/x-php': ['.php'],
            'text/x-csharp': ['.cs'],
            'text/x-kotlin': ['.kt'],
            'application/json': ['.json'],
            'application/x-yaml': ['.yaml', '.yml'],
            'application/xml': ['.xml'],
        },
        maxFiles: 1,
        disabled: loading,
    });

    return (
        <div
            {...getRootProps()}
            className={`
        glass-strong p-12 rounded-2xl border-2 border-dashed cursor-pointer
        transition-all duration-300
        ${isDragActive ? 'border-purple-400 bg-purple-500/10 scale-105' : 'border-gray-600 hover:border-purple-500'}
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
        >
            <input {...getInputProps()} />

            <div className="text-center">
                <div className="mb-6 flex justify-center">
                    {isDragActive ? (
                        <FileText className="w-20 h-20 text-purple-400 animate-bounce" />
                    ) : (
                        <Upload className="w-20 h-20 text-gray-400 animate-float" />
                    )}
                </div>

                <h3 className="text-2xl font-semibold mb-3 gradient-text">
                    {loading ? 'Processing...' : isDragActive ? 'Drop it here!' : 'Upload Your Document'}
                </h3>

                <p className="text-gray-300 mb-2">
                    Drag & drop PDF, Markdown, or Code files
                </p>

                <div className="mt-4 flex flex-wrap gap-2 justify-center text-sm text-gray-400 max-w-lg mx-auto">
                    <span className="px-3 py-1 bg-purple-500/20 rounded-full">PDF</span>
                    <span className="px-3 py-1 bg-purple-500/20 rounded-full">DOCX</span>
                    <span className="px-3 py-1 bg-pink-500/20 rounded-full">Markdown</span>
                    <span className="px-3 py-1 bg-blue-500/20 rounded-full">Python</span>
                    <span className="px-3 py-1 bg-yellow-500/20 rounded-full">JS/TS</span>
                    <span className="px-3 py-1 bg-red-500/20 rounded-full">Ruby</span>
                    <span className="px-3 py-1 bg-indigo-500/20 rounded-full">PHP</span>
                    <span className="px-3 py-1 bg-green-500/20 rounded-full">C#</span>
                    <span className="px-3 py-1 bg-orange-500/20 rounded-full">Kotlin</span>
                    <span className="px-3 py-1 bg-gray-500/20 rounded-full">Bash</span>
                    <span className="px-3 py-1 bg-gray-500/20 rounded-full">Configs</span>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                    Maximum file size: 50MB
                </p>
            </div>
        </div>
    );
}

export default FileUpload;
