'use client';

import { useState } from 'react';
import { Trophy, Star, Gift, LogOut, Users, Shield, Key, Share2 } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import CameraCapture from './CameraCapture';
import AITestPanel from './AITestPanel';
import CouponsPage from './CouponsPage';
import AdminPage from './AdminPage';
import { GameResult } from '../types';
import Leaderboard from './Leaderboard';

export default function GameInterface() {
  const { user, gameState, logout, submitPhoto } = useGame();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAITest, setShowAITest] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleShare = async () => {
    const shareData = {
      title: 'YCC/YCC 루키즈 동아리 박람회 보물찾기',
      text: '사진 보물찾기 게임에 참여하세요! 캠퍼스에서 단어와 일치하는 것들을 찾아 사진을 찍고 포인트를 획득하세요!',
      url: window.location.origin
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL
        await navigator.clipboard.writeText(window.location.origin);
        alert('게임 링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('게임 링크가 클립보드에 복사되었습니다!');
      } catch {
        console.error('Share failed:', error);
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      alert('현재 비밀번호와 새 비밀번호를 모두 입력해주세요');
      return;
    }

    if (newPassword.length < 6) {
      alert('새 비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setShowPasswordChange(false);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert('오류가 발생했습니다');
    }
  };

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
        message: '사진 처리에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  // Show admin page if requested
  if (showAdmin) {
    return <AdminPage />;
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
            <div className="flex items-center space-x-3">
              <img src="/ycc_logo.png" alt="YCC 로고" className="h-12 w-12 rounded-lg shadow-sm" />
              <div>
                <h2 className="text-lg font-bold text-indigo-600">YCC</h2>
                <p className="text-xs text-indigo-500">루키즈</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-indigo-600">동아리 박람회 보물찾기</h1>
              <p className="text-sm text-gray-600">환영합니다, {user.username}님!</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="flex items-center px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <Users className="h-4 w-4 mr-1" />
                순위표
              </button>
              
              <button
                onClick={() => setShowCoupons(true)}
                className="flex items-center px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <Gift className="h-4 w-4 mr-1" />
                내 쿠폰
              </button>
              
              {user.isAdmin && (
                <button
                  onClick={() => setShowAdmin(true)}
                  className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  관리자 패널
                </button>
              )}
              
              {/* {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setShowAITest(true)}
                  className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Brain className="h-4 w-4 mr-1" />
                  AI 테스트
                </button>
              )} */}
              
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Key className="h-4 w-4 mr-1" />
                비밀번호 변경
              </button>
              
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
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
                <p className="text-sm font-medium text-gray-600">점수</p>
                <p className="text-2xl font-bold text-indigo-600">{user.points}</p>
              </div>
              <Trophy className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowCoupons(true)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">쿠폰</p>
                <p className="text-2xl font-bold text-yellow-600">{user.tokens}</p>
              </div>
              <Gift className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">진행상황</p>
                <p className="text-sm text-gray-500">
                  {gameState.totalSubmissions}/{gameState.requiredSubmissions}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Password Change Form */}
        {showPasswordChange && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              비밀번호 변경
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currentPasswordUser" className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <input
                  id="currentPasswordUser"
                  type="password"
                  placeholder="현재 비밀번호를 입력하세요"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="newPasswordUser" className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 (최소 6자)
                </label>
                <input
                  id="newPasswordUser"
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={handlePasswordChange}
                disabled={!currentPassword || !newPassword}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                비밀번호 변경
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setCurrentPassword('');
                  setNewPassword('');
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Current Keyword */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">현재 미션</h2>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-3xl font-bold py-4 px-8 rounded-lg inline-block">
              {gameState.currentKeyword}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              위의 키워드와 관련된 것을 찾아서 사진을 찍으세요!
            </p>
            <div className="mt-4 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                진행상황: {gameState.totalSubmissions}/{gameState.requiredSubmissions} 성공적인 제출
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
                  <span className="text-yellow-600 font-bold">쿠폰!</span>
                </div>
              )}
            </div>
            {result.success && (
              <div className="text-center mt-2">
                <p className="text-sm font-medium">
                  +{result.points} 점{result.token ? ' + 쿠폰 1개!' : ''}
                </p>
                {result.token && (
                  <p className="text-xs text-yellow-700 mt-1">
                    🎉 행운입니다! 부스 쿠폰을 획득했습니다!
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">이미 완료됨!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  이미 &quot;{gameState.currentKeyword}&quot;에 대한 점수를 획득했습니다
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">다음 미션 대기 중</span>
                </div>
                <p className="text-xs text-yellow-700">
                  다음 미션션 단어를 잠금 해제하려면 
                  {' ' + (gameState.requiredSubmissions - gameState.totalSubmissions).toString()}명이 더 제출해야 합니다!
                </p>
                
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    onClick={handleShare}
                    className="flex items-center px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    친구들 초대하기
                  </button>
                  
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="flex items-center px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    순위표 보기
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  더 많은 친구들을 초대해서 함께 다음 단어를 잠금 해제해보세요!
                </p>
              </div>
            </div>
          ) : (
            // User can still submit
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">사진 촬영하기</h3>
                <p className="text-sm text-gray-600">
                  &quot;{gameState.currentKeyword}&quot;와 관련된 것을 찾아서 카메라를 위치시켜주세요
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
                      AI가 사진을 분석하고 있습니다...
                    </p>
                  </div>
                  <div className="text-xs text-indigo-600">
                    <p>🔍 &quot;{gameState.currentKeyword}&quot; 찾는 중</p>
                    <p>🚫 화면 사진이 아닌지 확인 중</p>
                    <p>⚡ 몇 초 정도 걸릴 수 있습니다</p>
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

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 flex items-start justify-center p-4 z-50" style={{backgroundColor: 'rgba(255, 255, 255, 0.95)'}}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mt-8 border-2 border-indigo-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">실시간 순위표</h2>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <Leaderboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}