import React from 'react';

interface GeneratedAdProps {
    imageUrls: string[] | null;
    isLoading: boolean;
    onPreview: (url: string) => void;
}

const PlaceholderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const PreviewIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
);

const AdPlaceholder: React.FC<{title: string, description: string}> = ({title, description}) => (
    <div className="text-center text-slate-500 p-2">
        <PlaceholderIcon className="w-12 h-12 mx-auto mb-3" />
        <p className="font-semibold">{title}</p>
        <p className="text-sm">{description}</p>
    </div>
);

const AdSkeletonLoader: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
        <svg className="w-12 h-12 mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-semibold">Designing...</p>
    </div>
);


const GeneratedAd: React.FC<GeneratedAdProps> = ({ imageUrls, isLoading, onPreview }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && (
                <>
                    <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden"><AdSkeletonLoader/></div>
                    <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden"><AdSkeletonLoader/></div>
                    <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden"><AdSkeletonLoader/></div>
                </>
            )}

            {!isLoading && imageUrls && (
                 imageUrls.map((url, index) => (
                    <div key={index} className="flex flex-col items-center gap-3">
                         <div className="relative group w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src={url} alt={`Generated eBay Ad Style ${index + 1}`} className="w-full h-full object-contain" />
                             <button
                                onClick={() => onPreview(url)}
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                                aria-label={`Preview ad style ${index + 1}`}
                            >
                                <PreviewIcon className="w-12 h-12 text-white" />
                            </button>
                        </div>
                        <a
                            href={url}
                            download={`generated-ebay-ad-style-${index + 1}.png`}
                            className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 w-full sm:w-auto"
                            aria-label={`Download generated ad style ${index + 1}`}
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Download Style {index + 1}
                        </a>
                    </div>
                 ))
            )}

            {!isLoading && !imageUrls && (
                <>
                    <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                        <AdPlaceholder title="Style 1: Modern" description="Your clean & elegant ad."/>
                    </div>
                     <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                        <AdPlaceholder title="Style 2: Dynamic" description="Your Black & white ad."/>
                    </div>
                    <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                        <AdPlaceholder title="Style 3: Balanced" description="Your professional ad."/>
                    </div>
                </>
            )}
        </div>
    );
};

export default GeneratedAd;