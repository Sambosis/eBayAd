import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedAd from './components/GeneratedAd';
import { generateEbayAdImage } from './services/geminiService';
import AdPreviewModal from './components/AdPreviewModal';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.84 2.84l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.84 2.84l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.84-2.84l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036a.75.75 0 00.54 1.086l1.036.258a.75.75 0 010 1.456l-1.036.258a.75.75 0 00-.54 1.086l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a.75.75 0 00-.54-1.086l-1.036-.258a.75.75 0 010-1.456l1.036.258a.75.75 0 00.54-1.086l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.558l.512 2.046a.75.75 0 00.578 1.172l2.046.512a.75.75 0 010 1.424l-2.046.512a.75.75 0 00-.578 1.172l-.512 2.046a.75.75 0 01-1.424 0l-.512-2.046a.75.75 0 00-.578-1.172l-2.046-.512a.75.75 0 010-1.424l2.046.512a.75.75 0 00.578-1.172l.512-2.046a.75.75 0 01.712-.558z" clipRule="evenodd" />
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
    const [productDescription, setProductDescription] = useState<string>('');
    const [productImageFile, setProductImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generatedAds, setGeneratedAds] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
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

    const handleSubmit = useCallback(async () => {
        if (!productDescription || !productImageFile) {
            setError('Please provide both a product description and an image.');
            return;
        }

        setError(null);
        setIsLoading(true);
        setGeneratedAds(null);

        try {
            const imageBase64 = await toBase64(productImageFile);
            const mimeType = productImageFile.type;

            const style1 = "Modern & Spec Driven: Focus on clean lines,  white background, and elegant, simple typography. Should have a resemblance to a technical spec sheet, but with details for advertising.";
            const style2 = "Bold & Sleek: Use vibrant colors, energetic shapes, and strong, impactful typography. Provide ample product details. Create a sense of excitement.";
            const style3 = "Balanced & Professional: A blend of modern sleek lines and dynamic, engaging elements. Use a sophisticated color palette. Provide ample product details. ";

            const [ad1, ad2, ad3] = await Promise.all([
                generateEbayAdImage(productDescription, imageBase64, mimeType, style1),
                generateEbayAdImage(productDescription, imageBase64, mimeType, style2),
                generateEbayAdImage(productDescription, imageBase64, mimeType, style3)
            ]);

            setGeneratedAds([`data:image/png;base64,${ad1}`, `data:image/png;base64,${ad2}`, `data:image/png;base64,${ad3}`]);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during ad generation.');
        } finally {
            setIsLoading(false);
        }
    }, [productDescription, productImageFile]);


    return (
        <div className="bg-slate-900 min-h-screen text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">
                        AI eBay Ad Generator
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        Turn your product photo and description into three professional ad styles.
                    </p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Input Section */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-6">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                                1. Product Description
                            </label>
                            <textarea
                                id="description"
                                rows={6}
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="e.g., Brand new wireless headphones with 20-hour battery life, noise cancellation, and Bluetooth 5.0. Perfect for travel and gym use."
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 placeholder-slate-500"
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                2. Product Image
                            </label>
                            <ImageUploader onImageChange={handleImageChange} imagePreviewUrl={imagePreview} />
                        </div>
                        
                        <div className="mt-auto pt-4">
                            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !productDescription || !productImageFile}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                {isLoading ? 'Generating Your Ads...' : 'Generate Advertisements'}
                            </button>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-300 mb-4 text-center">Your Generated Ads</h2>
                        <GeneratedAd imageUrls={generatedAds} isLoading={isLoading} onPreview={handlePreview} />
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