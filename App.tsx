import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedAd from './components/GeneratedAd';
import { generateEbayAdImage, generateProductInfoFromImage } from './services/geminiService';
import AdPreviewModal from './components/AdPreviewModal';
import JSZip from 'jszip';

const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622-3.385m-5.043-.025a15.998 15.998 0 01-3.388-1.621m-5.043.025a15.998 15.998 0 01-1.622-3.385m3.388 1.621a15.998 15.998 0 01-1.622-3.385" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const STYLES = [
    { name: "Modern & Spec Driven", description: "Sleek, clean & spec-focused.", prompt: "Modern & Spec Driven: A sleek, contemporary aesthetic featuring clean lines, ample white space, and a minimalist design. This style focuses heavily on technical specifications and product features, presenting them in a clear, organized manner akin to a high-end spec sheet. The color palette is sophisticated and neutral, often using monochrome with a single accent color to draw attention to key details." },
    { name: "Bold & Dynamic", description: "Vibrant, energetic & action-oriented.", prompt: "Bold & Dynamic: An energetic and eye-catching style designed to create excitement. It uses vibrant, contrasting color schemes, dynamic angles, and geometric shapes to guide the viewer's attention. Typography is strong, impactful, and often used creatively to highlight the product's most exciting features and create a sense of action." },
    { name: "Elegant & Professional", description: "Sophisticated, refined & premium.", prompt: "Elegant & Professional: A sophisticated blend of modern aesthetics and engaging elements. Uses a refined color palette with eye catching accesnts and a balanced layout to build trust and convey premium quality." },
    { name: "Lifestyle & Aspirational", description: "Relatable, aspirational & in-context.", prompt: "Lifestyle & Aspirational: Showcases the product in a realistic, relatable usage scenario. Focuses on the experience and emotion of using the product. Uses warm, natural lighting and authentic-looking environments to create a connection with the buyer's aspirations." },
    { name: "Tech-Forward & Futuristic", description: "Dark, neon & high-tech.", prompt: "Tech-Forward & Futuristic: Employs a dark-mode aesthetic with neon accents, glowing lines, and abstract, tech-inspired backgrounds. Typography is sharp and digital. This style is perfect for cutting-edge gadgets and conveys innovation and high performance." },
    { name: "Playful & Colorful", description: "Bright, fun & engaging.", prompt: "Playful & Colorful: Uses a bright, cheerful color palette, fun illustrations, and quirky typography. This style is informal and friendly, designed to be memorable and engaging. It's ideal for products aimed at a younger audience or items with a creative, fun purpose." },
    { name: "Vintage & Nostalgic", description: "Nostalgic, timeless & retro.", prompt: "Vintage & Nostalgic: Evokes a sense of nostalgia with sepia tones, classic serif fonts, and distressed textures. The layout should feel like a page from an old magazine or a classic poster. Use imagery and design elements that hearken back to the 1950s-1970s to create a warm, timeless feel." },
    { name: "Minimalist Line Art", description: "Simple, elegant & artistic.", prompt: "Minimalist Line Art: Uses clean, simple, continuous line drawings to illustrate the product and its features. The color palette is extremely limited, often just black and white or a single accent color. Typography is san-serif and understated. The focus is on elegance and communicating ideas with minimal visual clutter." },
    { name: "Retro Futurism", description: "80s sci-fi, chrome & neon.", prompt: "Retro Futurism: Combines vintage aesthetics with futuristic technology concepts. Think chrome textures, neon glows, and geometric shapes reminiscent of 80s sci-fi. The color palette is often dark with vibrant, contrasting highlights. Typography is bold and has a digital, space-age feel. It's optimistic and imaginative." }
];


const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix e.g. "data:image/png;base64,"
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
};


const App: React.FC = () => {
    const [productName, setProductName] = useState<string>('');
    const [productDescription, setProductDescription] = useState<string>('');
    const [productImageFile, setProductImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generatedAds, setGeneratedAds] = useState<Map<string, string | null>>(new Map());
    const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);
    const [isAnyGenerationActive, setIsAnyGenerationActive] = useState<boolean>(false);
    const [isZipping, setIsZipping] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAdUrl, setSelectedAdUrl] = useState<string | null>(null);

    const handleImageChange = (file: File | null) => {
        if (file) {
            setProductImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        } else {
            setProductImageFile(null);
            setImagePreview(null);
        }
        setGeneratedAds(new Map());
        setIsAnyGenerationActive(false);
    };
    
    const handlePreview = (url: string) => {
        setSelectedAdUrl(url);
    };

    const handleAnalyzeImage = useCallback(async () => {
        if (!productImageFile) {
            setError('Please upload an image first.');
            return;
        }
        setError(null);
        setProductName('');
        setProductDescription('');
        setIsAnalyzingImage(true);
        setGeneratedAds(new Map());
        setIsAnyGenerationActive(false);

        try {
            const imageBase64 = await toBase64(productImageFile);
            const { productName, productDescription } = await generateProductInfoFromImage(imageBase64, productImageFile.type);
            setProductName(productName);
            setProductDescription(productDescription);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during image analysis.');
        } finally {
            setIsAnalyzingImage(false);
        }
    }, [productImageFile]);
    
    const handleGenerateStyle = useCallback(async (styleName: string) => {
        if (generatedAds.has(styleName)) {
            // Already generated or generating, do nothing
            return;
        }
        if (!productDescription || !productImageFile) {
            setError('Please provide a description and image before generating styles.');
            return;
        }

        setError(null);
        if (!isAnyGenerationActive) {
          setIsAnyGenerationActive(true);
        }

        setGeneratedAds(prevAds => new Map(prevAds).set(styleName, null));

        try {
            const imageBase64 = await toBase64(productImageFile);
            const mimeType = productImageFile.type;
            const style = STYLES.find(s => s.name === styleName);
            if (!style) throw new Error("Style not found");

            const adImage = await generateEbayAdImage(productDescription, imageBase64, mimeType, style.prompt);
            const imageUrl = `data:image/png;base64,${adImage}`;
            setGeneratedAds(prevAds => new Map(prevAds).set(styleName, imageUrl));
        } catch (e) {
            console.error(`Failed to generate ad for style: ${styleName}`, e);
            setError(`Failed to generate ad for ${styleName}. Please try again.`);
            // Allow retry by removing from map
            setGeneratedAds(prevAds => {
                const newAds = new Map(prevAds);
                newAds.delete(styleName);
                return newAds;
            });
        }
    }, [productDescription, productImageFile, generatedAds, isAnyGenerationActive]);


    const handleDownloadAll = useCallback(async () => {
        if (!productDescription || generatedAds.size === 0) return;
        
        const generatedCount = Array.from(generatedAds.values()).filter(v => v).length;
        if (generatedCount === 0) return;

        setIsZipping(true);
        setError(null);
        
        try {
            const zip = new JSZip();

            zip.file('product-description.txt', productDescription);

            generatedAds.forEach((url, styleName) => {
                if (url) {
                    const styleIndex = STYLES.findIndex(s => s.name === styleName);
                    const base64Data = url.split(',')[1];
                    const safeStyleName = styleName.replace(/[^a-zA-Z0-9]/g, '-');
                    zip.file(`ebay-ad-style-${styleIndex + 1}-${safeStyleName}.png`, base64Data, { base64: true });
                }
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = 'ebay-ad-assets.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(zipUrl);

        } catch (e) {
            console.error("Error creating zip file", e);
            setError("Sorry, there was an error creating the zip file. Please try downloading images individually.");
        } finally {
            setIsZipping(false);
        }
    }, [productDescription, generatedAds]);
    
    const successfullyGeneratedCount = Array.from(generatedAds.values()).filter(v => v).length;

    return (
        <div className="bg-slate-900 min-h-screen text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">
                        AI eBay Ad Generator
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        Turn your product photo and description into professional ad styles.
                    </p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Input Section */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
                        <div>
                            <label className="block text-md font-medium text-slate-200 mb-3">
                                1. Product Image
                            </label>
                            <ImageUploader onImageChange={handleImageChange} imagePreviewUrl={imagePreview} disabled={isAnyGenerationActive}/>
                        </div>
                        
                        {imagePreview && (
                             <div>
                                <button
                                   onClick={handleAnalyzeImage}
                                   disabled={isAnalyzingImage || isAnyGenerationActive}
                                   className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:-translate-y-px"
                               >
                                   <MagicWandIcon className="w-5 h-5" />
                                   {isAnalyzingImage ? 'Analyzing Image...' : 'Analyze Image with AI'}
                               </button>
                           </div>
                        )}
                        
                         <div>
                            <label htmlFor="productName" className="block text-md font-medium text-slate-200 mb-3">
                                2. Product Name or Model <span className="text-slate-400 text-sm">(Optional)</span>
                            </label>
                            <input
                                id="productName"
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="e.g., Sony WH-1000XM5 Wireless Headphones"
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ease-in-out placeholder-slate-500"
                                disabled={isAnalyzingImage || isAnyGenerationActive}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-md font-medium text-slate-200 mb-3">
                                3. Product Description
                            </label>
                            <textarea
                                id="description"
                                rows={8}
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="Upload an image and click 'Analyze Image with AI' above to create a description, or write your own."
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ease-in-out placeholder-slate-500"
                                disabled={isAnalyzingImage || isAnyGenerationActive}
                            />
                        </div>
                        
                        <div className="mt-auto pt-6">
                             {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                            
                            {successfullyGeneratedCount > 0 && (
                                <button
                                    onClick={handleDownloadAll}
                                    disabled={isZipping}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/50 disabled:transform-none"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    {isZipping ? 'Zipping Assets...' : `Download ${successfullyGeneratedCount} Ad${successfullyGeneratedCount > 1 ? 's' : ''} as .zip`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-300 mb-4 text-center">
                            Click a Style to Generate
                        </h2>
                        <GeneratedAd 
                            styles={STYLES}
                            onGenerateStyle={handleGenerateStyle}
                            imageUrls={generatedAds} 
                            onPreview={handlePreview} 
                            isActionable={!!productDescription && !!productImageFile}
                        />
                    </div>
                </main>

                <footer className="text-center mt-12 text-slate-500 text-sm">
                    <p>Powered by Google Gemini. For demonstration purposes only.</p>
                </footer>
            </div>
            <AdPreviewModal imageUrl={selectedAdUrl} onClose={() => setSelectedAdUrl(null)} />
        </div>
    );
};

export default App;
