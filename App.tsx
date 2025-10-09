import React, { useState, useCallback, useRef, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedAd from './components/GeneratedAd';
import AdGalleryModal from './components/AdPreviewModal';
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

const HtmlDescription: React.FC<{ html: string; placeholder: string }> = ({ html, placeholder }) => {
    if (!html) {
        return <p className="text-slate-400">{placeholder}</p>;
    }
    return (
        <div
            className="text-slate-200 text-sm [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1"
            dangerouslySetInnerHTML={{ __html: html }}
        />
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
    
    const [styles, setStyles] = useState<Style[]>([]);
    const [imageUrls, setImageUrls] = useState<Map<string, string | null>>(new Map());
    const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
    const [isInitialGenerationDone, setIsInitialGenerationDone] = useState(false);

    const [isIdentifying, setIsIdentifying] = useState(false);
    const [isSuggestingStyles, setIsSuggestingStyles] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);
    const descriptionContainerRef = useRef<HTMLDivElement>(null);

    interface GalleryState {
      isOpen: boolean;
      initialIndex: number;
    }
    const [galleryState, setGalleryState] = useState<GalleryState>({ isOpen: false, initialIndex: 0 });
    const [copyButtonText, setCopyButtonText] = useState('Copy');
    
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
        setStyles([]);
        setIsIdentifying(false);
        setIsSuggestingStyles(false);
        setIsEditingDescription(false);
        setIsInitialGenerationDone(false);
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
        
        // Reset parts of the state for regeneration
        setImageUrls(new Map());
        setStyles([]);
        setIsInitialGenerationDone(false);
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


    const handleGenerateStyle = useCallback(async (styleToGenerate: Style) => {
        if (!productImageBase64 || !productImageFile || !productDescription) return;

        const { name: styleName, prompt } = styleToGenerate;

        const startTime = Date.now();

        setGenerationStartTime(prev => prev || startTime);
        setImageUrls(prev => new Map(prev).set(styleName, null));
        setError(null);

        try {
            const generatedImageBase64 = await generateAdImage(
                productDescription,
                productImageBase64,
                productImageFile.type,
                prompt,
            );
            const imageUrl = `data:image/png;base64,${generatedImageBase64}`;
            setImageUrls(prev => new Map(prev).set(styleName, imageUrl));

            const endTime = Date.now();
            const generationTime = endTime - startTime;
            setEstimatedTimeRemaining(generationTime);
        } catch(e: any) {
            console.error(e);
            const errorMessage = e.message || `Failed to generate ad for style: ${styleName}`;
            setError(errorMessage);
            setImageUrls(prev => {
                const newMap = new Map(prev);
                newMap.delete(styleName);
                return newMap;
            });
            throw new Error(errorMessage);
        }
    }, [productImageBase64, productImageFile, productDescription]);
    
    const handleGenerateStyles = useCallback((stylesToGenerate: Style[]) => {
        if (!productImageBase64 || !productImageFile || !productDescription || stylesToGenerate.length === 0) return;

        setError(null);

        const CONCURRENT_LIMIT = 3;
        const queue = [...stylesToGenerate];
        const activePromises = new Set<Promise<void>>();
        let hasFailed = false;

        const processQueue = () => {
            if (hasFailed) return;

            while (activePromises.size < CONCURRENT_LIMIT && queue.length > 0) {
                const style = queue.shift();
                if (!style) continue;

                const promise = handleGenerateStyle(style)
                    .catch(err => {
                        console.error(`Stopping "Generate All" due to an error on style "${style.name}".`);
                        hasFailed = true; 
                    })
                    .finally(() => {
                        activePromises.delete(promise);
                        processQueue();
                    });
                
                activePromises.add(promise);
            }
        };

        processQueue();
    }, [productImageBase64, productImageFile, productDescription, handleGenerateStyle]);


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
            handleGenerateStyles(newStyles);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to suggest new styles.');
        } finally {
            setIsSuggestingStyles(false);
        }
    }, [productDescription, productImageBase64, productImageFile, handleGenerateStyles]);

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
        setIsInitialGenerationDone(true); // Mark as done since we are loading completed ads
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

    const handleCopyDescription = useCallback(async () => {
        if (!productDescription) return;

        try {
            const htmlContent = productDescription; // This is the raw HTML
            // Create a plain text version for fallback
            const textContent = productDescription.replace(/<[^>]*>?/gm, '');

            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const textBlob = new Blob([textContent], { type: 'text/plain' });

            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob,
                })
            ]);

            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy'), 2000);
        } catch (error) {
            console.error('Failed to copy description as HTML:', error);
            // Fallback to copying the raw HTML string as plain text
            try {
                await navigator.clipboard.writeText(productDescription);
                setCopyButtonText('Copied HTML!');
                setTimeout(() => setCopyButtonText('Copy'), 2000);
            } catch (fallbackError) {
                console.error('Failed to copy description as plain text:', fallbackError);
                setCopyButtonText('Failed!');
                setTimeout(() => setCopyButtonText('Copy'), 2000);
                alert('Could not copy text to clipboard. Please try again or copy manually.');
            }
        }
    }, [productDescription]);

    // Derived state - must be before useEffect that uses them
    const isActionable = !!productImageBase64 && !!productDescription && !isIdentifying;
    const generatedCount = Array.from(imageUrls.values()).filter(v => v !== null).length;
    const isGenerating = Array.from(imageUrls.values()).some(v => v === null) && imageUrls.size > 0;
    const generatedAds = Array.from(imageUrls.entries())
        .filter(([, url]) => url !== null)
        .map(([name, url]) => ({ name, url: url! }));

    // Auto-suggest styles and generate when description is first loaded
    useEffect(() => {
        if (productDescription && !isInitialGenerationDone && !isGenerating) {
            setIsInitialGenerationDone(true);
            handleSuggestStyles();
        }
    }, [productDescription, isInitialGenerationDone, isGenerating, handleSuggestStyles]);


    // Auto-resize textarea
    useEffect(() => {
        if (isEditingDescription && descriptionTextAreaRef.current) {
            const textarea = descriptionTextAreaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [productDescription, isEditingDescription]);

    // Reset copy button text when description changes
    useEffect(() => {
        setCopyButtonText('Copy');
    }, [productDescription]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
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
    }, [isActionable, generatedCount, isGenerating, handleSaveToHistory]);

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
                                    <div>
                                        {isEditingDescription ? (
                                            <textarea
                                                ref={descriptionTextAreaRef}
                                                value={productDescription}
                                                onChange={(e) => setProductDescription(e.target.value)}
                                                onBlur={() => setIsEditingDescription(false)}
                                                placeholder="Product Description (HTML)"
                                                className="w-full bg-slate-800 border border-indigo-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none overflow-hidden font-mono text-sm"
                                                rows={10}
                                                disabled={!isActionable}
                                                autoFocus
                                            />
                                        ) : (
                                            <div
                                                ref={descriptionContainerRef}
                                                onClick={() => isActionable && setIsEditingDescription(true)}
                                                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 min-h-[192px] 
                                                ${isActionable ? 'cursor-text hover:border-slate-600' : ''}`}
                                                aria-label="Product description"
                                            >
                                                <HtmlDescription html={productDescription} placeholder="Product Description" />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-end gap-4 mt-2">
                                            <span className={`text-xs ${productDescription.length > 1500 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                {productDescription.length} characters
                                            </span>
                                            {!isEditingDescription && isActionable && productDescription && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleCopyDescription}
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold disabled:text-slate-500 disabled:cursor-not-allowed"
                                                        disabled={copyButtonText !== 'Copy'}
                                                        title="Copy description as HTML"
                                                    >
                                                        {copyButtonText}
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditingDescription(true)}
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
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
                                {isActionable && isSuggestingStyles && styles.length === 0 && (
                                    <div className="text-center p-4 bg-slate-900 rounded-lg mb-4">
                                        <p className="text-white animate-pulse"><span className="text-indigo-400">AI</span> is suggesting ad styles for your product...</p>
                                    </div>
                                )}
                                <GeneratedAd
                                    styles={styles}
                                    onGenerateStyle={handleGenerateStyle}
                                    imageUrls={imageUrls}
                                    onPreview={(styleName) => {
                                        const initialIndex = generatedAds.findIndex(ad => ad.name === styleName);
                                        if (initialIndex !== -1) {
                                            setGalleryState({ isOpen: true, initialIndex });
                                        }
                                    }}
                                    isActionable={isActionable}
                                    onSuggestStyles={handleSuggestStyles}
                                    isSuggestingStyles={isSuggestingStyles}
                                    onBulkDownload={handleBulkDownload}
                                    estimatedTimePerAd={estimatedTimeRemaining}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <AdGalleryModal
                isOpen={galleryState.isOpen}
                ads={generatedAds}
                initialIndex={galleryState.initialIndex}
                onClose={() => setGalleryState({ isOpen: false, initialIndex: 0 })}
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