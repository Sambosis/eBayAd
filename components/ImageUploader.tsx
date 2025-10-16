
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

// FIX: Add global declarations for gapi and google to avoid TypeScript errors.
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

// --- PLACEHOLDERS for Google Cloud credentials ---
// These should be set in your environment variables.
// For example, in a .env file:
// GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
// GOOGLE_API_KEY="YOUR_API_KEY"
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_APP_ID = GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.split('-')[0] : '';
const GOOGLE_PHOTOS_SCOPE = 'https://www.googleapis.com/auth/photoslibrary.readonly';


interface ImageUploaderProps {
    onImageChange: (files: File[]) => void;
    initialFiles: File[];
    disabled?: boolean;
}

// --- ICONS ---
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
);
const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
);
const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
const GooglePhotosIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11.96,6.53c-1.39,0-2.52,1.13-2.52,2.52s1.13,2.52,2.52,2.52c1.39,0,2.52-1.13,2.52-2.52S13.35,6.53,11.96,6.53z M17.43,9.05c0-1.39-1.13-2.52-2.52-2.52s-2.52,1.13-2.52,2.52c0,1.39,1.13,2.52,2.52,2.52S17.43,10.44,17.43,9.05z M11.96,17.43c1.39,0,2.52-1.13,2.52-2.52s-1.13-2.52-2.52-2.52c-1.39,0-2.52,1.13-2.52,2.52S10.57,17.43,11.96,17.43z M6.53,9.05c0,1.39,1.13,2.52,2.52,2.52s2.52-1.13,2.52-2.52c0-1.39-1.13-2.52-2.52-2.52S6.53,7.66,6.53,9.05z M11.96,2C6.46,2,2,6.46,2,11.96s4.46,9.96,9.96,9.96s9.96-4.46,9.96-9.96S17.47,2,11.96,2z M11.96,20.07c-4.48,0-8.11-3.63-8.11-8.11s3.63-8.11,8.11-8.11c4.48,0,8.11,3.63,8.11,8.11S16.44,20.07,11.96,20.07z" /></svg>
);
const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

// --- MAIN COMPONENT ---
const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, initialFiles, disabled = false }) => {
    // Refs for file inputs and camera elements
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraFileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Component State
    const [files, setFiles] = useState<File[]>(initialFiles);
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // Google Photos State
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [isGapiLoaded, setIsGapiLoaded] = useState(false);
    const [isFetchingFromGoogle, setIsFetchingFromGoogle] = useState(false);
    const oauthToken = useRef<any>(null);

    // Memoize preview URLs for performance and cleanup
    const previewUrls = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
    useEffect(() => {
        return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
    }, [previewUrls]);

    // Sync with initialFiles prop
    useEffect(() => {
        setFiles(initialFiles);
    }, [initialFiles]);
    
    // Load Google GSI and GAPI scripts
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
            console.warn("Google credentials not found in environment. Google Photos will be disabled.");
            return;
        }

        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
            window.gapi.load('picker', () => setIsGapiLoaded(true));
        };
        document.body.appendChild(gapiScript);

        const gsiScript = document.createElement('script');
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.async = true;
        gsiScript.defer = true;
        gsiScript.onload = () => {
             if (window.google?.accounts?.oauth2) {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: GOOGLE_PHOTOS_SCOPE,
                    callback: '', // Callback is handled by the promise
                });
                setTokenClient(client);
            }
        };
        document.body.appendChild(gsiScript);
        
        return () => {
            document.body.removeChild(gapiScript);
            document.body.removeChild(gsiScript);
        }
    }, []);

    const handleFileSelected = (selectedFiles: FileList | File[] | null) => {
        if (disabled || !selectedFiles) return;
        const newFiles = [...files, ...Array.from(selectedFiles)];
        setFiles(newFiles);
        onImageChange(newFiles);
        setIsChoiceModalOpen(false);
    };

    const handleUploaderClick = () => {
        if (disabled) return;
        setIsChoiceModalOpen(true);
    };
    
    const handleRemoveImage = (e: React.MouseEvent, indexToRemove: number) => {
        e.stopPropagation();
        const newFiles = files.filter((_, index) => index !== indexToRemove);
        setFiles(newFiles);
        onImageChange(newFiles);
    };

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    // --- Google Photos Logic ---
    const handleOpenGooglePhotos = async () => {
        if (!isGapiLoaded || !tokenClient) {
            alert("Google Photos integration is not ready yet. Please try again in a moment.");
            return;
        }

        const showPicker = () => {
            const picker = new window.google.picker.PickerBuilder()
                .addView(window.google.picker.ViewId.PHOTOS)
                .setOAuthToken(oauthToken.current.access_token)
                .setDeveloperKey(GOOGLE_API_KEY)
                .setAppId(GOOGLE_APP_ID)
                .setCallback(pickerCallback)
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .build();
            picker.setVisible(true);
        };
        
        const pickerCallback = async (data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
                setIsFetchingFromGoogle(true);
                setIsChoiceModalOpen(false);
                try {
                    const photoFiles = await Promise.all(data.docs.map(async (doc: any, index: number) => {
                        const res = await fetch(doc.url);
                        const blob = await res.blob();
                        return new File([blob], doc.name || `google-photo-${Date.now()}-${index}.jpg`, { type: blob.type });
                    }));
                    handleFileSelected(photoFiles);
                } catch (error) {
                    console.error("Error fetching images from Google Photos:", error);
                    alert("Failed to fetch images from Google Photos. Please try again.");
                } finally {
                    setIsFetchingFromGoogle(false);
                }
            }
        };
        
        tokenClient.callback = (resp: any) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            oauthToken.current = resp;
            showPicker();
        };

        if (oauthToken.current === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    };

    // --- Camera Logic ---
    const handleOpenCamera = () => {
        setIsChoiceModalOpen(false);
        setCameraError(null);
        if (typeof window === 'undefined' || !window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            cameraFileInputRef.current?.click();
            return;
        }
        setIsCameraOpen(true);
    };

    const handleCloseCamera = useCallback(() => {
        setIsCameraOpen(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    useEffect(() => {
        if (!isCameraOpen) return;
        let isCancelled = false;
        const startCamera = async () => {
            try {
                const localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
                if (isCancelled) {
                    localStream.getTracks().forEach(track => track.stop());
                    return;
                }
                streamRef.current = localStream;
                if (videoRef.current) videoRef.current.srcObject = localStream;
            } catch (err) {
                console.error("Error accessing camera:", err);
                setCameraError("Could not access camera. Please check permissions.");
            }
        };
        startCamera();
        return () => { isCancelled = true; streamRef.current?.getTracks().forEach(track => track.stop()); };
    }, [isCameraOpen]);
    
    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                handleFileSelected([file]);
            }
            handleCloseCamera();
        }, 'image/jpeg');
    }, [handleCloseCamera, files]);

    // --- Drag & Drop Logic ---
    const onDragEvent = (e: React.DragEvent, type: 'enter' | 'leave' | 'over') => {
        e.preventDefault(); e.stopPropagation();
        if (disabled) return;
        setDragOver(type === 'enter' || type === 'over');
    };
    const onDrop = (e: React.DragEvent) => {
        onDragEvent(e, 'leave');
        handleFileSelected(e.dataTransfer.files);
    };

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isCameraOpen) handleCloseCamera();
                if (isChoiceModalOpen) setIsChoiceModalOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isCameraOpen, isChoiceModalOpen, handleCloseCamera]);
    
    // --- Render ---
    const isGooglePhotosEnabled = GOOGLE_CLIENT_ID && GOOGLE_API_KEY;

    return (
        <>
            <div className="flex flex-col gap-3">
                <div className={`grid gap-3 transition-all ${files.length > 0 ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5' : 'grid-cols-1'}`}>
                    {previewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                            <img src={url} alt={`Product Preview ${index + 1}`} className="w-full h-full object-cover" />
                            {!disabled && (
                                <button onClick={(e) => handleRemoveImage(e, index)} className="absolute top-1.5 right-1.5 p-1 bg-slate-900/60 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all z-10 opacity-0 group-hover:opacity-100" aria-label={`Remove image ${index + 1}`}>
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {!disabled && (
                        <div onClick={handleUploaderClick} onDragEnter={(e) => onDragEvent(e, 'enter')} onDragLeave={(e) => onDragEvent(e, 'leave')} onDragOver={(e) => onDragEvent(e, 'over')} onDrop={onDrop}
                             className={`relative w-full aspect-square bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center overflow-hidden transition-colors duration-300
                                ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-indigo-500'}
                                ${dragOver ? 'border-indigo-500 bg-indigo-900/20' : ''}`}
                             role="button" aria-label={files.length > 0 ? "Add more product images" : "Upload product images"} tabIndex={disabled ? -1 : 0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUploaderClick(); }}}>
                            <div className="text-center text-slate-300 flex flex-col items-center pointer-events-none p-2">
                                <UploadIcon className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                                <p className="font-semibold text-white">{dragOver ? 'Drop to Upload' : (files.length > 0 ? 'Add More' : 'Upload Images')}</p>
                                {files.length === 0 && <p className="text-sm text-slate-300">or drag & drop</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelected(e.target.files)} accept="image/png, image/jpeg, image/webp, image/*" className="hidden" disabled={disabled} multiple />
            <input type="file" ref={cameraFileInputRef} onChange={(e) => handleFileSelected(e.target.files)} accept="image/png, image/jpeg, image/webp, image/*" capture="environment" className="hidden" disabled={disabled} />
            
            {(isChoiceModalOpen || isFetchingFromGoogle) && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !isFetchingFromGoogle && setIsChoiceModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="image-source-title">
                    <div className="bg-slate-800 rounded-xl shadow-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                         {isFetchingFromGoogle ? (
                            <div className="p-10 flex flex-col items-center justify-center gap-4">
                                <SpinnerIcon className="w-10 h-10 text-indigo-400" />
                                <h3 className="font-semibold text-lg text-white">Fetching from Google Photos...</h3>
                                <p className="text-slate-300 text-sm">Please wait while we download your selected images.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                                    <h3 id="image-source-title" className="font-semibold text-lg text-white">Choose Image <span className="text-indigo-400">Source</span></h3>
                                    <button onClick={() => setIsChoiceModalOpen(false)} className="p-1.5 rounded-full text-slate-200 hover:bg-slate-700 hover:text-white transition-colors" aria-label="Close"><CloseIcon className="w-6 h-6" /></button>
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button onClick={handleChooseFile} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800">
                                        <PhotoIcon className="w-10 h-10 text-indigo-400"/>
                                        <span className="font-semibold">From Library</span>
                                    </button>
                                    <button onClick={handleOpenCamera} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800">
                                        <CameraIcon className="w-10 h-10 text-indigo-400"/>
                                        <span className="font-semibold">Use Camera</span>
                                    </button>
                                    <button onClick={handleOpenGooglePhotos} disabled={!isGooglePhotosEnabled || !isGapiLoaded || !tokenClient}
                                            className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-700/50"
                                            title={!isGooglePhotosEnabled ? "Google Photos integration is not configured." : ""}>
                                        <GooglePhotosIcon className="w-10 h-10 text-indigo-400"/>
                                        <span className="font-semibold">Google Photos</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {isCameraOpen && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain absolute inset-0"></video>
                    {cameraError && <p className="absolute top-4 text-red-400 bg-red-900/50 p-2 rounded">{cameraError}</p>}
                    <button onClick={handleCloseCamera} className="absolute top-4 right-4 text-slate-300 hover:text-white transition-colors z-20 p-2 bg-slate-900/50 rounded-full" aria-label="Close camera"><CloseIcon className="w-6 h-6" /></button>
                    <div className="absolute bottom-8 z-10">
                        <button onClick={handleCapture} className={`w-20 h-20 rounded-full backdrop-blur-sm border-4 ring-4 flex items-center justify-center transition-transform ${cameraError ? 'bg-white/10 border-white/40 ring-red-400/40 cursor-not-allowed' : 'bg-white/20 border-white ring-black/20 hover:scale-105'}`} aria-label="Take picture" disabled={!!cameraError}>
                            <div className={`w-16 h-16 rounded-full ${cameraError ? 'bg-white/40' : 'bg-white'}`}></div>
                        </button>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
        </>
    );
};

export default ImageUploader;
