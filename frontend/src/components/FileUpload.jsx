import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

function FileUpload({ onUpload, loading }) {
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, success, error

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setUploadStatus('idle');
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
                relative overflow-hidden
                backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-cyan-500/10
                p-16 rounded-3xl border-2 border-dashed cursor-pointer
                transition-all duration-500 ease-out
                ${isDragActive
                    ? 'border-pink-400 bg-purple-500/20 scale-[1.02] shadow-[0_0_60px_rgba(236,72,153,0.4)]'
                    : 'border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-500/15 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                group
            `}
        >
            <input {...getInputProps()} />

            {/* Animated Background Grid */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                }}></div>
            </div>

            {/* Neon Glow Overlay */}
            {isDragActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 animate-pulse"></div>
            )}

            <div className="relative text-center">
                {/* Icon Container with Neon Glow */}
                <div className={`
                    inline-flex items-center justify-center
                    w-32 h-32 mb-8 rounded-full
                    bg-gradient-to-br from-purple-600/20 to-pink-600/20
                    backdrop-blur-md border border-white/10
                    transition-all duration-500
                    ${isDragActive
                        ? 'scale-110 shadow-[0_0_60px_rgba(236,72,153,0.6)] border-pink-400/50'
                        : 'group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]'
                    }
                `}>
                    {loading ? (
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-pink-500 rounded-full animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-pink-400 animate-pulse" />
                        </div>
                    ) : isDragActive ? (
                        <FileText className="w-20 h-20 text-pink-400 animate-bounce drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]" />
                    ) : (
                        <Upload className={`
                            w-20 h-20 text-purple-400 
                            transition-all duration-300
                            group-hover:text-pink-400 group-hover:drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]
                            ${loading ? '' : 'group-hover:animate-pulse'}
                        `} />
                    )}
                </div>

                {/* Main Title with Holographic Effect */}
                <h3 className={`
                    text-5xl font-extrabold mb-4
                    bg-clip-text text-transparent bg-gradient-to-r
                    transition-all duration-300
                    ${isDragActive
                        ? 'from-pink-400 via-purple-400 to-cyan-400 animate-pulse'
                        : 'from-purple-400 via-pink-400 to-purple-400'
                    }
                `}>
                    {loading ? 'Processing...' : isDragActive ? 'Release to Upload!' : 'Upload Document'}
                </h3>

                {/* Subtitle */}
                <p className="text-gray-300 text-xl font-semibold mb-3">
                    Drag & drop or click to browse
                </p>
                <p className="text-gray-400 text-base font-medium mb-8">
                    AI-powered code extraction
                </p>

                {/* File Type Badges */}
                <div className="flex flex-wrap gap-2 justify-center text-sm font-bold max-w-2xl mx-auto mb-6">
                    {[
                        { name: 'PDF', color: 'from-purple-500 to-purple-600', glow: 'purple' },
                        { name: 'DOCX', color: 'from-blue-500 to-blue-600', glow: 'blue' },
                        { name: 'Markdown', color: 'from-pink-500 to-pink-600', glow: 'pink' },
                        { name: 'Python', color: 'from-yellow-500 to-yellow-600', glow: 'yellow' },
                        { name: 'JS/TS', color: 'from-cyan-500 to-cyan-600', glow: 'cyan' },
                        { name: 'Ruby', color: 'from-red-500 to-red-600', glow: 'red' },
                        { name: 'PHP', color: 'from-indigo-500 to-indigo-600', glow: 'indigo' },
                        { name: 'C#', color: 'from-green-500 to-green-600', glow: 'green' },
                        { name: 'Kotlin', color: 'from-orange-500 to-orange-600', glow: 'orange' },
                        { name: 'Configs', color: 'from-gray-500 to-gray-600', glow: 'gray' },
                    ].map((badge) => (
                        <span
                            key={badge.name}
                            className={`
                                px-4 py-2 rounded-lg
                                bg-gradient-to-r ${badge.color}
                                text-white
                                backdrop-blur-sm border border-white/20
                                transition-all duration-300
                                hover:scale-110 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]
                                cursor-default
                            `}
                        >
                            {badge.name}
                        </span>
                    ))}
                </div>

                {/* File Size Limit */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
                    <span className="text-sm text-gray-300 font-bold">MAX: 50MB</span>
                </div>

                {/* Scan Line Animation */}
                {isDragActive && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-scan-line shadow-[0_0_20px_rgba(236,72,153,0.8)]"></div>
                    </div>
                )}
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-purple-500/50 rounded-tl-3xl"></div>
            <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-pink-500/50 rounded-tr-3xl"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-cyan-500/50 rounded-bl-3xl"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-purple-500/50 rounded-br-3xl"></div>
        </div>
    );
}

export default FileUpload;
