import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Save, X } from 'lucide-react';

function MonacoEditorModal({ code, language, onSave, onClose }) {
    const [editedCode, setEditedCode] = useState(code);

    const handleSave = () => {
        onSave(editedCode);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="glass-strong w-full max-w-5xl h-[80vh] rounded-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-semibold gradient-text">Edit Code</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1">
                    <Editor
                        height="100%"
                        language={language || 'plaintext'}
                        value={editedCode}
                        onChange={(value) => setEditedCode(value)}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            roundedSelection: true,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default MonacoEditorModal;
