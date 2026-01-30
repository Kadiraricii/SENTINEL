import React from 'react';

const HistoryPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Extraction History</h2>
            <p className="text-gray-400 max-w-md">
                This feature will allow you to browse past sessions and re-export extracted blocks.
            </p>
            <div className="mt-8 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                Coming in v2.1
            </div>
        </div>
    );
};

export default HistoryPage;
