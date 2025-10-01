import React, { useState } from 'react';

interface Style {
    name: string;
    description: string;
    prompt: string;
    isSuggested?: boolean;
}

interface GeneratedAdProps {
    styles: Style[];
    onGenerateStyle: (styleName: string) => void;
    imageUrls: Map<string, string | null>;
    onPreview: (url: string, styleName: string) => void;
    isActionable: boolean;
    onSuggestStyles: () => void;
    isSuggestingStyles: boolean;
    onGenerateAll: () => void;
    onBulkDownload: () => void;
}

// Icon Components
const ModernIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18h16.5V3H3.75zm12.75 12.75h-9v-9h9v9z" /></svg>;
const ElegantIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const LifestyleIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-3-1m-3 1l-3 1m-3-1l3 1m0 0l3 1.636m0-1.636l3-1.636m0 0l3 1.636m0-1.636l-3-1.636M6.75 9.75l3 1.636" /></svg>;
const TechIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm3-6h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm3-6h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zM6 18V6a2.25 2.25 0 012.25-2.25h4.5A2.25 2.25 0 0115 6v12a2.25 2.25 0 01-2.25 2.25h-4.5A2.25 2.25 0 016 18z" /></svg>;
const VintageIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const RetroFuturismIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a12.022 12.022 0 00-5.84-2.56m0 0a12.022 12.022 0 01-5.84 2.56m5.84-2.56V4.5a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25v2.25m12 6.042a12.022 12.022 0 00-5.84-2.56m5.84 2.56V18.75a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V14.37z" /></svg>;
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.476-1.476L12 18.75l1.938-.648a2.25 2.25 0 011.476-1.476L17.5 15.75l.648 1.938a2.25 2.25 0 011.476 1.476L21.25 19.5l-1.938.648a2.25 2.25 0 01-1.476 1.476z" />
    </svg>
);
const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311l-3.75 0M12 3c-3.866 0-7 3.134-7 7a7.004 7.004 0 004.5 6.545M12 3v5.25m0 0c-1.381 0-2.5 1.119-2.5 2.5s1.119 2.5 2.5 2.5 2.5-1.119 2.5-2.5S13.381 8.25 12 8.25z" />
    </svg>
);


const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const styleIconMap: { [key: string]: React.FC<{ className?: string }> } = {
    "Modern & Minimalist": ModernIcon,
    "Tech & Dynamic": TechIcon,
    "Elegant & Professional": ElegantIcon,
    "Lifestyle & Aspirational": LifestyleIcon,
    "Vintage & Nostalgic": VintageIcon,
    "Retro Futurism": RetroFuturismIcon,
};

// ... (keep all your existing interfaces and icon components)

const GeneratedAd: React.FC<GeneratedAdProps> = ({ styles, onGenerateStyle, imageUrls, onPreview, isActionable, onSuggestStyles, isSuggestingStyles, onGenerateAll, onBulkDownload }) => {
    const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

    const generatedCount = Array.from(imageUrls.values()).filter(v => v !== null).length;
    const isGenerating = Array.from(imageUrls.values()).some(v => v === null) && imageUrls.size > 0;

    return (
        <>
            <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200">
                    Click a Style to <span className="text-indigo-400">Generate</span>
                </h2>
                <div className="mt-2 flex flex-wrap gap-2 justify-center">
                    <button
                        onClick={onSuggestStyles}
                        disabled={!isActionable || isSuggestingStyles}
                        className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-indigo-300 font-semibold py-2.5 px-5 rounded-lg transition-all duration-300 ease-in-out text-sm"
                    >
                        {isSuggestingStyles ? (
                            <>
                                <SpinnerIcon className="w-4 h-4" />
                                Suggesting...
                            </>
                        ) : (
                            <>
                                <LightbulbIcon className="w-4 h-4" />
                                Suggest Styles
                            </>
                        )}
                    </button>
                    <button
                        onClick={onGenerateAll}
                        disabled={!isActionable || isGenerating}
                        className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-300 ease-in-out text-sm"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        Generate All
                    </button>
                    {generatedCount > 0 && (
                        <button
                            onClick={onBulkDownload}
                            className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-300 ease-in-out text-sm"
                        >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download All ({generatedCount})
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {styles.map((style) => {
                    const imageUrl = imageUrls.get(style.name);
                    const isGenerating = imageUrls.has(style.name) && imageUrl === null;
                    const IconComponent = style.isSuggested ? SparklesIcon : (styleIconMap[style.name] || SparklesIcon);

                    return (
                        <div
                            key={style.name}
                            className="relative"
                            onMouseEnter={() => setHoveredStyle(style.name)}
                            onMouseLeave={() => setHoveredStyle(null)}
                        >
                            {/* Tooltip */}
                            {hoveredStyle === style.name && !imageUrl && !isGenerating && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800"></div>
                                    <p className="text-xs font-semibold text-indigo-300 mb-1">{style.name}</p>
                                    <p className="text-xs text-slate-100 leading-relaxed">{style.description}</p>
                                </div>
                            )}

                            <div
                                className={`relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-700 transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-slate-900
                                ${isActionable && !imageUrl && !isGenerating ? 'cursor-pointer hover:border-indigo-500 hover:scale-[1.03]' : 'cursor-default'}
                                ${!isActionable && 'opacity-50'}
                            `}
                                onClick={() => {
                                    if (isActionable && !imageUrl && !isGenerating) {
                                        onGenerateStyle(style.name);
                                    } else if (imageUrl) {
                                        onPreview(imageUrl, style.name);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        if (isActionable && !imageUrl && !isGenerating) {
                                            onGenerateStyle(style.name);
                                        } else if (imageUrl) {
                                            onPreview(imageUrl, style.name);
                                        }
                                    }
                                }}
                                aria-label={imageUrl ? `Preview ad in ${style.name} style` : `Generate ad in ${style.name} style`}
                                role="button"
                                tabIndex={isActionable && !isGenerating ? 0 : -1}
                            >
                                {style.isSuggested && (
                                    <div className="absolute top-2 right-2 z-10 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                        AI
                                    </div>
                                )}

                                {isGenerating && (
                                    <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
                                        <SpinnerIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                )}

                                {imageUrl && (
                                    <>
                                        <img src={imageUrl} alt={`Generated ad in ${style.name} style`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <p className="text-white font-bold text-lg">Preview</p>
                                        </div>
                                    </>
                                )}
                                
                                {!imageUrl && !isGenerating && (
                                    <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center text-center p-3 sm:p-4 text-slate-100">
                                        <div className="absolute inset-0 overflow-hidden rounded-lg">
                                            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900" />
                                            <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.4),_transparent_60%)]" />
                                            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.25),_transparent_65%)]" />

                                            <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 text-left">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 shadow-lg shadow-indigo-500/10">
                                                        <IconComponent className="h-6 w-6 text-indigo-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-indigo-200/80">Ad Style</p>
                                                        <h3 className="mt-1 text-base sm:text-lg font-semibold leading-tight text-white">{style.name}</h3>
                                                    </div>
                                                </div>

                                                {/* Simplified description - just show truncated version */}
                                                <div className="mt-4 flex-1 overflow-hidden">
                                                    <p className="text-xs leading-relaxed text-slate-100 line-clamp-2">
                                                        {style.description}
                                                    </p>
                                                    <p className="mt-1 text-[0.65rem] text-indigo-300 font-medium">
                                                        Hover for full description
                                                    </p>
                                                </div>

                                                <div className="mt-5 flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-slate-100">
                                                    <span>{isActionable ? 'Ready' : 'Unavailable'}</span>
                                                    {isActionable && (
                                                        <span className="flex items-center gap-2 text-indigo-300">
                                                            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-indigo-300" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default GeneratedAd;
