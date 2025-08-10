'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Gift, 
  Settings, 
  Plus, 
  Trash2, 
  Play, 
  RotateCcw,
  Shield,
  Trophy,
  LogOut,
  Key
} from 'lucide-react';

interface UserStat {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
  last_active: string;
  total_points: number;
  total_coupons: number;
  words_completed: number;
}

interface Coupon {
  id: number;
  coupon_code: string;
  word: string;
  status: string;
  created_at: string;
  confirmed_at?: string;
  username: string;
}

interface Word {
  id: number;
  word: string;
  is_active: boolean;
  created_at: string;
  activated_at?: string;
  completed_at?: string;
  current_completions: number;
}

export default function AdminPage({ onLogout }: { onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserStat[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [couponDropRate, setCouponDropRate] = useState(30);
  const [defaultRequiredCompletions, setDefaultRequiredCompletions] = useState(5);

  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    try {
      const [statsResponse, wordsResponse, settingsResponse] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }),
        fetch('/api/admin/words', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }),
        fetch('/api/admin/settings', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUsers(statsData.users || []);
        setCoupons(statsData.coupons || []);
      }

      if (wordsResponse.ok) {
        const wordsData = await wordsResponse.json();
        setWords(wordsData.words || []);
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setCouponDropRate(settingsData.coupon_drop_rate || 30);
        setDefaultRequiredCompletions(settingsData.default_required_completions || 5);
        
        // Don't set currentWordCompletions here, it should be set when activeWord changes
      }

    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordAction = async (action: string, wordId?: number, requiredCompletions?: number) => {
    try {
      const response = await fetch('/api/admin/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          action,
          wordId,
          word: newWord,
          requiredCompletions: requiredCompletions || defaultRequiredCompletions
        })
      });

      if (response.ok) {
        setNewWord('');
        await loadData();
      } else {
        const errorData = await response.json();
        alert(`오류: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Word action error:', error);
      alert('오류가 발생했습니다');
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newAdminPassword) {
      alert('현재 비밀번호와 새 비밀번호를 모두 입력해주세요');
      return;
    }

    if (newAdminPassword.length < 6) {
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
          newPassword: newAdminPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setShowPasswordChange(false);
        setCurrentPassword('');
        setNewAdminPassword('');
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert('오류가 발생했습니다');
    }
  };

  const handleUserAction = async (action: string, userId: number) => {
    if (action === 'delete' && !confirm('이 사용자를 삭제하시겠습니까? 모든 제출 기록과 쿠폰도 함께 삭제됩니다.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          action,
          userId,
          newPassword: action === 'resetPassword' ? newPassword : undefined
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setResetPasswordUserId(null);
        setNewPassword('');
        await loadData();
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('User action error:', error);
      alert('오류가 발생했습니다');
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

  const handleCouponRateChange = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          action: 'updateCouponRate',
          rate: couponDropRate
        })
      });

      if (response.ok) {
        alert('쿠폰 드롭률이 업데이트되었습니다!');
      } else {
        const errorData = await response.json();
        alert(`오류: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Settings update error:', error);
      alert('오류가 발생했습니다');
    }
  };

  const handleDefaultCompletionsChange = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          action: 'updateDefaultCompletions',
          completions: defaultRequiredCompletions
        })
      });

      if (response.ok) {
        alert('기본 필요 완료 수가 업데이트되었습니다!');
      } else {
        const errorData = await response.json();
        alert(`오류: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Settings update error:', error);
      alert('오류가 발생했습니다');
    }
  };

  const activeWord = words.find(w => w.is_active);
  const totalUsers = users.length;
  const totalCoupons = coupons.length;
  const pendingCoupons = coupons.filter(c => c.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">관리자 패널 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/ycc_logo.png" alt="YCC 로고" className="h-12 w-12 rounded-lg shadow-sm" />
              <div>
                <h2 className="text-lg font-bold text-blue-600">YCC</h2>
                <p className="text-xs text-blue-500">루키즈</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-purple-600 flex items-center justify-center">
                <Shield className="h-6 w-6 mr-2" />
                관리자 패널
              </h1>
              <p className="text-sm text-gray-600">YCC/YCC 루키즈 동아리 박람회 보물찾기 관리</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Key className="h-4 w-4 mr-1" />
                비밀번호 변경
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  로그아웃
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Password Change Form */}
        {showPasswordChange && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-black">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              관리자 비밀번호 변경
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  placeholder="현재 비밀번호를 입력하세요"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label htmlFor="newAdminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 (최소 6자)
                </label>
                <input
                  id="newAdminPassword"
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={handlePasswordChange}
                disabled={!currentPassword || !newAdminPassword}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                비밀번호 변경
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setCurrentPassword('');
                  setNewAdminPassword('');
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-600">{totalUsers}</h3>
            <p className="text-sm text-gray-600">전체 사용자</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
              <Gift className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-yellow-600">{totalCoupons}</h3>
            <p className="text-sm text-gray-600">발급된 쿠폰</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <Gift className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600">{pendingCoupons}</h3>
            <p className="text-sm text-gray-600">대기 중인 쿠폰</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{activeWord?.word || '없음'}</h3>
            <p className="text-sm text-gray-600">현재 단어</p>
          </div>
        </div>

        {/* Current Game Status */}
        {activeWord && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">현재 게임 상태</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-700">현재 활성 단어: &quot;{activeWord.word}&quot;</h3>
                    <p className="text-sm text-gray-600">
                      진행상황: {activeWord.current_completions} / {defaultRequiredCompletions} 완료 
                      ({Math.round((activeWord.current_completions / defaultRequiredCompletions) * 100)}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((activeWord.current_completions / defaultRequiredCompletions) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.max(0, defaultRequiredCompletions - activeWord.current_completions)}명 더 필요
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'users', label: '사용자 & 통계', icon: Users },
                { id: 'coupons', label: '쿠폰', icon: Gift },
                { id: 'words', label: '단어 관리', icon: Plus },
                { id: 'settings', label: '설정', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 text-black">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">사용자 통계 & 관리</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">점수</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">쿠폰</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">완료된 단어</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-black">
                      {users.map((user) => (
                        <tr key={user.id} className={user.is_admin ? 'bg-purple-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                user.is_admin ? 'bg-purple-100' : 'bg-gray-100'
                              }`}>
                                {user.is_admin ? (
                                  <Shield className="h-4 w-4 text-purple-600" />
                                ) : (
                                  <Users className="h-4 w-4 text-gray-600" />
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.username}
                                  {user.is_admin ? <span className="ml-2 text-xs text-purple-600 font-bold">ADMIN</span> : null}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.total_points}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.total_coupons}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.words_completed}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(user.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {!user.is_admin && (
                              <>
                                {resetPasswordUserId === user.id ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="password"
                                      placeholder="새 비밀번호"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                                    />
                                    <button
                                      onClick={() => handleUserAction('resetPassword', user.id)}
                                      className="text-green-600 hover:text-green-900 text-xs"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={() => {
                                        setResetPasswordUserId(null);
                                        setNewPassword('');
                                      }}
                                      className="text-gray-600 hover:text-gray-900 text-xs"
                                    >
                                      취소
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setResetPasswordUserId(user.id)}
                                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      비밀번호 재설정
                                    </button>
                                    <button
                                      onClick={() => handleUserAction('delete', user.id)}
                                      className="text-red-600 hover:text-red-900 flex items-center"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      삭제
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Coupons Tab */}
            {activeTab === 'coupons' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">쿠폰 관리</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코드</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단어</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">확인일</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {coupons.map((coupon) => (
                        <tr key={coupon.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                            {coupon.coupon_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.word}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              coupon.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {coupon.status === 'confirmed' ? '확인됨' : '대기 중'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(coupon.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {coupon.confirmed_at ? formatDate(coupon.confirmed_at) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Words Tab */}
            {activeTab === 'words' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">단어 관리</h2>
                
                {/* Add New Word */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">새 단어 추가</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="새 단어를 입력하세요..."
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={() => handleWordAction('add')}
                      disabled={!newWord.trim()}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      단어 추가
                    </button>
                  </div>
                </div>


                {/* Words Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단어</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">진행상황</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {words.map((word) => (
                        <tr key={word.id} className={word.is_active ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {word.word}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              word.is_active 
                                ? 'bg-green-100 text-green-800'
                                : word.completed_at
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {word.is_active ? '활성' : word.completed_at ? '완료됨' : '준비됨'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {word.current_completions} / {defaultRequiredCompletions}
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    word.is_active ? 'bg-green-600' : word.completed_at ? 'bg-blue-600' : 'bg-gray-400'
                                  }`}
                                  style={{ 
                                    width: `${Math.min((word.current_completions / defaultRequiredCompletions) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(word.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {!word.is_active && (
                              <button
                                onClick={() => handleWordAction('activate', word.id)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                활성화
                              </button>
                            )}
                            {!word.is_active && !word.completed_at && (
                              <button
                                onClick={() => handleWordAction('remove', word.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                삭제
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">게임 설정</h2>
                
                {/* Coupon Drop Rate */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">쿠폰 드롭률</h3>
                      <p className="text-sm text-gray-600">플레이어가 성공적인 제출 후 쿠폰을 받을 확률</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-600">{couponDropRate}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="couponRate" className="block text-sm font-medium text-gray-700 mb-2">
                        드롭률 (0-100%)
                      </label>
                      <div className="flex items-center space-x-4 text-black">
                        <input
                          id="couponRate"
                          type="range"
                          min="0"
                          max="100"
                          value={couponDropRate}
                          onChange={(e) => setCouponDropRate(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={couponDropRate}
                          onChange={(e) => setCouponDropRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4">
                      <div className="text-sm text-gray-600">
                        <p>• 0%: 쿠폰 지급 안함</p>
                        <p>• 30%: 기본 설정 (권장)</p>
                        <p>• 100%: 매번 쿠폰 지급</p>
                      </div>
                      <button
                        onClick={handleCouponRateChange}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        설정 저장
                      </button>
                    </div>
                  </div>
                </div>

                {/* Default Required Completions */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">기본 필요 완료 수</h3>
                      <p className="text-sm text-gray-600">새로운 단어가 다음 단계로 진행하기 위해 필요한 기본 제출 수</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-600">{defaultRequiredCompletions}명</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="defaultCompletions" className="block text-sm font-medium text-gray-700 mb-2">
                        필요 완료 수 (1-20명)
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          id="defaultCompletions"
                          type="range"
                          min="1"
                          max="20"
                          value={defaultRequiredCompletions}
                          onChange={(e) => setDefaultRequiredCompletions(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={defaultRequiredCompletions}
                          onChange={(e) => setDefaultRequiredCompletions(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                        />
                        <span className="text-sm text-gray-500">명</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4">
                      <div className="text-sm text-gray-600">
                        <p>• 낮은 수: 빠른 진행, 더 많은 단어</p>
                        <p>• 높은 수: 모든 플레이어가 참여할 시간</p>
                        <p>• 기본값: 5명 (권장)</p>
                      </div>
                      <button
                        onClick={handleDefaultCompletionsChange}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        설정 저장
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}