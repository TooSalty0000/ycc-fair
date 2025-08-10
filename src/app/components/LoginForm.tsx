'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading: contextLoading } = useGame();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('사용자명과 비밀번호를 입력해주세요');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('사용자명은 최소 3자 이상이어야 합니다');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || '인증에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    }
    
    setIsLoading(false);
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-6">
            <img src="/ycc_logo.png" alt="YCC 로고" className="h-20 w-20 rounded-xl shadow-lg mx-auto mb-4" />
            <div>
              <h2 className="text-2xl font-bold text-indigo-600">YCC/YCC 루키즈</h2>
              <p className="text-lg text-gray-700">동아리 박람회 보물찾기</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            사진 보물찾기 모험에 참여하세요!
          </p>
        </div>
        
        <form className="bg-white p-6 rounded-xl shadow-lg space-y-4" onSubmit={handleSubmit}>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              사용자명
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="사용자명을 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                게임 참여
              </>
            )}
          </button>

          {/* Password Recovery Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  중요: 비밀번호 복구
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  ⚠️ <strong>비밀번호를 잊어버리면 계정을 복구할 수 없습니다.</strong> 이 시스템은 비밀번호 복구 기능이 없는 로컬 시스템입니다. 기억하기 쉬운 비밀번호를 선택해주세요!
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              신규 사용자: 계정이 자동으로 생성됩니다. 기존 사용자: 로그인 정보를 입력하세요!
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}