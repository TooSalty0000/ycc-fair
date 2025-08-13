'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode, useState, useCallback } from 'react';
import { User, GameState, LeaderboardEntry, GameResult } from '../types';
import { authService } from '../lib/auth';

interface GameContextType {
  user: User | null;
  gameState: GameState;
  leaderboard: LeaderboardEntry[];
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  submitPhoto: (imageData: string) => Promise<GameResult | null>;
  refreshLeaderboard: () => Promise<void>;
  isLoading: boolean;
}

interface GameContextState {
  user: User | null;
  gameState: GameState;
  leaderboard: LeaderboardEntry[];
}

type GameAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'UPDATE_LEADERBOARD'; payload: LeaderboardEntry[] }
  | { type: 'UPDATE_USER_POINTS'; payload: { points: number; coupons: number } };

const initialState: GameContextState = {
  user: null,
  gameState: {
    currentKeyword: 'Loading...',
    totalSubmissions: 0,
    requiredSubmissions: 5,
    isActive: true,
    hasUserSubmitted: false,
  },
  leaderboard: [],
};

const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'UPDATE_LEADERBOARD':
      return { ...state, leaderboard: action.payload };
    case 'UPDATE_USER_POINTS':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentWord = useCallback(async () => {
    try {
      // Get word data and submission status in parallel
      const [wordData, submissionStatus] = await Promise.all([
        authService.getCurrentWord(),
        authService.getSubmissionStatus()
      ]);
      
      dispatch({ 
        type: 'UPDATE_GAME_STATE', 
        payload: {
          currentKeyword: wordData.word,
          totalSubmissions: wordData.totalSubmissions,
          requiredSubmissions: wordData.requiredSubmissions,
          isActive: wordData.isActive,
          hasUserSubmitted: submissionStatus.hasSubmitted
        }
      });
    } catch (error) {
      console.error('Failed to load current word:', error);
    }
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const leaderboardData = await authService.getLeaderboard(20);
      const formattedLeaderboard = leaderboardData.map((entry: { username: string; points: number; coupons: number }) => ({
        username: entry.username,
        points: entry.points,
        coupons: entry.coupons
      }));
      dispatch({ type: 'UPDATE_LEADERBOARD', payload: formattedLeaderboard });
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        await loadCurrentWord();
        await refreshLeaderboard();
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = await authService.login(username, password);
      
      // Load fresh user stats
      const userStats = await authService.getUserStats();
      const fullUser = {
        ...user,
        points: userStats.points,
        coupons: userStats.coupons
      };
      
      dispatch({ type: 'SET_USER', payload: fullUser });
      
      // Load game data
      await loadCurrentWord();
      await refreshLeaderboard();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다';
      return { success: false, error: errorMessage };
    }
  };


  const logout = () => {
    authService.logout();
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ 
      type: 'UPDATE_GAME_STATE', 
      payload: {
        currentKeyword: 'Loading...',
        totalSubmissions: 0,
        requiredSubmissions: 5,
        isActive: true,
        hasUserSubmitted: false,
      }
    });
    dispatch({ type: 'UPDATE_LEADERBOARD', payload: [] });
  };

  const submitPhoto = async (imageData: string): Promise<GameResult | null> => {
    if (!state.user) return null;

    try {
      const result = await authService.submitPhoto(imageData);
      
      if (result.success) {
        // Update user points locally
        dispatch({
          type: 'UPDATE_USER_POINTS',
          payload: {
            points: state.user.points + result.points,
            coupons: state.user.coupons + (result.token ? 1 : 0),
          },
        });

        // Update submission status immediately
        dispatch({
          type: 'UPDATE_GAME_STATE',
          payload: {
            ...state.gameState,
            hasUserSubmitted: true
          }
        });

        // Refresh leaderboard after successful submission
        setTimeout(refreshLeaderboard, 1000);

        // If word progressed, load new word (which will also update submission status)
        if (result.wordProgressed) {
          setTimeout(loadCurrentWord, 1000);
        }
      }

      return {
        success: result.success,
        points: result.points,
        token: result.token,
        message: result.message
      };

    } catch (error) {
      console.error('Photo submission failed:', error);
      return {
        success: false,
        points: 0,
        message: '사진 처리에 실패했습니다. 다시 시도해주세요.'
      };
    }
  };

  // Load current user and game state on mount
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for word changes every 10 seconds
  useEffect(() => {
    if (state.user) {
      const interval = setInterval(loadCurrentWord, 10000);
      return () => clearInterval(interval);
    }
  }, [state.user, loadCurrentWord]);

  // Poll for leaderboard changes every 30 seconds
  useEffect(() => {
    if (state.user) {
      const interval = setInterval(refreshLeaderboard, 30000);
      return () => clearInterval(interval);
    }
  }, [state.user, refreshLeaderboard]);

  return (
    <GameContext.Provider
      value={{
        user: state.user,
        gameState: state.gameState,
        leaderboard: state.leaderboard,
        login,
        logout,
        submitPhoto,
        refreshLeaderboard,
        isLoading,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame은 GameProvider 내에서 사용되어야 합니다');
  }
  return context;
};