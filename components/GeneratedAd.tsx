import React from 'react';

interface Style {
    name: string;
    description: string;
}

interface GeneratedAdProps {
    styles: Style[];
    onGenerateStyle: (styleName: string) => void;
    imageUrls: Map<string, string | null>;
    onPreview: (url: string) => void;
    isActionable: boolean;
}

// Icon Components
const ModernIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18h16.5V3H3.75zm12.75 12.75h-9v-9h9v9z" /></svg>;
const BoldIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const ElegantIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const LifestyleIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-3-1m-3 1l-3 1m-3-1l3 1m0 0l3 1.636m0-1.636l3-1.636m0 0l3 1.636m0-1.636l-3-1.636M6.75 9.75l3 1.636" /></svg>;
const TechIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm3-6h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm3-6h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zM6 18V6a2.25 2.25 0 012.25-2.25h4.5A2.25 2.25 0 0115 6v12a2.25 2.25 0 01-2.25 2.25h-4.5A2.25 2.25 0 016 18z" /></svg>;
const PlayfulIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.362z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 10.5a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3zM10.5 9a.75.75 0 00-1.5 0v5.25a.75.75 0 001.5 0V9zM6 10.5a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3z" /></svg>;
const VintageIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const LineArtIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>;
const RetroFuturismIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a12.022 12.022 0 00-5.84-2.56m0 0a12.022 12.022 0 01-5.84 2.56m5.84-2.56V4.5a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25v2.25m12 6.042a12.022 12.022 0 00-5.84-2.56m5.84 2.56V18.75a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V14.37z" /></svg>;

const styleIconMap: { [key: string]: React.FC<{ className?: string }> } = {
    "Modern & Spec Driven": ModernIcon,
    "Bold & Dynamic": BoldIcon,
    "Elegant & Professional": ElegantIcon,
    "Lifestyle & Aspirational": LifestyleIcon,
    "Tech-Forward & Futuristic": TechIcon,
    "Playful & Colorful": PlayfulIcon,
    "Vintage & Nostalgic": VintageIcon,
    "Minimalist Line Art": LineArtIcon,
    "Retro Futurism": RetroFuturismIcon,
};


const GeneratedAd: React.FC<GeneratedAdProps> = ({ styles, onGenerateStyle, imageUrls, onPreview, isActionable }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {styles.map((style) => {
                const imageUrl = imageUrls.get(style.name);
                const isGenerating = imageUrls.has(style.name) && imageUrl === null;

                const IconComponent = styleIconMap[style.name] || ModernIcon; // Default icon

                return (
                    <div
                        key={style.name}
                        className={`relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-700 transition-all duration-300 group
                            ${isActionable && !imageUrl && !isGenerating ? 'cursor-pointer hover:border-indigo-500 hover:scale-[1.03]' : 'cursor-default'}
                            ${!isActionable && 'opacity-50'}
                        `}
                        onClick={() => {
                            if (isActionable && !imageUrl && !isGenerating) {
                                onGenerateStyle(style.name);
                            } else if (imageUrl) {
                                onPreview(imageUrl);
                            }
                        }}
                        onKeyDown={(e) => {
                             if (e.key === 'Enter' || e.key === ' ') {
                                if (isActionable && !imageUrl && !isGenerating) {
                                    onGenerateStyle(style.name);
                                } else if (imageUrl) {
                                    onPreview(imageUrl);
                                }
                             }
                        }}
                        aria-label={imageUrl ? `Preview ad in ${style.name} style` : `Generate ad in ${style.name} style`}
                        role="button"
                        tabIndex={isActionable && !isGenerating ? 0 : -1}
                    >
                        {isGenerating && (
                            // Skeleton Loader
                            <div className="absolute inset-0 bg-slate-800 animate-pulse"></div>
                        )}

                        {imageUrl && (
                            // Generated Image
                            <>
                                <img src={imageUrl} alt={`Generated ad in ${style.name} style`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white font-bold text-lg">Preview</p>
                                </div>
                            </>
                        )}
                        
                        {!imageUrl && !isGenerating && (
                            // Placeholder
                            <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center text-center p-3 sm:p-4 text-slate-300">
                                <IconComponent className="w-8 h-8 mb-2 text-slate-400 flex-shrink-0" />
                                <h3 className="font-semibold text-sm sm:text-base leading-tight text-white">{style.name}</h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">{style.description}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default GeneratedAd;