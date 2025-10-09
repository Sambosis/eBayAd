import React, { useEffect, useState, useCallback, useRef } from 'react';

interface AdGalleryModalProps {
  isOpen: boolean;
  ads: { url: string; name: string }[];
  initialIndex: number;
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

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);


const AdGalleryModal: React.FC<AdGalleryModalProps> = ({ isOpen, ads, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [copyButtonText, setCopyButtonText] = useState('Copy Image');
    const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
    const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
             document.body.style.overflow = 'auto';
        };
    }, [isOpen, initialIndex]);

    useEffect(() => {
        if (isOpen) {
            setCopyButtonText('Copy Image');
        }
    }, [currentIndex, isOpen]);

    useEffect(() => {
        if (isOpen) {
            thumbnailRefs.current[currentIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }, [currentIndex, isOpen]);

    const currentAd = ads[currentIndex];

    const goToPrevious = useCallback(() => {
        const isFirst = currentIndex === 0;
        const newIndex = isFirst ? ads.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, ads.length]);

    const goToNext = useCallback(() => {
        const isLast = currentIndex === ads.length - 1;
        const newIndex = isLast ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, ads.length]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowLeft') goToPrevious();
            if (event.key === 'ArrowRight') goToNext();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, goToPrevious, goToNext]);


    const handleDownload = useCallback(() => {
        if (!currentAd) return;
        const link = document.createElement('a');
        link.href = currentAd.url;
        const safeStyleName = currentAd.name.replace(/[^a-zA-Z0-9]/g, '-');
        link.download = `adspark-ai-ad-${safeStyleName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [currentAd]);

    const handleCopy = useCallback(async () => {
        if (!currentAd || !navigator.clipboard) return;
        try {
            const response = await fetch(currentAd.url);
            const blob = await response.blob();
            await navigator.clipboard.write([ new ClipboardItem({ [blob.type]: blob }) ]);
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy Image'), 2000);
        } catch (error) {
            console.error('Failed to copy image to clipboard:', error);
            setCopyButtonText('Copy Failed');
            setTimeout(() => setCopyButtonText('Copy Image'), 2000);
        }
    }, [currentAd]);

    if (!isOpen || !currentAd) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col z-50 animate-[fadeInScale_0.3s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-label="Ad Image Gallery"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20 p-2 bg-slate-900/50 rounded-full"
                aria-label="Close gallery"
            >
                <CloseIcon className="w-6 h-6" />
            </button>
            
            <div className="relative flex-1 flex items-center justify-center p-4 min-h-0">
                <img 
                    key={currentAd.url} // Force re-render for animation
                    src={currentAd.url} 
                    alt={`Enlarged ad preview for ${currentAd.name} style`} 
                    className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-[fadeInScale_0.3s_ease-out]" 
                />
                
                {ads.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white transition-all transform hover:scale-110"
                            aria-label="Previous image"
                        >
                            <ArrowLeftIcon className="w-6 h-6"/>
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white transition-all transform hover:scale-110"
                             aria-label="Next image"
                        >
                            <ArrowRightIcon className="w-6 h-6"/>
                        </button>
                    </>
                )}
            </div>

            <div className="flex-shrink-0 w-full text-center py-3">
                 <h2 className="text-lg font-bold text-white mb-2">{currentAd.name}</h2>
                 <div className="flex justify-center gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-slate-600 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out transform hover:bg-slate-800/80 hover:scale-105"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Download
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={copyButtonText !== 'Copy Image'}
                        className="flex items-center justify-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-slate-600 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out transform hover:bg-slate-800/80 hover:scale-105 disabled:opacity-70 disabled:scale-100"
                    >
                        <CopyIcon className="w-5 h-5" />
                        {copyButtonText}
                    </button>
                </div>
            </div>

            <div className="flex-shrink-0 w-full bg-black/20 backdrop-blur-lg">
                <div 
                    ref={thumbnailsContainerRef}
                    className="overflow-x-auto whitespace-nowrap p-4 flex items-center justify-start sm:justify-center gap-4"
                >
                    {ads.map((ad, index) => (
                        <button
                            key={ad.url}
                            // FIX: The ref callback function should not return a value. Wrapping the
                            // assignment in curly braces ensures a `void` return type.
                            ref={el => { thumbnailRefs.current[index] = el; }}
                            onClick={() => setCurrentIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden ring-2 focus:outline-none focus:ring-indigo-400 transition-all duration-300
                                ${currentIndex === index ? 'ring-indigo-400 scale-105' : 'ring-transparent hover:ring-indigo-400/50'}`
                            }
                            aria-label={`View ad in ${ad.name} style`}
                        >
                            <img src={ad.url} alt={ad.name} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdGalleryModal;