import React, { useState, useCallback, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedAd from './components/GeneratedAd';
import AdPreviewModal from './components/AdPreviewModal';
import HistoryPanel from './components/HistoryPanel';
import TutorialOverlay from './components/TutorialOverlay';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
    generateProductInfoFromImage,
    generateAdImage,
    generateAdStyleSuggestions,
} from './services/geminiService';

// --- TYPE DEFINITIONS ---

interface Style {
    name: string;
    description: string;
    prompt: string;
    isSuggested?: boolean;
}

export interface HistoryItem {
    id: number;
    createdAt: number;
    productName: string;
    productDescription: string;
    productImage: {
        base64: string;
        type: string;
    };
    ads: { name: string; url: string }[];
    styles: Style[];
}

// --- CONSTANTS ---

const DEFAULT_STYLES: Style[] = [
    {
        name: "Modern & Minimalist",
        description: "Clean, professional design with bold typography, geometric layouts, and striking color contrasts.",
        prompt: "Modern & Minimalist: Ultra-clean design with generous white space and grid-based layout. Product positioned prominently at 45-degree angle with crisp drop shadow. Use bold, oversized sans-serif typography (Helvetica/Inter style) for product name. Feature icons in a clean horizontal row with labels. Color palette: Pure white background with ONE bold accent color (electric blue, vibrant orange, or deep purple) used sparingly. Include 3-4 key specs in clean info cards with icon pairs. Add subtle gradient overlays. High contrast, sharp edges, contemporary and premium feel."
    },
    {
        name: "Tech & Cyberpunk",
        description: "Futuristic neon-lit design with dark backgrounds, glowing effects, and digital aesthetics.",
        prompt: "Tech & Cyberpunk: Dark background (deep navy or pure black) with electric neon accents (cyan, magenta, neon green). Product centered with dramatic lighting and neon glow effects. Typography: Bold, angular, uppercase geometric fonts. Add circuit board patterns, digital grid lines, or hexagonal tech patterns in background. Feature specs in glowing holographic-style cards. Use scan line effects and digital glitches sparingly. Include tech-style icons with neon outlines. Create depth with layered neon highlights and shadows. Mood: High-tech, gaming, cutting-edge innovation."
    },
    {
        name: "Premium Luxury",
        description: "Sophisticated design with gold accents, elegant serif fonts, and high-end photography style.",
        prompt: "Premium Luxury: Rich, sophisticated color scheme (deep navy, charcoal black, burgundy) with metallic gold or rose gold accents. Product showcased like fine jewelry with perfect studio lighting and reflection. Typography: Elegant serif fonts (Playfair/Cormorant style) for headers, refined sans-serif for body. Add subtle textures (linen, marble, or leather patterns). Feature specs in ornate bordered frames. Include premium badges (quality seals, warranty icons). Use symmetrical, balanced composition. Soft shadows and highlights for dimension. Mood: Trustworthy, exclusive, high-value."
    },
    {
        name: "Bold & Energetic",
        description: "Eye-catching design with vibrant colors, dynamic angles, and explosive visual energy.",
        prompt: "Bold & Energetic: Vibrant, saturated color palette (think sports brands - bright yellows, reds, electric blues). Product at dynamic 30-degree angle with motion blur or speed lines. Typography: Ultra-bold, condensed fonts with slight italics for movement. Add explosive shapes: diagonal slashes, arrows, starbursts. Feature callouts with angular speech bubbles or badges. Use high contrast complementary colors. Include action-oriented icons (lightning bolts, stars, check marks). Gradient backgrounds from bold to darker tones. Mood: Exciting, youthful, action-packed."
    },
    {
        name: "Natural & Organic",
        description: "Earthy, eco-friendly design with natural textures, soft colors, and handcrafted aesthetics.",
        prompt: "Natural & Organic: Soft, natural color palette (sage green, warm beige, terracotta, soft cream). Product on textured background (wood grain, linen, recycled paper). Typography: Friendly rounded sans-serif or hand-written style fonts. Add organic shapes (leaves, branches, stones) as decorative elements. Feature specs in earth-toned cards with natural borders. Use sustainable/eco icons (leaves, recycling, earth). Include subtle paper textures or watercolor washes. Soft, natural shadows. Mood: Eco-conscious, authentic, wholesome, trustworthy."
    },
    {
        name: "Vintage Retro",
        description: "Nostalgic design with retro color schemes, classic typography, and aged textures.",
        prompt: "Vintage Retro: Warm retro color palette (mustard yellow, burnt orange, avocado green, brown tones). Add aged paper texture with subtle grain and coffee stains. Product presented with vintage advertising style. Typography: Classic fonts (Cooper Black, Rockwell, or vintage script). Include retro badges, stamps, and ribbon banners. Feature specs in vintage label designs. Add halftone patterns or screenprint textures. Use muted, desaturated colors. Include retro icons (stars, badges, vintage illustrations). Mood: Nostalgic, authentic, timeless quality."
    },
    {
        name: "Info-Graphic Style",
        description: "Data-driven design with charts, diagrams, comparison visuals, and statistical presentation.",
        prompt: "Info-Graphic Style: Clean infographic layout with product as centerpiece. Use visual data: pie charts showing feature breakdowns, bar graphs comparing specs, timeline diagrams. Typography: Clean, modern sans-serif (Roboto/Open Sans). Color code information categories with distinct colors (blue for performance, green for battery, orange for features). Include numbered callouts with connecting lines to product features. Add percentage circles, rating stars, and metric indicators. Use grid system with clear sections. Icons paired with statistics. Background: Light with subtle grid pattern. Mood: Informative, educational, data-focused."
    },
    {
        name: "E-Sports & Gaming",
        description: "High-energy gaming aesthetic with RGB effects, competitive styling, and esports branding.",
        prompt: "E-Sports & Gaming: Dramatic dark background with RGB spectrum lighting effects (rainbow gradients, color transitions). Product with glowing RGB highlights and particle effects. Typography: Aggressive, angular gaming fonts (think Valorant/Apex style). Add geometric shapes: triangles, hexagons, sharp angles. Feature gaming-specific icons (FPS counter, ping, resolution). Include performance metrics in gaming HUD style. Use chromatic aberration effects subtly. Add energy streaks, light trails, or digital particles. Color scheme: Deep blacks with vibrant RGB accents. Mood: Competitive, powerful, high-performance."
    },
];


// --- HELPER FUNCTIONS ---

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
);

const FormattedDescription: React.FC<{ text: string; placeholder: string }> = ({ text, placeholder }) => {
    if (!text) {
        return <p className="text-slate-400">{placeholder}</p>;
    }

    const renderWithFormatting = (line: string) => {
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean); 
        return parts.map((part, index) => 
            part.startsWith('**') && part.endsWith('**') ? 
            <strong key={index}>{part.slice(2, -2)}</strong> : 
            part
        );
    };
    
    return (
        <div className="text-slate-200 text-sm space-y-1">
        {text.split('\n').map((line, index) => {
            if (line.trim().startsWith('- ')) {
                const content = line.trim().substring(2);
                return (
                    <div key={index} className="flex items-start pl-2">
                        <span className="mr-2 mt-1 text-indigo-400">•</span>
                        <p className="flex-1">{renderWithFormatting(content)}</p>
                    </div>
                );
            }
            if (line.trim() === '') {
                return <div key={index} className="h-2"></div>;
            }
            return (
                <p key={index}>{renderWithFormatting(line)}</p>
            );
        })}
        </div>
    );
};

// --- MAIN APP COMPONENT ---

function App() {
    // State
    const [productImageFile, setProductImageFile] = useState<File | null>(null);
    const [productImageBase64, setProductImageBase64] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    
    const [styles, setStyles] = useState<Style[]>(DEFAULT_STYLES);
    const [imageUrls, setImageUrls] = useState<Map<string, string | null>>(new Map());
    const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

    const [isIdentifying, setIsIdentifying] = useState(false);
    const [isSuggestingStyles, setIsSuggestingStyles] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);

    const [selectedAd, setSelectedAd] = useState<{ url: string; name: string } | null>(null);
    
    const [historyItems, setHistoryItems] = useLocalStorage<HistoryItem[]>('ad-gen-history', []);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [tutorialCompleted, setTutorialCompleted] = useLocalStorage<boolean>('ad-gen-tutorial-completed', false);
    const [showTutorial, setShowTutorial] = useState(!tutorialCompleted);

    // Callbacks & Handlers
    const resetState = useCallback((clearImage: boolean = true) => {
        if (clearImage) {
            setProductImageFile(null);
            setProductImageBase64(null);
        }
        setProductName('');
        setProductDescription('');
        setImageUrls(new Map());
        setError(null);
        setStyles(DEFAULT_STYLES);
        setIsIdentifying(false);
        setIsSuggestingStyles(false);
        setIsEditingDescription(false);
    }, []);

    const handleImageChange = useCallback(async (file: File | null) => {
        if (!file) {
            resetState();
            return;
        }


        resetState();
        setProductImageFile(file);
        setError(null);
        setIsIdentifying(true);

        try {
            const base64 = await fileToBase64(file);
            setProductImageBase64(base64);

            const info = await generateProductInfoFromImage(base64, file.type);
            setProductName(info.productName);
            setProductDescription(info.productDescription);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to get product information from image. Please try another image.');
        } finally {
            setIsIdentifying(false);
        }
    }, [resetState]);

    const handleRegenerateDescription = useCallback(async () => {
        if (!productImageBase64 || !productImageFile) return;

        setIsIdentifying(true);
        setError(null);
        setIsEditingDescription(false);

        try {
            const info = await generateProductInfoFromImage(productImageBase64, productImageFile.type);
            setProductName(info.productName);
            setProductDescription(info.productDescription);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to regenerate product description. Please try again.');
        } finally {
            setIsIdentifying(false);
        }
    }, [productImageBase64, productImageFile]);



    const handleGenerateStyle = useCallback(async (styleName: string) => {
        if (!productImageBase64 || !productImageFile || !productDescription) return;

        const currentStyle = styles.find(s => s.name === styleName);
        if (!currentStyle) return;

        const startTime = Date.now();

        // Set generation start time if this is the first generation
        setGenerationStartTime(prev => prev || startTime);
        setImageUrls(prev => new Map(prev).set(styleName, null));
        setError(null);

        try {
            const generatedImageBase64 = await generateAdImage(
                productDescription,
                productImageBase64,
                productImageFile.type,
                currentStyle.prompt,
            );
            const imageUrl = `data:image/png;base64,${generatedImageBase64}`;
            setImageUrls(prev => new Map(prev).set(styleName, imageUrl));

            // Calculate average time and update estimate
            const endTime = Date.now();
            const generationTime = endTime - startTime;
            // Average generation time is around 15-30 seconds per ad
            setEstimatedTimeRemaining(generationTime);
        } catch(e: any) {
            console.error(e);
            setError(e.message || `Failed to generate ad for style: ${styleName}`);
            // Remove the loading state on error
            setImageUrls(prev => {
                const newMap = new Map(prev);
                newMap.delete(styleName);
                return newMap;
            });
        }
    }, [productImageBase64, productImageFile, productDescription, styles]);

    const handleSuggestStyles = useCallback(async () => {
        if (!productImageBase64 || !productImageFile || !productDescription) return;

        setIsSuggestingStyles(true);
        setError(null);

        try {
            const suggestions = await generateAdStyleSuggestions(
                productDescription,
                productImageBase64,
                productImageFile.type
            );
            const newStyles = suggestions.map(s => ({ ...s, isSuggested: true }));
            setStyles(prev => [...prev, ...newStyles]);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to suggest new styles.');
        } finally {
            setIsSuggestingStyles(false);
        }
    }, [productDescription, productImageBase64, productImageFile]);

    const handleGenerateAll = useCallback(async () => {
        if (!productImageBase64 || !productImageFile || !productDescription) return;

        const stylesToGenerate = styles.filter(style => !imageUrls.has(style.name));

        for (const style of stylesToGenerate) {
            handleGenerateStyle(style.name);
            // Add a small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }, [styles, imageUrls, handleGenerateStyle, productImageBase64, productImageFile, productDescription]);

    const handleBulkDownload = useCallback(async () => {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        const generatedAds = Array.from(imageUrls.entries())
            .filter(([, url]) => url !== null);

        for (const [name, url] of generatedAds) {
            if (url) {
                const base64Data = url.split(',')[1];
                const safeStyleName = name.replace(/[^a-zA-Z0-9]/g, '-');
                zip.file(`${safeStyleName}.png`, base64Data, { base64: true });
            }
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${productName.replace(/[^a-zA-Z0-9]/g, '-')}-ads.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [imageUrls, productName]);
    
    const handleSaveToHistory = useCallback(() => {
        if (!productImageFile || !productImageBase64 || !productName) {
            alert("Cannot save an empty session.");
            return;
        }

        const generatedAds = Array.from(imageUrls.entries())
            .filter(([, url]) => url !== null)
            .map(([name, url]) => ({ name, url: url! }));

        const newHistoryItem: HistoryItem = {
            id: Date.now(),
            createdAt: Date.now(),
            productName,
            productDescription,
            productImage: {
                base64: productImageBase64,
                type: productImageFile.type,
            },
            ads: generatedAds,
            styles: styles,
        };

        setHistoryItems(prev => [newHistoryItem, ...prev]);
        setIsHistoryOpen(true);
    }, [productImageFile, productImageBase64, productName, productDescription, imageUrls, styles, setHistoryItems]);

    const handleLoadItem = useCallback((id: number) => {
        const itemToLoad = historyItems.find(item => item.id === id);
        if (!itemToLoad) return;

        // Create a File object approximation for the uploader preview
        const mimeType = itemToLoad.productImage.type;
        const byteCharacters = atob(itemToLoad.productImage.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const file = new File([blob], "loaded-image.jpg", { type: mimeType });
        
        setProductImageFile(file);
        setProductImageBase64(itemToLoad.productImage.base64);
        setProductName(itemToLoad.productName);
        setProductDescription(itemToLoad.productDescription);
        setStyles(itemToLoad.styles);
        setImageUrls(new Map(itemToLoad.ads.map(ad => [ad.name, ad.url])));
        setError(null);
        setIsHistoryOpen(false);
        setIsEditingDescription(false);
    }, [historyItems]);

    const handleClearHistory = useCallback(() => {
        if (window.confirm("Are you sure you want to clear all saved sessions? This cannot be undone.")) {
            setHistoryItems([]);
        }
    }, [setHistoryItems]);

    const handleTutorialComplete = useCallback(() => {
        setTutorialCompleted(true);
        setShowTutorial(false);
    }, [setTutorialCompleted]);

    const handleTutorialSkip = useCallback(() => {
        setTutorialCompleted(true);
        setShowTutorial(false);
    }, [setTutorialCompleted]);

    // Derived state - must be before useEffect that uses them
    const isActionable = !!productImageBase64 && !!productDescription && !isIdentifying;
    const generatedCount = Array.from(imageUrls.values()).filter(v => v !== null).length;
    const isGenerating = Array.from(imageUrls.values()).some(v => v === null) && imageUrls.size > 0;

    // Auto-resize textarea
    React.useEffect(() => {
        if (isEditingDescription && descriptionTextAreaRef.current) {
            const textarea = descriptionTextAreaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [productDescription, isEditingDescription]);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // G - Generate All
            if (e.key === 'g' || e.key === 'G') {
                if (isActionable && !isGenerating) {
                    e.preventDefault();
                    handleGenerateAll();
                }
            }

            // S - Save to History
            if (e.key === 's' || e.key === 'S') {
                if (generatedCount > 0) {
                    e.preventDefault();
                    handleSaveToHistory();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActionable, generatedCount, isGenerating, handleGenerateAll, handleSaveToHistory]);

    return (
        <>
            <div className="min-h-screen bg-slate-950 text-white font-sans">
                <header className="py-4 px-6 md:px-8 border-b border-slate-800 grid grid-cols-3 items-center">
                    <div className="col-start-1 justify-self-start">
                        <button
                            onClick={() => setShowTutorial(true)}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                            title="Show tutorial"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                        </button>
                    </div>
                    <div className="col-start-2 flex justify-center items-center gap-3">
                        <LogoIcon className="w-7 h-7 text-indigo-400" />
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            AdSpark <span className="text-indigo-400">AI</span>
                        </h1>
                    </div>
                    <div className="col-start-3 justify-self-end" data-tutorial="history-button">
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
                        >
                             History ({historyItems.length})
                        </button>
                    </div>
                </header>

                <main className="p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto relative">
                        {/* Gradient glow effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-3xl -z-10"></div>
                        {/* Left Column: Input */}
                        <div className="flex flex-col gap-6">
                            <div data-tutorial="image-uploader">
                                <h2 className="text-lg font-semibold text-white mb-2">1. Upload Product <span className="text-indigo-400">Image</span></h2>
                                <ImageUploader
                                    onImageChange={handleImageChange}
                                    imagePreviewUrl={productImageFile ? URL.createObjectURL(productImageFile) : null}
                                    disabled={isIdentifying}
                                />
                            </div>

                            {isIdentifying && (
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <p className="text-white animate-pulse"><span className="text-indigo-400">AI</span> is identifying your product...</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                                    <p className="font-bold">An Error Occurred</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            <div className={`transition-opacity duration-500 ${isActionable ? 'opacity-100' : 'opacity-50 pointer-events-none'}`} data-tutorial="product-info">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-semibold text-white">2. Review Product <span className="text-indigo-400">Info</span></h2>
                                    {productImageBase64 && (
                                        <button
                                            onClick={handleRegenerateDescription}
                                            disabled={isIdentifying}
                                            className="inline-flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-indigo-300 font-semibold py-1.5 px-3 rounded-md transition-all"
                                        >
                                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                            {isIdentifying ? 'Regenerating...' : 'Regenerate'}
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-4">
                                    <input
                                        type="text"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="Product Name"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                        disabled={!isActionable}
                                    />
                                    <div className="relative">
                                        {isEditingDescription ? (
                                            <textarea
                                                ref={descriptionTextAreaRef}
                                                value={productDescription}
                                                onChange={(e) => setProductDescription(e.target.value)}
                                                onBlur={() => setIsEditingDescription(false)}
                                                placeholder="Product Description"
                                                className="w-full bg-slate-800 border border-indigo-500 rounded-lg px-4 py-2 pb-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none overflow-hidden"
                                                rows={8}
                                                disabled={!isActionable}
                                                autoFocus
                                                onFocus={(e) => e.currentTarget.select()}
                                            />
                                        ) : (
                                            <div
                                                onClick={() => isActionable && setIsEditingDescription(true)}
                                                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 min-h-[192px] 
                                                ${isActionable ? 'cursor-text hover:border-slate-600' : ''}`}
                                                aria-label="Product description"
                                            >
                                                <FormattedDescription text={productDescription} placeholder="Product Description" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                            <span className={`text-xs ${productDescription.length > 1000 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                {productDescription.length} characters
                                            </span>
                                            {!isEditingDescription && isActionable && (
                                                <button
                                                    onClick={() => setIsEditingDescription(true)}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {isActionable && (
                                <div className="flex flex-col sm:flex-row gap-4 mt-2" data-tutorial="keyboard-shortcuts">
                                    <button
                                        onClick={handleSaveToHistory}
                                        disabled={!generatedCount}
                                        className="flex-1 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:bg-indigo-600/50 disabled:cursor-not-allowed"
                                        title={!generatedCount ? "Generate at least one ad to save." : "Save session (Shortcut: S)"}
                                    >
                                        Save to History
                                    </button>
                                    <button 
                                        onClick={() => resetState(true)}
                                        className="flex-1 w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-colors"
                                    >
                                        Start Over
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Generated Ads */}
                        <div className="flex flex-col gap-6">
                            <div data-tutorial="ad-styles">
                                <h2 className="text-lg font-semibold text-white mb-2">3. Generate Ad <span className="text-indigo-400">Style</span></h2>
                                <GeneratedAd
                                    styles={styles}
                                    onGenerateStyle={handleGenerateStyle}
                                    imageUrls={imageUrls}
                                    onPreview={(url, name) => setSelectedAd({ url, name })}
                                    isActionable={isActionable}
                                    onSuggestStyles={handleSuggestStyles}
                                    isSuggestingStyles={isSuggestingStyles}
                                    onGenerateAll={handleGenerateAll}
                                    onBulkDownload={handleBulkDownload}
                                    estimatedTimePerAd={estimatedTimeRemaining}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <AdPreviewModal 
                selectedAd={selectedAd}
                onClose={() => setSelectedAd(null)}
            />
            <HistoryPanel
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                historyItems={historyItems}
                onLoadItem={handleLoadItem}
                onClearHistory={handleClearHistory}
            />
            {showTutorial && (
                <TutorialOverlay
                    onComplete={handleTutorialComplete}
                    onSkip={handleTutorialSkip}
                />
            )}
        </>
    );
}

export default App;