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

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const file = event.target.files?.[0] || null;
        onImageChange(file);
    };

    const handleClick = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const stopCameraStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const handleCloseCamera = useCallback(() => {
        setIsCameraOpen(false);
        stopCameraStream();
    }, [stopCameraStream]);

    const handleOpenCamera = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("Camera not supported on this device or browser.");
            return;
        }

        // Always stop any previous stream before starting a new one.
        stopCameraStream();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            setIsCameraOpen(true);
            setCameraError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            let message = "Could not access camera. Please check permissions.";
             if (err instanceof DOMException) {
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    message = "Camera access denied. Please allow camera permission in your browser settings.";
                } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                    message = "No camera could be found on your device.";
                } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                    message = "Could not start video source. Your camera might be in use by another application or tab.";
                }
            }
            setCameraError(message);
        }
    }, [disabled, stopCameraStream]);
    
    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                onImageChange(file);
            }
            handleCloseCamera();
        }, 'image/jpeg');
    }, [onImageChange, handleCloseCamera]);

    // Effect to attach stream to video element when camera opens
    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isCameraOpen) {
                handleCloseCamera();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCameraOpen, handleCloseCamera]);

    // Cleanup effect for when the component unmounts
    useEffect(() => {
        return () => {
            stopCameraStream();
        };
    }, [stopCameraStream]);
    
    return (
        <>
            <div 
                onClick={handleClick}
                className={`relative w-full aspect-video bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center overflow-hidden transition-colors duration-300
                    ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-indigo-500'}
                `}
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
                    <img src={imagePreviewUrl} alt="Product Preview" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-slate-500 flex flex-col items-center">
                        <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold">Click to upload image</p>
                        <p className="text-xs">PNG, JPG, or WEBP</p>
                        <div className="my-3 flex items-center w-3/4 mx-auto">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink mx-2 text-slate-500 text-xs">OR</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>
                        <button
                           onClick={handleOpenCamera}
                           disabled={disabled}
                           className="inline-flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold py-1.5 px-3 rounded-md text-sm transition-colors"
                        >
                           <CameraIcon className="w-4 h-4" />
                           Use Camera
                        </button>
                    </div>
                )}
            </div>
            
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