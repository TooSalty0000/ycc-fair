'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Square, RotateCcw } from 'lucide-react';

// Type declaration for deprecated getUserMedia
declare global {
  interface Navigator {
    getUserMedia?: (
      constraints: MediaStreamConstraints,
      successCallback: (stream: MediaStream) => void,
      errorCallback: (error: Error) => void
    ) => void;
  }
}

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export default function CameraCapture({ onCapture, isProcessing }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async (newFacingMode?: 'user' | 'environment') => {
    try {
      setIsLoading(true);
      setError('');

      const targetFacingMode = newFacingMode || facingMode;

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices) {
        // Fallback for older browsers
        if (navigator.getUserMedia) {
          // Use deprecated getUserMedia as fallback
          const getUserMedia = navigator.getUserMedia.bind(navigator);
          const mediaStream = await new Promise<MediaStream>((resolve, reject) => {
            getUserMedia(
              {
                video: {
                  facingMode: targetFacingMode,
                  width: { ideal: 1280, min: 640 },
                  height: { ideal: 720, min: 480 }
                },
                audio: false
              },
              resolve,
              reject
            );
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            await videoRef.current.play();
          }
          
          setStream(mediaStream);
          setIsLoading(false);
          return;
        }
        throw new Error('Camera not supported on this device/browser');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported on this browser');
      }

      // Stop existing stream only when switching cameras
      if (newFacingMode) {
        // Access current stream state directly to avoid dependency issues
        setStream(currentStream => {
          if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
          }
          return null;
        });
      }

      const constraints = {
        video: {
          facingMode: targetFacingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsLoading(false);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this device/browser.';
      } else if (error.message?.includes('not supported')) {
        errorMessage = 'Camera not supported. Please use HTTPS or a supported browser.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [facingMode]);

  // Initialize camera once when component mounts
  useEffect(() => {
    let mounted = true;
    
    const initializeCamera = async () => {
      if (typeof window !== 'undefined' && mounted) {
        // Small delay to ensure component is fully mounted
        setTimeout(() => {
          if (mounted) {
            startCamera();
          }
        }, 100);
      }
    };

    initializeCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Optimize image size for faster processing (max 800px width)
    const maxWidth = 800;
    const aspectRatio = video.videoHeight / video.videoWidth;
    
    if (video.videoWidth > maxWidth) {
      canvas.width = maxWidth;
      canvas.height = maxWidth * aspectRatio;
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 with reasonable quality (reduces file size)
    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    onCapture(imageData);
  };

  const switchCamera = async (event: React.MouseEvent) => {
    event.preventDefault();
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    await startCamera(newFacingMode);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
        <Camera className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 text-center px-4 mb-4">{error}</p>
        
        <div className="space-y-2 flex flex-col items-center justify-center">
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 block"
          >
            재시도
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Or</p>
            <label className="cursor-pointer inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        onCapture(event.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              사진 쵤영
            </label>
            <p className="text-xs text-gray-500 mt-1">사용자 카메라 사용</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative bg-black rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
              <p>카메라 시작중...</p>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-auto"
          playsInline
          muted
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Camera overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
          </div>
        </div>

        {/* Camera switch button */}
        <button
          onClick={switchCamera}
          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          disabled={isLoading || isProcessing}
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Capture button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={capturePhoto}
          disabled={isLoading || isProcessing}
          className="relative p-4 bg-white border-4 border-indigo-600 rounded-full shadow-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          ) : (
            <Square className="h-8 w-8 text-indigo-600 fill-current" />
          )}
        </button>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}