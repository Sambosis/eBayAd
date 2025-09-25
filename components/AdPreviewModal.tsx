import React, { useEffect } from 'react';

interface AdPreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const AdPreviewModal: React.FC<AdPreviewModalProps> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (imageUrl) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [imageUrl, onClose]);

    if (!imageUrl) {
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
                className="relative bg-slate-800 p-4 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors z-10 p-1 bg-slate-800/50 rounded-full"
                    aria-label="Close preview"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow flex items-center justify-center overflow-hidden">
                   <img src={imageUrl} alt="Enlarged ad preview" className="max-w-full max-h-full object-contain rounded-md" />
                </div>
            </div>
        </div>
    );
};

export default AdPreviewModal;
