import { User } from '../types';

interface LoginResponse {
  id: number;
  username: string;
  created_at: string;
  token: string;
  isAdmin?: boolean;
}

// Removed unused AuthError interface

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` })
    };
  }


  async login(username: string, password: string): Promise<User> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token
    this.token = data.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
    }

    return this.convertToUser(data);
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch('/api/game/user-stats', {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        // Token might be expired
        this.logout();
        return null;
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        username: data.username,
        points: data.points,
        tokens: data.tokens,
        isLoggedIn: true,
        isAdmin: data.is_admin || false
      };
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      return null;
    }
  }

  logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private convertToUser(data: LoginResponse): User {
    return {
      id: data.id.toString(),
      username: data.username,
      points: 0, // Will be loaded separately
      tokens: 0, // Will be loaded separately
      isLoggedIn: true,
      isAdmin: data.isAdmin || false
    };
  }

  async getCurrentWord() {
    const response = await fetch('/api/game/current-word', {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get current word');
    }

    return await response.json();
  }

  async submitPhoto(imageData: string) {
    const response = await fetch('/api/game/submit', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ imageData })
    });

    if (!response.ok) {
      throw new Error('Failed to submit photo');
    }

    return await response.json();
  }

  async getLeaderboard(limit: number = 10) {
    const response = await fetch(`/api/game/leaderboard?limit=${limit}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get leaderboard');
    }

    return await response.json();
  }

  async getUserStats() {
    const response = await fetch('/api/game/user-stats', {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get user stats');
    }

    return await response.json();
  }

  async getSubmissionStatus() {
    const response = await fetch('/api/game/submission-status', {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get submission status');
    }

    return await response.json();
  }
}

export const authService = new AuthService();