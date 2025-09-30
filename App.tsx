import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedAd from './components/GeneratedAd';
import { generateEbayAdImage, generateEbayDescription } from './services/geminiService';
import AdPreviewModal from './components/AdPreviewModal';
import JSZip from 'jszip';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.84 2.84l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.84 2.84l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.84-2.84l-2.846-.813a.75.75 0 010-1.442l2.846.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036a.75.75 0 00.54 1.086l1.036.258a.75.75 0 010 1.456l-1.036.258a.75.75 0 00-.54 1.086l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a.75.75 0 00-.54-1.086l-1.036-.258a.75.75 0 010-1.456l1.036.258a.75.75 0 00.54-1.086l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.558l.512 2.046a.75.75 0 00.578 1.172l2.046.512a.75.75 0 010 1.424l-2.046.512a.75.75 0 00-.578 1.172l-.512 2.046a.75.75 0 01-1.424 0l-.512-2.046a.75.75 0 00-.578-1.172l-2.046-.512a.75.75 0 010-1.424l2.046.512a.75.75 0 00.578 1.172l.512-2.046a.75.75 0 01.712-.558z" clipRule="evenodd" />
    </svg>
);

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
    const [generatedAds, setGeneratedAds] = useState<(string | null)[] | null>(null);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [generationComplete, setGenerationComplete] = useState<boolean>(false);
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
    };
    
    const handlePreview = (url: string) => {
        setSelectedAdUrl(url);
    };

    const handleGenerateDescription = useCallback(async () => {
        if (!productName) {
            setError('Please enter a product name or model.');
            return;
        }
        setError(null);
        setProductDescription('');
        setIsGeneratingDescription(true);
        try {
            const description = await generateEbayDescription(productName);
            setProductDescription(description);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during description generation.');
        } finally {
            setIsGeneratingDescription(false);
        }
    }, [productName]);

    const handleSubmit = useCallback(async () => {
        if (!productDescription || !productImageFile) {
            setError('Please provide both a product description and an image.');
            return;
        }

        setError(null);
        setIsLoading(true);
        setGenerationComplete(false);
        setGeneratedAds(Array(9).fill(null));

        try {
            const imageBase64 = await toBase64(productImageFile);
            const mimeType = productImageFile.type;

            const styles = [
                "Modern & Spec Driven: A sleek, contemporary aesthetic featuring clean lines, ample white space, and a minimalist design. This style focuses heavily on technical specifications and product features, presenting them in a clear, organized manner akin to a high-end spec sheet. The color palette is sophisticated and neutral, often using monochrome with a single accent color to draw attention to key details.",
                "Bold & Dynamic: An energetic and eye-catching style designed to create excitement. It uses vibrant, contrasting color schemes, dynamic angles, and geometric shapes to guide the viewer's attention. Typography is strong, impactful, and often used creatively to highlight the product's most exciting features and create a sense of action.",
                "Elegant & Professional: A sophisticated blend of modern aesthetics and engaging elements. Uses a refined color palette with eye catching accesnts and a balanced layout to build trust and convey premium quality.",
                "Lifestyle & Aspirational: Showcases the product in a realistic, relatable usage scenario. Focuses on the experience and emotion of using the product. Uses warm, natural lighting and authentic-looking environments to create a connection with the buyer's aspirations.",
                "Tech-Forward & Futuristic: Employs a dark-mode aesthetic with neon accents, glowing lines, and abstract, tech-inspired backgrounds. Typography is sharp and digital. This style is perfect for cutting-edge gadgets and conveys innovation and high performance.",
                "Playful & Colorful: Uses a bright, cheerful color palette, fun illustrations, and quirky typography. This style is informal and friendly, designed to be memorable and engaging. It's ideal for products aimed at a younger audience or items with a creative, fun purpose.",
                "Vintage & Nostalgic: Evokes a sense of nostalgia with sepia tones, classic serif fonts, and distressed textures. The layout should feel like a page from an old magazine or a classic poster. Use imagery and design elements that hearken back to the 1950s-1970s to create a warm, timeless feel.",
                "Minimalist Line Art: Uses clean, simple, continuous line drawings to illustrate the product and its features. The color palette is extremely limited, often just black and white or a single accent color. Typography is san-serif and understated. The focus is on elegance and communicating ideas with minimal visual clutter.",
                "Retro Futurism: Combines vintage aesthetics with futuristic technology concepts. Think chrome textures, neon glows, and geometric shapes reminiscent of 80s sci-fi. The color palette is often dark with vibrant, contrasting highlights. Typography is bold and has a digital, space-age feel. It's optimistic and imaginative."
            ];
            
            const generationPromises = styles.map((style, index) => 
                generateEbayAdImage(productDescription, imageBase64, mimeType, style)
                    .then(adImage => {
                        const imageUrl = `data:image/png;base64,${adImage}`;
                        setGeneratedAds(prevAds => {
                            const newAds = [...(prevAds || [])];
                            newAds[index] = imageUrl;
                            return newAds;
                        });
                    })
            );
            
            await Promise.all(generationPromises);
            setGenerationComplete(true);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during ad generation.');
            setGeneratedAds(null);
        } finally {
            setIsLoading(false);
        }
    }, [productDescription, productImageFile]);

    const handleDownloadAll = useCallback(async () => {
        if (!productDescription || !generatedAds || !generatedAds.every(ad => !!ad)) {
            return;
        }

        setIsZipping(true);
        setError(null);
        
        try {
            const zip = new JSZip();

            // Add description text file
            zip.file('product-description.txt', productDescription);

            // Add images
            generatedAds.forEach((url, index) => {
                if (url) {
                    const base64Data = url.split(',')[1];
                    zip.file(`ebay-ad-style-${index + 1}.png`, base64Data, { base64: true });
                }
            });

            // Generate zip file and trigger download
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
                            <label htmlFor="productName" className="block text-md font-medium text-slate-200 mb-3">
                                1. Product Name or Model
                            </label>
                            <input
                                id="productName"
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="e.g., Sony WH-1000XM5 Wireless Headphones"
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ease-in-out placeholder-slate-500"
                                disabled={isLoading || isGeneratingDescription}
                            />
                        </div>

                        <div>
                             <button
                                onClick={handleGenerateDescription}
                                disabled={!productName || isGeneratingDescription || isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:-translate-y-px"
                            >
                                <MagicWandIcon className="w-5 h-5" />
                                {isGeneratingDescription ? 'Generating Description...' : 'Generate Description with AI'}
                            </button>
                        </div>


                        <div>
                            <label htmlFor="description" className="block text-md font-medium text-slate-200 mb-3">
                                2. Product Description
                            </label>
                            <textarea
                                id="description"
                                rows={8}
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="Click 'Generate Description with AI' above to create a description, or write your own."
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ease-in-out placeholder-slate-500"
                                disabled={isLoading || isGeneratingDescription}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-md font-medium text-slate-200 mb-3">
                                3. Product Image
                            </label>
                            <ImageUploader onImageChange={handleImageChange} imagePreviewUrl={imagePreview} />
                        </div>
                        
                        <div className="mt-auto">
                            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                            
                            {generationComplete ? (
                                <button
                                    onClick={handleDownloadAll}
                                    disabled={isZipping}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/50 disabled:transform-none"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    {isZipping ? 'Zipping Assets...' : 'Download All Assets as .zip'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || isGeneratingDescription || !productDescription || !productImageFile}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 hover:shadow-lg hover:shadow-indigo-500/50"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isLoading ? 'Generating Your Ads...' : 'Generate 9 Ad Styles'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-300 mb-4 text-center">Your Generated Ads</h2>
                        <GeneratedAd imageUrls={generatedAds} onPreview={handlePreview} />
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