import React, { useState, useCallback, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedAd from './components/GeneratedAd';
import AdPreviewModal from './components/AdPreviewModal';
import HistoryPanel from './components/HistoryPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { 
    generateProductInfoFromImage, 
    generateEbayAdImage,
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
        description: "A sleek, contemporary aesthetic using clean lines, line art icons, and a focus on key specifications.", 
        prompt: "Modern & Minimalist: A sleek, contemporary aesthetic featuring clean lines, ample white space, and a minimalist design. Use simple, single-weight line drawings for icons. The color scheme should be strictly monochrome or have a single, subtle accent color. Use a professional, sans-serif font. Clearly list the top 3-4 specifications. The overall mood is sophisticated, high-tech, and premium." 
    },
    { 
        name: "Tech & Dynamic", 
        description: "An energetic, cutting-edge design with dark backgrounds, neon accents, and bold, geometric typography.", 
        prompt: "Tech & Dynamic: A cutting-edge and energetic design. Use dark backgrounds, vibrant neon accents (e.g., blues, purples, pinks), and dynamic angles. Typography should be modern, strong, and geometric. Incorporate abstract or circuit-like graphical elements. The mood is innovative, powerful, and exciting." 
    },
    { 
        name: "Elegant & Professional", 
        description: "A sophisticated and luxurious style using serif fonts, a refined color palette, and a balanced, classic layout.", 
        prompt: "Elegant & Professional: A sophisticated and luxurious style. Use classic serif fonts, a refined color palette (e.g., deep blues, gold, charcoal), and a balanced, symmetrical layout. The mood is trustworthy, premium, and high-end." 
    },
    { 
        name: "Lifestyle & Aspirational", 
        description: "Showcases the product in a real-world, aspirational context, focusing on the user experience and benefits.", 
        prompt: "Lifestyle & Aspirational: Showcases the product in a real-world, aspirational context. The product should be integrated into a scene that evokes a desirable feeling or outcome. Use warm, natural lighting and focus on the user's experience. The mood is relatable and inspiring." 
    },
    { 
        name: "Vintage & Nostalgic", 
        description: "A retro-inspired look using textures, muted color palettes, and typography reminiscent of a specific past era.", 
        prompt: "Vintage & Nostalgic: A retro-inspired look. Use textures (like paper or grain), muted color palettes (e.g., sepia, faded tones), and typography reminiscent of a specific past era (e.g., '70s script, '50s sans-serif). The mood is authentic, charming, and nostalgic." 
    },
    { 
        name: "Retro Futurism", 
        description: "A creative blend of vintage aesthetics with futuristic concepts, often featuring chrome, curves, and a sense of optimism.", 
        prompt: "Retro Futurism: A creative blend of vintage aesthetics (like '50s or '60s design) with futuristic concepts. Think chrome, smooth curves, and atomic-age motifs. The color palette is often optimistic, with teals, oranges, and creams. The mood is imaginative, stylish, and cool." 
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


// --- MAIN APP COMPONENT ---

function App() {
    // State
    const [productImageFile, setProductImageFile] = useState<File | null>(null);
    const [productImageBase64, setProductImageBase64] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    
    const [styles, setStyles] = useState<Style[]>(DEFAULT_STYLES);
    const [imageUrls, setImageUrls] = useState<Map<string, string | null>>(new Map());

    const [isIdentifying, setIsIdentifying] = useState(false);
    const [isSuggestingStyles, setIsSuggestingStyles] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);

    const [selectedAd, setSelectedAd] = useState<{ url: string; name: string } | null>(null);
    
    const [historyItems, setHistoryItems] = useLocalStorage<HistoryItem[]>('ad-gen-history', []);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

        setImageUrls(prev => new Map(prev).set(styleName, null));
        setError(null);

        try {
            const generatedImageBase64 = await generateEbayAdImage(
                productDescription,
                productImageBase64,
                productImageFile.type,
                currentStyle.prompt,
            );
            const imageUrl = `data:image/png;base64,${generatedImageBase64}`;
            setImageUrls(prev => new Map(prev).set(styleName, imageUrl));
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
    }, [historyItems]);

    const handleClearHistory = useCallback(() => {
        if (window.confirm("Are you sure you want to clear all saved sessions? This cannot be undone.")) {
            setHistoryItems([]);
        }
    }, [setHistoryItems]);

    // Derived state - must be before useEffect that uses them
    const isActionable = !!productImageBase64 && !!productDescription && !isIdentifying;
    const generatedCount = Array.from(imageUrls.values()).filter(v => v !== null).length;
    const isGenerating = Array.from(imageUrls.values()).some(v => v === null) && imageUrls.size > 0;

    // Auto-resize textarea
    React.useEffect(() => {
        const textarea = descriptionTextAreaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [productDescription]);

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
                    <div className="col-start-2 flex justify-center items-center gap-3">
                        <LogoIcon className="w-7 h-7 text-indigo-400" />
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            AdSpark <span className="text-indigo-400">AI</span>
                        </h1>
                    </div>
                    <div className="col-start-3 justify-self-end">
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
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-2">1. Upload Product <span className="text-indigo-400">IMAGE</span></h2>
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

                            <div className={`transition-opacity duration-500 ${isActionable ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-semibold text-white">2. Review Product <span className="text-indigo-400">INFO</span></h2>
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
                                        <textarea
                                            ref={descriptionTextAreaRef}
                                            value={productDescription}
                                            onChange={(e) => setProductDescription(e.target.value)}
                                            placeholder="Product Description"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 pb-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none overflow-hidden"
                                            rows={8}
                                            disabled={!isActionable}
                                        />
                                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                            <span className={`text-xs ${productDescription.length > 1000 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                {productDescription.length} characters
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {isActionable && (
                                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                    <button 
                                        onClick={handleSaveToHistory}
                                        disabled={!generatedCount}
                                        className="flex-1 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:bg-indigo-600/50 disabled:cursor-not-allowed"
                                        title={!generatedCount ? "Generate at least one ad to save." : "Save session"}
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
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-2">3. Generate Ad <span className="text-indigo-400">STYLE</span></h2>
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
        </>
    );
}

export default App;
