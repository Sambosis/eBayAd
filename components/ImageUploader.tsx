
import React, { useRef } from 'react';

interface ImageUploaderProps {
    onImageChange: (file: File | null) => void;
    imagePreviewUrl: string | null;
}

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);


const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imagePreviewUrl }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        onImageChange(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };
    
    return (
        <div 
            onClick={handleClick}
            className="relative w-full aspect-video bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors duration-300 overflow-hidden"
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
            />
            {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Product Preview" className="w-full h-full object-contain" />
            ) : (
                <div className="text-center text-slate-500">
                    <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Click to upload image</p>
                    <p className="text-xs">PNG, JPG, or WEBP</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
