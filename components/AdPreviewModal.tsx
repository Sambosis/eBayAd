import React, { useEffect, useState, useCallback } from 'react';

interface AdPreviewModalProps {
  selectedAd: { url: string; name: string } | null;
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v3.75m-7.332 0c-.055.194-.084.4-.084.612v3.75m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);


const AdPreviewModal: React.FC<AdPreviewModalProps> = ({ selectedAd, onClose }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy Image');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (selectedAd) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            setCopyButtonText('Copy Image'); // Reset button text when modal opens
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [selectedAd, onClose]);

    const handleDownload = useCallback(() => {
        if (!selectedAd) return;
        
        const link = document.createElement('a');
        link.href = selectedAd.url;
        const safeStyleName = selectedAd.name.replace(/[^a-zA-Z0-9]/g, '-');
        link.download = `ebay-ad-${safeStyleName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [selectedAd]);

    const handleCopy = useCallback(async () => {
        if (!selectedAd || !navigator.clipboard) return;

        try {
            const response = await fetch(selectedAd.url);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                }),
            ]);
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy Image'), 2000);
        } catch (error) {
            console.error('Failed to copy image to clipboard:', error);
            setCopyButtonText('Copy Failed');
             setTimeout(() => setCopyButtonText('Copy Image'), 2000);
        }
    }, [selectedAd]);


    if (!selectedAd) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Ad Preview"
        >
            <div 
                className="relative bg-slate-800/50 backdrop-blur-sm p-2 rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-slate-200 hover:text-white transition-colors z-20 p-2 bg-slate-900/70 rounded-full hover:bg-slate-900"
                    aria-label="Close preview"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <img 
                    src={selectedAd.url} 
                    alt={`Enlarged ad preview for ${selectedAd.name} style`} 
                    className="block rounded-lg max-w-[calc(100vw-4rem)] max-h-[calc(100vh-4rem)]" 
                />
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-slate-600 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out transform hover:bg-slate-800/80 hover:scale-105"
                        aria-label={`Download ad in ${selectedAd.name} style`}
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Download Image
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={copyButtonText !== 'Copy Image'}
                        className="flex items-center justify-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-slate-600 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out transform hover:bg-slate-800/80 hover:scale-105 disabled:opacity-70 disabled:scale-100"
                        aria-label={`Copy ad in ${selectedAd.name} style to clipboard`}
                    >
                        <CopyIcon className="w-5 h-5" />
                        {copyButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdPreviewModal;