export interface User {
  id: string;
  username: string;
  points: number;
  tokens: number;
  isLoggedIn: boolean;
  isAdmin?: boolean;
}

export interface GameState {
  currentKeyword: string;
  totalSubmissions: number;
  requiredSubmissions: number;
  isActive: boolean;
  hasUserSubmitted: boolean;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  tokens: number;
}

export interface CameraProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export interface GameResult {
  success: boolean;
  points: number;
  token?: boolean;
  message: string;
}