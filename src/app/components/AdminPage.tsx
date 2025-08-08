'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Gift, 
  Settings, 
  Plus, 
  Trash2, 
  Play, 
  RotateCcw,
  Shield,
  Calendar,
  Trophy
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
  required_completions: number;
}

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserStat[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [newRequiredCompletions, setNewRequiredCompletions] = useState(5);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsResponse, wordsResponse] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }),
        fetch('/api/admin/words', {
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
          requiredCompletions: requiredCompletions || newRequiredCompletions
        })
      });

      if (response.ok) {
        setNewWord('');
        await loadData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Word action error:', error);
      alert('An error occurred');
    }
  };

  const handleUserAction = async (action: string, userId: number) => {
    if (action === 'delete' && !confirm('Are you sure you want to delete this user? This will also delete all their submissions and coupons.')) {
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
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('User action error:', error);
      alert('An error occurred');
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

  const activeWord = words.find(w => w.is_active);
  const totalUsers = users.length;
  const totalCoupons = coupons.length;
  const pendingCoupons = coupons.filter(c => c.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
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
            <button
              onClick={onBack}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Game
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-purple-600 flex items-center">
                <Shield className="h-6 w-6 mr-2" />
                Admin Panel
              </h1>
              <p className="text-sm text-gray-600">YCC Fair Hunt Management</p>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-600">{totalUsers}</h3>
            <p className="text-sm text-gray-600">Total Users</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
              <Gift className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-yellow-600">{totalCoupons}</h3>
            <p className="text-sm text-gray-600">Total Coupons</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-600">{pendingCoupons}</h3>
            <p className="text-sm text-gray-600">Pending Coupons</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{activeWord?.word || 'None'}</h3>
            <p className="text-sm text-gray-600">Current Word</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'users', label: 'Users & Stats', icon: Users },
                { id: 'coupons', label: 'Coupons', icon: Gift },
                { id: 'words', label: 'Word Management', icon: Settings }
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

          <div className="p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">User Statistics & Management</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupons</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Words Completed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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
                                      placeholder="New password"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                                    />
                                    <button
                                      onClick={() => handleUserAction('resetPassword', user.id)}
                                      className="text-green-600 hover:text-green-900 text-xs"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setResetPasswordUserId(null);
                                        setNewPassword('');
                                      }}
                                      className="text-gray-600 hover:text-gray-900 text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setResetPasswordUserId(user.id)}
                                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Reset Password
                                    </button>
                                    <button
                                      onClick={() => handleUserAction('delete', user.id)}
                                      className="text-red-600 hover:text-red-900 flex items-center"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
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
                <h2 className="text-xl font-semibold mb-4">Coupon Management</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmed</th>
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
                              {coupon.status}
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
                <h2 className="text-xl font-semibold mb-4">Word Management</h2>
                
                {/* Add New Word */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Word</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Enter new word..."
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
                      Add Word
                    </button>
                  </div>
                </div>

                {/* Current Active Word */}
                {activeWord && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-green-900 mb-2">Current Active Word</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-green-700">{activeWord.word}</p>
                        <p className="text-sm text-green-600">
                          Requires {activeWord.required_completions} completions to advance
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newRequiredCompletions}
                          onChange={(e) => setNewRequiredCompletions(parseInt(e.target.value) || 5)}
                          min="1"
                          max="20"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => handleWordAction('updateRequiredCompletions', activeWord.id)}
                          className="text-sm text-purple-600 hover:text-purple-900"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Words Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                              {word.is_active ? 'Active' : word.completed_at ? 'Completed' : 'Ready'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {word.required_completions}
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
                                Activate
                              </button>
                            )}
                            {!word.is_active && !word.completed_at && (
                              <button
                                onClick={() => handleWordAction('remove', word.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
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
          </div>
        </div>
      </main>
    </div>
  );
}