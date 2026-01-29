import React from 'react';
import Split from 'react-split';
import CodeCard from './CodeCard';

function SplitView({ originalContent, extractedBlocks, onBlockUpdate }) {
    return (
        <Split
            sizes={[50, 50]}
            minSize={300}
            gutterSize={10}
            className="flex gap-4"
            style={{ height: 'calc(100vh - 250px)' }}
        >
            {/* Left Panel - Original Content */}
            <div className="glass-strong p-6 rounded-2xl overflow-auto">
                <h2 className="text-2xl font-semibold mb-4 gradient-text">
                    Original Document
                </h2>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {originalContent}
                </pre>
            </div>

            {/* Right Panel - Extracted Blocks */}
            <div className="glass-strong p-6 rounded-2xl overflow-auto">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-2xl font-semibold gradient-text">
                        Extracted Blocks
                    </h2>
                    <span className="px-4 py-2 bg-purple-500/20 rounded-full text-sm">
                        {extractedBlocks.length} blocks
                    </span>
                </div>

                <div className="space-y-4">
                    {extractedBlocks.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p>No blocks extracted yet</p>
                        </div>
                    ) : (
                        extractedBlocks.map((block) => (
                            <CodeCard
                                key={block.id}
                                block={block}
                                onUpdate={(updatedBlock) => {
                                    onBlockUpdate(
                                        extractedBlocks.map((b) =>
                                            b.id === updatedBlock.id ? updatedBlock : b
                                        )
                                    );
                                }}
                            />
                        ))
                    )}
                </div>
            </div>
        </Split>
    );
}

export default SplitView;
