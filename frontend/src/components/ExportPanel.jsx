import React, { useState } from 'react';
import { Download, Package } from 'lucide-react';
import { exportBlocks } from '../services/api';

function ExportPanel({ fileId, totalBlocks }) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            await exportBlocks(fileId);
            setExporting(false);
        } catch (error) {
            console.error('Export error:', error);
            setExporting(false);
        }
    };

    return (
        <div className="glass-strong p-6 rounded-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Package className="w-8 h-8 text-purple-400" />
                    <div>
                        <h3 className="text-xl font-semibold gradient-text">Export Results</h3>
                        <p className="text-sm text-gray-400">
                            Download {totalBlocks} accepted blocks as categorized ZIP
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                    <Download className="w-5 h-5" />
                    {exporting ? 'Exporting...' : 'Export ZIP'}
                </button>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-4 text-center">
                <div className="bg-purple-500/10 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-purple-300">
                        {totalBlocks}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Total Blocks</p>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-lg">
                    <p className="text-sm text-blue-300 font-mono">
                        /codes
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Folder</p>
                </div>
                <div className="bg-green-500/10 p-4 rounded-lg">
                    <p className="text-sm text-green-300 font-mono">
                        /configs
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Folder</p>
                </div>
                <div className="bg-orange-500/10 p-4 rounded-lg">
                    <p className="text-sm text-orange-300 font-mono">
                        metadata.json
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Included</p>
                </div>
            </div>
        </div>
    );
}

export default ExportPanel;
