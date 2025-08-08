'use client';

import { useState } from 'react';
import { Trophy, Star, Gift, LogOut, Users, Brain, Shield } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import CameraCapture from './CameraCapture';
import AITestPanel from './AITestPanel';
import CouponsPage from './CouponsPage';
import AdminPage from './AdminPage';
import { GameResult } from '../types';

export default function GameInterface() {
  const { user, gameState, logout, submitPhoto } = useGame();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAITest, setShowAITest] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const handlePhotoCapture = async (imageData: string) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const photoResult = await submitPhoto(imageData);
      setResult(photoResult);
      
      // Clear result after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      console.error('Photo submission error:', error);
      setResult({
        success: false,
        points: 0,
        message: 'Failed to process photo. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  // Show admin page if requested
  if (showAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} />;
  }

  // Show coupons page if requested
  if (showCoupons) {
    return <CouponsPage onBack={() => setShowCoupons(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">YCC Fair Hunt</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.username}!</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="flex items-center px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <Users className="h-4 w-4 mr-1" />
                Leaderboard
              </button>
              
              <button
                onClick={() => setShowCoupons(true)}
                className="flex items-center px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <Gift className="h-4 w-4 mr-1" />
                My Coupons
              </button>
              
              {user.isAdmin && (
                <button
                  onClick={() => setShowAdmin(true)}
                  className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin Panel
                </button>
              )}
              
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setShowAITest(true)}
                  className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Brain className="h-4 w-4 mr-1" />
                  AI Test
                </button>
              )}
              
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points</p>
                <p className="text-2xl font-bold text-indigo-600">{user.points}</p>
              </div>
              <Trophy className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowCoupons(true)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coupons</p>
                <p className="text-2xl font-bold text-yellow-600">{user.tokens}</p>
              </div>
              <Gift className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-sm text-gray-500">
                  {gameState.totalSubmissions}/{gameState.requiredSubmissions}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Current Keyword */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Current Challenge</h2>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-3xl font-bold py-4 px-8 rounded-lg inline-block">
              {gameState.currentKeyword}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Find and photograph something related to the keyword above!
            </p>
            <div className="mt-4 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                Progress: {gameState.totalSubmissions} out of {gameState.requiredSubmissions} successful submissions
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((gameState.totalSubmissions / gameState.requiredSubmissions) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg border-2 transition-all duration-500 ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              {result.success && <Trophy className="h-5 w-5" />}
              <span className="font-medium text-center">{result.message}</span>
              {result.token && (
                <div className="flex items-center space-x-1">
                  <Gift className="h-5 w-5 text-yellow-600 animate-bounce" />
                  <span className="text-yellow-600 font-bold">COUPON!</span>
                </div>
              )}
            </div>
            {result.success && (
              <div className="text-center mt-2">
                <p className="text-sm font-medium">
                  +{result.points} points{result.token ? ' + 1 coupon!' : ''}
                </p>
                {result.token && (
                  <p className="text-xs text-yellow-700 mt-1">
                    🎉 Lucky! You got a booth coupon!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Camera Interface or Waiting State */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          {gameState.hasUserSubmitted ? (
            // User has already submitted for current keyword
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Already Completed!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You&apos;ve already earned points for &quot;{gameState.currentKeyword}&quot;
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">Waiting for Next Keyword</span>
                </div>
                <p className="text-xs text-yellow-700">
                  The community needs {gameState.requiredSubmissions - gameState.totalSubmissions} more successful submissions 
                  to unlock the next challenge word!
                </p>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Check the leaderboard to see how others are doing while you wait!
                </p>
              </div>
            </div>
          ) : (
            // User can still submit
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Take Your Photo</h3>
                <p className="text-sm text-gray-600">
                  Position your camera to capture something related to &quot;{gameState.currentKeyword}&quot;
                </p>
              </div>
              
              <CameraCapture 
                onCapture={handlePhotoCapture} 
                isProcessing={isProcessing} 
              />
              
              {isProcessing && (
                <div className="text-center mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-indigo-700 font-medium">
                      AI is analyzing your photo...
                    </p>
                  </div>
                  <div className="text-xs text-indigo-600">
                    <p>🔍 Checking for &quot;{gameState.currentKeyword}&quot;</p>
                    <p>🚫 Ensuring it&apos;s not a screen photo</p>
                    <p>⚡ This may take a few seconds</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* AI Test Panel (Development Only) */}
      <AITestPanel 
        isVisible={showAITest}
        onClose={() => setShowAITest(false)}
      />
    </div>
  );
}