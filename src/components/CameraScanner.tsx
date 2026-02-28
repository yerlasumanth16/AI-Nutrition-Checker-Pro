import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RotateCcw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraScannerProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure you have granted permission.");
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(base64);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
    >
      <div className="relative w-full max-w-2xl aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Video Preview */}
        {!capturedImage && (
          <div className="relative w-full h-full">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            {/* Scanner Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-emerald-400/50 rounded-3xl relative">
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-3xl animate-pulse" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-scan" />
              </div>
            </div>

            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                <p className="text-sm font-medium animate-pulse">Initializing Camera...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-lg font-bold mb-2">Camera Error</p>
                <p className="text-slate-400 text-sm mb-6">{error}</p>
                <button 
                  onClick={startCamera}
                  className="px-6 py-2 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="w-full h-full">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-around">
          {!capturedImage ? (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-colors"
                title="Upload from Gallery"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              
              <button 
                onClick={captureFrame}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
                title="Capture Frame"
              >
                <div className="w-16 h-16 border-4 border-slate-900 rounded-full" />
              </button>

              <div className="w-14 h-14" /> {/* Spacer */}
            </>
          ) : (
            <>
              <button 
                onClick={handleRetake}
                className="flex flex-col items-center gap-2 text-white group"
              >
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-full group-hover:bg-white/20 transition-colors">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Retake</span>
              </button>

              <button 
                onClick={handleConfirm}
                className="flex flex-col items-center gap-2 text-white group"
              >
                <div className="p-6 bg-emerald-500 rounded-full group-hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/40">
                  <Check className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Analyze</span>
              </button>
            </>
          )}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileUpload}
      />

      <canvas ref={canvasRef} className="hidden" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}} />
    </motion.div>
  );
};
