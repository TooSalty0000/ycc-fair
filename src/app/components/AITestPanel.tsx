'use client';

import { useState } from 'react';
import { Brain, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { verifyImageWithGemini, testGeminiConnection } from '../lib/gemini';

interface AITestPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function AITestPanel({ isVisible, onClose }: AITestPanelProps) {
  const [testKeyword, setTestKeyword] = useState('apple');
  const [testImage, setTestImage] = useState<string>('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    isScreen: boolean;
    confidence: number;
    explanation?: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const isConnected = await testGeminiConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestImage = async () => {
    if (!testImage) return;
    
    setIsTestingImage(true);
    setTestResult(null);
    
    try {
      const result = await verifyImageWithGemini(testImage, testKeyword);
      setTestResult(result);
    } catch (error) {
      console.error('Image test failed:', error);
      setTestResult({
        success: false,
        message: 'Test failed: ' + (error as Error).message,
        isScreen: false,
        confidence: 0
      });
    } finally {
      setIsTestingImage(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setTestImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">AI Testing Panel</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Connection Test */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Connection Test</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isTestingConnection ? 'Testing...' : 'Test Gemini Connection'}
              </button>
              
              {connectionStatus === 'success' && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Connected</span>
                </div>
              )}
              
              {connectionStatus === 'error' && (
                <div className="flex items-center space-x-1 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>Connection Failed</span>
                </div>
              )}
            </div>
          </div>

          {/* Image Test */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Image Verification Test</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Keyword
                </label>
                <input
                  type="text"
                  value={testKeyword}
                  onChange={(e) => setTestKeyword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter keyword to test"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {testImage && (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={testImage}
                    alt="Test upload"
                    className="max-w-full max-h-40 mx-auto rounded-md"
                  />
                </div>
              )}

              <button
                onClick={handleTestImage}
                disabled={!testImage || !testKeyword || isTestingImage}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isTestingImage ? 'Analyzing with AI...' : 'Test Image Verification'}
              </button>
            </div>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="p-4 rounded-lg border-2">
              <h4 className="font-semibold mb-2">Test Results</h4>
              
              <div className={`p-3 rounded-md mb-3 ${
                testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? 
                    <CheckCircle className="h-5 w-5" /> : 
                    <XCircle className="h-5 w-5" />
                  }
                  <span className="font-medium">{testResult.message}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Success:</span>
                  <span className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                    {testResult.success ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span>{testResult.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Screen Detected:</span>
                  <span className={testResult.isScreen ? 'text-red-600' : 'text-green-600'}>
                    {testResult.isScreen ? 'Yes' : 'No'}
                  </span>
                </div>
                {testResult.explanation && (
                  <div>
                    <span className="font-medium">Explanation:</span>
                    <p className="text-gray-600 mt-1">{testResult.explanation}</p>
                  </div>
                )}
              </div>

              {testResult.isScreen && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center space-x-1 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">Anti-cheat system detected screen photo</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}