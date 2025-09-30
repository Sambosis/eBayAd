import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ImageUploaderProps {
    onImageChange: (file: File | null) => void;
    imagePreviewUrl: string | null;
    disabled?: boolean;
}

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imagePreviewUrl, disabled = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const file = event.target.files?.[0] || null;
        onImageChange(file);
    };
    
    const handleUploaderClick = () => {
        if (disabled || imagePreviewUrl) return;
        setIsChoiceModalOpen(true);
    };
    
    const handleClearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        onImageChange(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleChooseFile = () => {
        setIsChoiceModalOpen(false);
        fileInputRef.current?.click();
    };

    const handleOpenCamera = () => {
        setIsChoiceModalOpen(false);
        setIsCameraOpen(true);
    };
    
    const handleCloseCamera = useCallback(() => {
        setIsCameraOpen(false);
    }, []);

    useEffect(() => {
        if (!isCameraOpen) {
            return;
        }

        let isCancelled = false;
        let localStream: MediaStream | null = null;

        const startCamera = async () => {
            // Defensively stop any lingering stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            streamRef.current = null;
            setCameraError(null);

            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Camera not supported on this device or browser.");
                }

                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

                if (isCancelled) {
                    localStream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = localStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = localStream;
                }
            } catch (err) {
                if (isCancelled) return;
                
                console.error("Error accessing camera:", err);
                let message = "Could not access camera. Please check permissions.";
                if (err instanceof DOMException) {
                    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                        message = "Camera access denied. Please allow camera permission in your browser settings.";
                    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                        message = "No camera could be found on your device.";
                    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                        message = "Could not start video source. Your camera might be in use by another application or tab.";
                    } else {
                        message = `An unknown camera error occurred: ${err.name}`;
                    }
                } else if (err instanceof Error) {
                    message = err.message;
                }
                setCameraError(message);
                handleCloseCamera();
            }
        };

        startCamera();

        return () => {
            isCancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (localStream) {
                 localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOpen, handleCloseCamera]);
    
    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            console.error("Could not get 2d context from canvas");
            handleCloseCamera();
            return;
        }
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                onImageChange(file);
            }
            handleCloseCamera();
        }, 'image/jpeg');
    }, [onImageChange, handleCloseCamera]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if(isCameraOpen) handleCloseCamera();
                if(isChoiceModalOpen) setIsChoiceModalOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCameraOpen, isChoiceModalOpen, handleCloseCamera]);
    
    return (
        <>
            <div 
                onClick={handleUploaderClick}
                className={`relative w-full aspect-video bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center overflow-hidden transition-colors duration-300
                    ${disabled ? 'cursor-not-allowed opacity-70' : ''}
                    ${!imagePreviewUrl && !disabled ? 'cursor-pointer hover:border-indigo-500' : 'cursor-default'}
                `}
                role="button"
                aria-label={imagePreviewUrl ? "Product image preview" : "Upload product image"}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleUploaderClick();
                    }
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    disabled={disabled}
                />
                {imagePreviewUrl ? (
                    <>
                        <img src={imagePreviewUrl} alt="Product Preview" className="w-full h-full object-contain" />
                        {!disabled && (
                            <button
                                onClick={handleClearImage}
                                className="absolute top-2 right-2 p-1.5 bg-slate-900/60 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all z-10"
                                aria-label="Remove image"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="text-center text-slate-500 flex flex-col items-center pointer-events-none">
                        <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold">Upload Product Image</p>
                        <p className="text-xs">Click to choose from library or use camera</p>
                    </div>
                )}
            </div>
            
            {isChoiceModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsChoiceModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="image-source-title"
                >
                    <div 
                        className="bg-slate-800 rounded-xl shadow-lg w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                            <h3 id="image-source-title" className="font-semibold text-lg text-white">Choose Image Source</h3>
                            <button onClick={() => setIsChoiceModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" aria-label="Close">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleChooseFile}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            >
                                <PhotoIcon className="w-10 h-10 text-indigo-400"/>
                                <span className="font-semibold">From Library</span>
                            </button>
                            <button
                                onClick={handleOpenCamera}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            >
                                <CameraIcon className="w-10 h-10 text-indigo-400"/>
                                <span className="font-semibold">Use Camera</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCameraOpen && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain absolute inset-0"></video>
                    {cameraError && <p className="absolute top-4 text-red-400 bg-red-900/50 p-2 rounded">{cameraError}</p>}
                    <button
                        onClick={handleCloseCamera}
                        className="absolute top-4 right-4 text-slate-300 hover:text-white transition-colors z-20 p-2 bg-slate-900/50 rounded-full"
                        aria-label="Close camera"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-8 z-10">
                         <button
                            onClick={handleCapture}
                            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white ring-4 ring-black/20 flex items-center justify-center transition-transform hover:scale-105"
                            aria-label="Take picture"
                        >
                            <div className="w-16 h-16 rounded-full bg-white"></div>
                        </button>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
        </>
    );
};

export default ImageUploader;