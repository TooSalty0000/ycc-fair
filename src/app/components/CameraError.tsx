'use client';

import { AlertTriangle, Shield, Smartphone, RefreshCw } from 'lucide-react';

interface CameraErrorProps {
  error: string;
  onRetry: () => void;
  onFileUpload: (file: File) => void;
}

export default function CameraError({ error, onRetry, onFileUpload }: CameraErrorProps) {
  const isHttpsError = error.includes('HTTPS') || error.includes('not supported');
  const isPermissionError = error.includes('permission') || error.includes('denied');

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 border border-red-200">
      <div className="text-center mb-6">
        {isHttpsError ? (
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
        ) : (
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Issue</h3>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>

      {isHttpsError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">📱 Mobile Solution:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Access this site via HTTPS</li>
            <li>• Use Chrome or Safari browser</li>
            <li>• Enable location services</li>
          </ul>
        </div>
      )}

      {isPermissionError && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-orange-900 mb-2">🔐 Permission Fix:</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Tap the camera icon in address bar</li>
            <li>• Select &quot;Allow&quot; for camera access</li>
            <li>• Refresh the page</li>
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Camera Again
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <label className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
          <Smartphone className="h-4 w-4 mr-2" />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileUpload(file);
            }}
          />
          Use Camera App Instead
        </label>

        <p className="text-xs text-gray-500 text-center">
          This will open your device&apos;s camera app to take a photo
        </p>
      </div>
    </div>
  );
}