import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedAd from './components/GeneratedAd';
import { generateEbayAdImage, generateEbayDescription } from './services/geminiService';
import AdPreviewModal from './components/AdPreviewModal';

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
    const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);
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
        setGeneratedAds([null, null, null]);

        try {
            const imageBase64 = await toBase64(productImageFile);
            const mimeType = productImageFile.type;

            const style1 = "Modern & Spec Driven: A sleek, contemporary aesthetic featuring clean lines, ample white space, and a minimalist design. This style focuses heavily on technical specifications and product features, presenting them in a clear, organized manner akin to a high-end spec sheet. The color palette is sophisticated and neutral, often using monochrome with a single accent color to draw attention to key details.";
            const style2 = "Bold & Dynamic: An energetic and eye-catching style designed to create excitement. It uses vibrant, contrasting color schemes, dynamic angles, and geometric shapes to guide the viewer's attention. Typography is strong, impactful, and often used creatively to highlight the product's most exciting features and create a sense of action.";
            const style3 = "Elegant & Professional: A sophisticated blend of modern aesthetics and engaging elements. Uses a refined color palette with eye catching accesnts and a balanced layout to build trust and convey premium quality.";
            
            const styles = [style1, style2, style3];
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
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during ad generation.');
            setGeneratedAds(null);
        } finally {
            setIsLoading(false);
        }
    }, [productDescription, productImageFile]);

    const handleGenerateMore = useCallback(async () => {
        if (!productDescription || !productImageFile || !generatedAds) {
            setError('Product description, image, and initial ads are required to generate more styles.');
            return;
        }

        setError(null);
        setIsGeneratingMore(true);

        const baseIndex = generatedAds.length;
        setGeneratedAds(prevAds => [...(prevAds || []), null, null, null]);

        try {
            const imageBase64 = await toBase64(productImageFile);
            const mimeType = productImageFile.type;
            
            let stylesToGenerate: string[] = [];

            if (baseIndex === 3) {
                const style4 = "Lifestyle & Aspirational: Showcases the product in a realistic, relatable usage scenario. Focuses on the experience and emotion of using the product. Uses warm, natural lighting and authentic-looking environments to create a connection with the buyer's aspirations.";
                const style5 = "Tech-Forward & Futuristic: Employs a dark-mode aesthetic with neon accents, glowing lines, and abstract, tech-inspired backgrounds. Typography is sharp and digital. This style is perfect for cutting-edge gadgets and conveys innovation and high performance.";
                const style6 = "Playful & Colorful: Uses a bright, cheerful color palette, fun illustrations, and quirky typography. This style is informal and friendly, designed to be memorable and engaging. It's ideal for products aimed at a younger audience or items with a creative, fun purpose.";
                stylesToGenerate = [style4, style5, style6];
            } else if (baseIndex === 6) {
                const style7 = "Vintage & Nostalgic: Evokes a sense of nostalgia with sepia tones, classic serif fonts, and distressed textures. The layout should feel like a page from an old magazine or a classic poster. Use imagery and design elements that hearken back to the 1950s-1970s to create a warm, timeless feel.";
                const style8 = "Minimalist Line Art: Uses clean, simple, continuous line drawings to illustrate the product and its features. The color palette is extremely limited, often just black and white or a single accent color. Typography is san-serif and understated. The focus is on elegance and communicating ideas with minimal visual clutter.";
                const style9 = "Retro Futurism: Combines vintage aesthetics with futuristic technology concepts. Think chrome textures, neon glows, and geometric shapes reminiscent of 80s sci-fi. The color palette is often dark with vibrant, contrasting highlights. Typography is bold and has a digital, space-age feel. It's optimistic and imaginative.";
                 stylesToGenerate = [style7, style8, style9];
            }

            if (stylesToGenerate.length > 0) {
                 const generationPromises = stylesToGenerate.map((style, index) => 
                    generateEbayAdImage(productDescription, imageBase64, mimeType, style)
                        .then(adImage => {
                            const imageUrl = `data:image/png;base64,${adImage}`;
                            setGeneratedAds(prevAds => {
                                const newAds = [...(prevAds || [])];
                                newAds[baseIndex + index] = imageUrl;
                                return newAds;
                            });
                        })
                );
                await Promise.all(generationPromises);
            }

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred while generating more ads.');
            setGeneratedAds(prevAds => prevAds ? prevAds.slice(0, baseIndex) : null);
        } finally {
            setIsGeneratingMore(false);
        }
    }, [productDescription, productImageFile, generatedAds]);


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
                                disabled={isLoading || isGeneratingDescription || isGeneratingMore}
                            />
                        </div>

                        <div>
                             <button
                                onClick={handleGenerateDescription}
                                disabled={!productName || isGeneratingDescription || isLoading || isGeneratingMore}
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
                                disabled={isLoading || isGeneratingDescription || isGeneratingMore}
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
                            
                            {(!generatedAds || generatedAds.length === 0) && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || isGeneratingDescription || !productDescription || !productImageFile}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 hover:shadow-lg hover:shadow-indigo-500/50"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isLoading ? 'Generating Your Ads...' : 'Generate Advertisements'}
                                </button>
                            )}

                             {generatedAds && generatedAds.length > 0 && generatedAds.length < 9 && (
                                <button
                                    onClick={handleGenerateMore}
                                    disabled={isLoading || isGeneratingDescription || isGeneratingMore}
                                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 hover:shadow-lg hover:shadow-purple-500/50"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isGeneratingMore ? 'Generating More...' : 'Generate 3 More Styles'}
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