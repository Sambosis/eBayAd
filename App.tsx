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
    { name: "Modern & Spec Driven", description: "A sleek, contemporary aesthetic featuring clean lines, ample white space, and a minimalist design.", prompt: "Modern & Spec Driven: A sleek, contemporary aesthetic featuring clean lines, ample white space, and a minimalist design. Use a professional, sans-serif font. The color palette should be muted, with a single accent color. Clearly list the top 3-4 specifications with icons. The overall mood is high-tech and premium." },
    { name: "Bold & Dynamic", description: "An energetic and eye-catching design with strong typography, vibrant colors, and dynamic angles.", prompt: "Bold & Dynamic: An energetic and eye-catching design. Use strong, bold typography, vibrant, saturated colors, and dynamic angles or compositions. The background should be abstract or graphic. The goal is to grab attention immediately. The mood is exciting and powerful." },
    { name: "Elegant & Professional", description: "A sophisticated and luxurious style using serif fonts, a refined color palette, and a balanced, classic layout.", prompt: "Elegant & Professional: A sophisticated and luxurious style. Use classic serif fonts, a refined color palette (e.g., deep blues, gold, charcoal), and a balanced, symmetrical layout. The mood is trustworthy, premium, and high-end." },
    { name: "Lifestyle & Aspirational", description: "Showcases the product in a real-world, aspirational context, focusing on the user experience and benefits.", prompt: "Lifestyle & Aspirational: Showcases the product in a real-world, aspirational context. The product should be integrated into a scene that evokes a desirable feeling or outcome. Use warm, natural lighting and focus on the user's experience. The mood is relatable and inspiring." },
    { name: "Tech-Forward & Futuristic", description: "A cutting-edge design with neon accents, dark backgrounds, and digital or circuit-like motifs.", prompt: "Tech-Forward & Futuristic: A cutting-edge design. Use dark backgrounds, neon accents (blues, purples, pinks), and digital or circuit-like graphical elements. Typography should be modern and geometric. The mood is innovative, advanced, and exciting." },
    { name: "Playful & Colorful", description: "A fun and friendly design using bright colors, rounded shapes, and whimsical illustrations or icons.", prompt: "Playful & Colorful: A fun and friendly design. Use a bright, diverse color palette, rounded shapes, and whimsical, illustrated icons or elements. Typography should be approachable and perhaps slightly quirky. The mood is cheerful, accessible, and energetic." },
    { name: "Vintage & Nostalgic", description: "A retro-inspired look using textures, muted color palettes, and typography reminiscent of a specific past era.", prompt: "Vintage & Nostalgic: A retro-inspired look. Use textures (like paper or grain), muted color palettes (e.g., sepia, faded tones), and typography reminiscent of a specific past era (e.g., '70s script, '50s sans-serif). The mood is authentic, charming, and nostalgic." },
    { name: "Minimalist Line Art", description: "A clean and artistic style using simple line drawings and a monochrome color scheme to highlight the product.", prompt: "Minimalist Line Art: A clean, artistic, and modern style. Use simple, single-weight line drawings of the product and related icons. The color scheme should be strictly monochrome or have a single, subtle accent color. The mood is sophisticated, clean, and elegant." },
    { name: "Retro Futurism", description: "A creative blend of vintage aesthetics with futuristic concepts, often featuring chrome, curves, and a sense of optimism.", prompt: "Retro Futurism: A creative blend of vintage aesthetics (like '50s or '60s design) with futuristic concepts. Think chrome, smooth curves, and atomic-age motifs. The color palette is often optimistic, with teals, oranges, and creams. The mood is imaginative, stylish, and cool." },
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

    // Auto-resize textarea
    React.useEffect(() => {
        const textarea = descriptionTextAreaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [productDescription]);

    const isActionable = !!productImageBase64 && !!productDescription && !isIdentifying;
    const generatedCount = Array.from(imageUrls.values()).filter(v => v !== null).length;

    return (
        <>
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
                <header className="py-4 px-6 md:px-8 border-b border-slate-800 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-white tracking-wide">
                        eBay Ad <span className="text-indigo-400">Generator</span>
                    </h1>
                    <button 
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                         History ({historyItems.length})
                    </button>
                </header>

                <main className="p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                        {/* Left Column: Input */}
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-300 mb-2">1. Upload Product Image</h2>
                                <ImageUploader
                                    onImageChange={handleImageChange}
                                    imagePreviewUrl={productImageFile ? URL.createObjectURL(productImageFile) : null}
                                    disabled={isIdentifying}
                                />
                            </div>

                            {isIdentifying && (
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <p className="text-indigo-300 animate-pulse">AI is identifying your product...</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                                    <p className="font-bold">An Error Occurred</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            <div className={`transition-opacity duration-500 ${isActionable ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <h2 className="text-lg font-semibold text-slate-300 mb-2">2. Review Product Info</h2>
                                <div className="flex flex-col gap-4">
                                    <input
                                        type="text"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="Product Name"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                        disabled={!isActionable}
                                    />
                                    <textarea
                                        ref={descriptionTextAreaRef}
                                        value={productDescription}
                                        onChange={(e) => setProductDescription(e.target.value)}
                                        placeholder="Product Description"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none overflow-hidden"
                                        rows={8}
                                        disabled={!isActionable}
                                    />
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
                                <h2 className="text-lg font-semibold text-slate-300 mb-2">3. Generate Ad Style</h2>
                                <GeneratedAd
                                    styles={styles}
                                    onGenerateStyle={handleGenerateStyle}
                                    imageUrls={imageUrls}
                                    onPreview={(url, name) => setSelectedAd({ url, name })}
                                    isActionable={isActionable}
                                    onSuggestStyles={handleSuggestStyles}
                                    isSuggestingStyles={isSuggestingStyles}
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
