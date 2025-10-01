import React from 'react';
import type { HistoryItem } from '../App';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    historyItems: HistoryItem[];
    onLoadItem: (id: number) => void;
    onClearHistory: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, historyItems, onLoadItem, onClearHistory }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <aside
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-800/95 backdrop-blur-lg shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-panel-title"
            >
                {/* Gradient glow effect on the left edge */}
                <div className="absolute -left-8 top-0 bottom-0 w-8 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-transparent blur-xl pointer-events-none"></div>

                <div className="flex flex-col h-full relative">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <h2 id="history-panel-title" className="text-xl font-bold text-white">Saved <span className="text-indigo-400">Sessions</span></h2>
                        <button onClick={onClose} className="p-1.5 rounded-full text-slate-200 hover:bg-slate-700 hover:text-white transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {historyItems.length === 0 ? (
                            <div className="text-center text-slate-300 h-full flex flex-col justify-center items-center">
                                <p className="text-lg font-semibold text-white">No Saved <span className="text-indigo-400">History</span></p>
                                <p className="text-sm mt-2">Generate some ads and click <span className="text-indigo-300">"Save to History"</span> to see them here.</p>
                            </div>
                        ) : (
                            historyItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 flex gap-4 hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-300 animate-[slideIn_0.3s_ease-out] relative group"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Subtle gradient glow on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 rounded-lg transition-all duration-300 pointer-events-none"></div>

                                    <img
                                        src={`data:${item.productImage.type};base64,${item.productImage.base64}`}
                                        alt={item.productName}
                                        className="w-20 h-20 object-contain rounded-md bg-slate-800 relative z-10"
                                    />
                                    <div className="flex-1 relative z-10">
                                        <p className="font-semibold text-white truncate" title={item.productName}>
                                            {item.productName || 'Untitled Product'}
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-300 mt-1">
                                            {item.ads.length} ad{item.ads.length !== 1 ? 's' : ''} generated
                                        </p>
                                        <button
                                            onClick={() => onLoadItem(item.id)}
                                            className="mt-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded-md transition-all duration-200 hover:scale-105"
                                        >
                                            Load Session
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {historyItems.length > 0 && (
                        <div className="p-4 border-t border-slate-700">
                            <button
                                onClick={onClearHistory}
                                className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                <TrashIcon className="w-5 h-5" />
                                Clear History
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default HistoryPanel;
