'use client';

import { useState } from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import LoginForm from './components/LoginForm';
import GameInterface from './components/GameInterface';
import Leaderboard from './components/Leaderboard';
import AdminPage from './components/AdminPage';

function AppContent() {
  const { user, isLoading, logout } = useGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Admin users should only see admin panel, not the game
  if (user.isAdmin) {
    if (showAdminPanel) {
      return <AdminPage onBack={() => setShowAdminPanel(false)} onLogout={logout} />;
    }
    // Default admin view - show admin panel directly
    return <AdminPage onBack={() => {}} onLogout={logout} />;
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Game
            </button>
          </div>
          <Leaderboard />
        </div>
      </div>
    );
  }

  return <GameInterface />;
}

export default function Home() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
