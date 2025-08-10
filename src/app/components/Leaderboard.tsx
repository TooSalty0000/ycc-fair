'use client';

import { Trophy, Medal, Star } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

export default function Leaderboard() {
  const { leaderboard, user } = useGame();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-gray-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">순위표</h2>
        <div className="flex items-center text-sm text-gray-500">
          <Star className="h-4 w-4 mr-1" />
          실시간 순위
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">아직 플레이어가 없습니다. 첫 번째 점수를 얻어보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = user?.username === entry.username;
            
            return (
              <div
                key={entry.username}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  isCurrentUser 
                    ? 'border-indigo-300 bg-indigo-50' 
                    : rank <= 3 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    rank <= 3 ? getRankColor(rank) : 'bg-gray-100'
                  }`}>
                    {rank <= 3 ? (
                      <div className="text-white font-bold">
                        {getRankIcon(rank)}
                      </div>
                    ) : (
                      getRankIcon(rank)
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className={`font-medium ${
                        isCurrentUser ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            본인
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Trophy className="h-3 w-3 mr-1" />
                        {entry.points} 점
                      </span>
                    </div>
                  </div>
                </div>

                {rank <= 3 && (
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    rank === 1 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : rank === 2 
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rank === 1 ? '1위' : rank === 2 ? '2위' : '3위'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Current User Position (if not in top entries) */}
      {user && leaderboard.length > 0 && !leaderboard.slice(0, 10).find(entry => entry.username === user.username) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-700">
                  #{leaderboard.findIndex(entry => entry.username === user.username) + 1}
                </span>
              </div>
              <div>
                <p className="font-medium text-indigo-900">{user.username} (본인)</p>
                <div className="flex items-center space-x-3 text-xs text-indigo-700">
                  <span>{user.points} 점</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}