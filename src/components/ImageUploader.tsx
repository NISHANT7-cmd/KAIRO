import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Camera, Trash2, Link as LinkIcon, AlertCircle, Check, Loader2 } from 'lucide-react';

export interface ImageUploaderProps {
  id?: string;
  label?: string;
  helperText?: string;
  value?: string;
  onChange: (url: string) => void;
  aspect?: 'square' | 'cover' | 'banner' | 'wide' | 'video' | 'auto';
  maxDimension?: number; // max width or height in px before canvas downscale (default 1400)
  quality?: number; // compression quality 0.1 - 1.0 (default 0.88)
  allowUrlFallback?: boolean;
  className?: string;
  avatarMode?: boolean;
  placeholder?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  id,
  label,
  helperText,
  value,
  onChange,
  aspect = 'auto',
  maxDimension = 1600,
  quality = 0.88,
  allowUrlFallback = true,
  className = '',
  avatarMode = false,
  placeholder,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueId = id || `uploader-${Math.random().toString(36).substring(2, 9)}`;

  // Optimizes and resizes an image file locally using HTML Canvas
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    // Check size threshold (e.g. limit to 35MB raw files)
    if (file.size > 35 * 1024 * 1024) {
      setErrorMessage('Image is too large. Please select an image under 35MB.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onerror = () => {
      setIsProcessing(false);
      setErrorMessage('Failed to read image from device storage. Please try again.');
    };

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        setIsProcessing(false);
        setErrorMessage('Failed to process image.');
        return;
      }

      // If GIF or SVG, do not run through canvas to preserve animation/vectors
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        onChange(result);
        setIsProcessing(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const maxDim = avatarMode ? 600 : maxDimension;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            onChange(result);
            setIsProcessing(false);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to efficient JPEG or WebP data URL
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(outputType, quality);

          onChange(compressedDataUrl);
          setIsProcessing(false);
        } catch (canvasErr) {
          // Fallback to raw data URL if canvas context fails
          onChange(result);
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setIsProcessing(false);
        setErrorMessage('Unable to decode image. Please choose another image file.');
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  }, [avatarMode, maxDimension, quality, onChange]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
    // Reset file input so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setFileName(null);
    setErrorMessage(null);
  };

  const handleApplyUrl = () => {
    if (!urlDraft.trim()) return;
    onChange(urlDraft.trim());
    setUrlDraft('');
    setShowUrlInput(false);
    setFileName(null);
  };

  // Determine aspect ratio class
  const getAspectClass = () => {
    if (avatarMode) return 'aspect-square w-32 h-32 rounded-full mx-auto';
    switch (aspect) {
      case 'square': return 'aspect-square max-w-xs';
      case 'cover': return 'aspect-[3/4] max-w-sm';
      case 'banner': return 'aspect-[16/7] w-full';
      case 'video': return 'aspect-video w-full';
      case 'wide': return 'aspect-[21/9] w-full';
      default: return 'min-h-[160px] w-full';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Actions Row */}
      {(label || allowUrlFallback) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label htmlFor={uniqueId} className="block text-xs font-bold text-[#544246]">
              {label}
            </label>
          )}

          {allowUrlFallback && (
            <button
              type="button"
              id={`${uniqueId}-toggle-url`}
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] font-semibold text-[#9e3b5f] hover:text-[#7d2c49] flex items-center gap-1 transition-colors cursor-pointer ml-auto"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{showUrlInput ? 'Upload from device' : 'Use image link'}</span>
            </button>
          )}
        </div>
      )}

      {/* Optional URL Fallback Input */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-pink-50/70 border border-pink-200">
          <input
            type="url"
            id={`${uniqueId}-url-input`}
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder={placeholder || "Paste image URL (https://...)"}
            className="flex-1 bg-white px-3 py-1.5 rounded-xl border border-pink-200 text-xs text-[#26152b] focus:outline-none focus:ring-2 focus:ring-[#9e3b5f]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            disabled={!urlDraft.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#9e3b5f] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#852f4e] transition-colors cursor-pointer shrink-0"
          >
            Apply
          </button>
        </div>
      )}

      {/* Hidden File Input for Device Gallery & Storage */}
      <input
        ref={fileInputRef}
        id={uniqueId}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error Message Display */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-rose-500 hover:text-rose-800 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Upload / Preview Area */}
      {value ? (
        <div
          className={`relative group overflow-hidden border-2 border-pink-200/80 bg-stone-900/5 shadow-xs transition-all ${
            avatarMode ? 'rounded-full w-32 h-32 mx-auto ring-4 ring-pink-100' : 'rounded-2xl'
          } ${getAspectClass()}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <img
            src={value}
            alt={label || 'Uploaded content'}
            className="w-full h-full object-cover"
          />

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
              <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
              <span className="text-xs font-bold">Processing image...</span>
            </div>
          )}

          {/* Hover / Action Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3 z-10">
            <button
              type="button"
              id={`${uniqueId}-change-btn`}
              onClick={triggerFilePicker}
              className="px-3 py-2 rounded-xl bg-white text-[#26152b] hover:bg-pink-50 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
              title="Upload new image from gallery or device storage"
            >
              <Camera className="w-3.5 h-3.5 text-[#9e3b5f]" />
              <span>Change</span>
            </button>
            <button
              type="button"
              id={`${uniqueId}-remove-btn`}
              onClick={handleClear}
              className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-105"
              title="Remove image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {fileName && !avatarMode && (
            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium truncate z-10 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{fileName}</span>
            </div>
          )}
        </div>
      ) : (
        /* Empty State Dropzone */
        <div
          id={`${uniqueId}-dropzone`}
          onClick={triggerFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center ${
            isDragging
              ? 'border-[#9e3b5f] bg-pink-100/60 scale-[1.01]'
              : 'border-pink-300/80 bg-white/70 hover:bg-pink-50/50 hover:border-[#9e3b5f]'
          } ${avatarMode ? 'rounded-full w-32 h-32 mx-auto p-3' : 'rounded-2xl'} ${getAspectClass()}`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 text-[#9e3b5f]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold">Optimizing image...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-pink-100 text-[#9e3b5f] flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                {avatarMode ? <Camera className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              </div>
              
              {!avatarMode ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#26152b]">
                    <span className="text-[#9e3b5f] hover:underline">Click to browse gallery</span> or drag & drop
                  </p>
                  <p className="text-[11px] text-[#877276]">
                    Upload photos directly from your phone gallery or internal storage
                  </p>
                  <p className="text-[10px] text-[#a89599]">
                    Supports JPG, PNG, WEBP, GIF (up to 35MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-[#9e3b5f]">Upload Photo</span>
                  <p className="text-[9px] text-[#877276] leading-tight">Gallery or storage</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-[#877276]">{helperText}</p>
      )}
    </div>
  );
};
