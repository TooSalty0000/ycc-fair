'use client';

import { useState, useEffect } from 'react';
import { Gift, ArrowLeft, Trophy, Check, AlertCircle } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

interface Coupon {
  id: number;
  word: string;
  coupon_code: string;
  status: 'pending' | 'confirmed';
  prize_description: string;
  created_at: string;
  confirmed_at?: string;
}

export default function CouponsPage({ onBack }: { onBack: () => void }) {
  const { user } = useGame();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingCouponId, setConfirmingCouponId] = useState<number | null>(null);

  useEffect(() => {
    loadUserCoupons();
  }, []);

  const loadUserCoupons = async () => {
    try {
      const response = await fetch('/api/game/user-coupons', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReceive = async (couponId: number) => {
    setConfirmingCouponId(couponId);
    try {
      const response = await fetch('/api/game/confirm-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ couponId })
      });

      if (response.ok) {
        // Update the coupon status in the local state
        setCoupons(prev => prev.map(coupon => 
          coupon.id === couponId 
            ? { ...coupon, status: 'confirmed' as const, confirmed_at: new Date().toISOString() }
            : coupon
        ));
      } else {
        console.error('Failed to confirm coupon');
      }
    } catch (error) {
      console.error('Error confirming coupon:', error);
    } finally {
      setConfirmingCouponId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCoupons = coupons.filter(c => c.status === 'pending');
  const confirmedCoupons = coupons.filter(c => c.status === 'confirmed');

  if (!user) return null;

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
              <h1 className="text-xl font-bold text-indigo-600">내 쿠폰</h1>
              <p className="text-sm text-gray-600">획득한 쿠폰을 관리하세요</p>
            </div>
            
            <button
              onClick={onBack}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              게임으로 돌아가기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
              <Gift className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-yellow-600">{coupons.length}</h3>
            <p className="text-sm text-gray-600">총 획득</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600">{pendingCoupons.length}</h3>
            <p className="text-sm text-gray-600">대기 중</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{confirmedCoupons.length}</h3>
            <p className="text-sm text-gray-600">확인됨</p>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">쿠폰을 불러오는 중...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 쿠폰이 없습니다</h3>
            <p className="text-gray-600 mb-6">
              계속 사진을 찍어서 쿠폰을 획득하세요! 각 성공적인 제출마다 30%의 확률로 부스 쿠폰을 얻을 수 있습니다.
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Trophy className="h-5 w-5 mr-2" />
              게임 시작하기
            </button>
          </div>
        ) : (
          <>
            {/* Pending Coupons */}
            {pendingCoupons.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🎁 사용 가능한 쿠폰</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingCoupons.map((coupon) => (
                    <div key={coupon.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Gift className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">부스 상품</h4>
                            <p className="text-sm text-gray-600">&quot;{coupon.word}&quot; 챌린지에서</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4 border border-yellow-300">
                        <p className="text-sm font-medium text-gray-700 mb-2">쿠폰 코드:</p>
                        <p className="text-2xl font-mono font-bold text-center text-yellow-700 bg-yellow-100 py-2 rounded">
                          {coupon.coupon_code}
                        </p>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 text-center">
                        📍 <strong>부스에 와서 상품을 받아가세요!</strong>
                      </p>
                      
                      <button
                        onClick={() => handleConfirmReceive(coupon.id)}
                        disabled={confirmingCouponId === coupon.id}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        {confirmingCouponId === coupon.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            확인 중...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            수령 확인
                          </>
                        )}
                      </button>
                      
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        {formatDate(coupon.created_at)}에 획득
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Coupons */}
            {confirmedCoupons.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">✅ 사용한 쿠폰</h2>
                <div className="space-y-3">
                  {confirmedCoupons.map((coupon) => (
                    <div key={coupon.id} className="bg-white border border-gray-200 rounded-lg p-4 opacity-75">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{coupon.coupon_code}</h4>
                            <p className="text-sm text-gray-600">&quot;{coupon.word}&quot; 챌린지에서</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            사용됨
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {coupon.confirmed_at && formatDate(coupon.confirmed_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">📋 쿠폰 사용 방법</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>쿠폰 코드를 보여주세요</strong> YCC 부스 운영자에게</p>
            <p>• <strong>이 화면을 제시하세요</strong> 쿠폰 코드가 명확히 보이도록</p>
            <p>• <strong>&quot;수령 확인&quot;을 클릭하세요</strong> 상품을 받은 후</p>
            <p>• <strong>계속 플레이하세요</strong> 박람회 내내 더 많은 쿠폰을 획득하기 위해!</p>
          </div>
        </div>
      </main>
    </div>
  );
}