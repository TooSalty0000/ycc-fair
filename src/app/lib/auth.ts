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

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Check for session expiration due to database reset
      if (errorData.error === 'SESSION_EXPIRED_RESET') {
        console.log('Session expired due to database reset - logging out');
        this.logout();
        // Reload the page to force re-login
        if (typeof window !== 'undefined') {
          alert('데이터베이스가 재설정되어 자동으로 로그아웃됩니다.');
          window.location.reload();
        }
        throw new Error('Session expired');
      }
      
      throw new Error(errorData.message || 'Request failed');
    }
    return response;
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

      await this.handleResponse(response);

      const data = await response.json();
      return {
        id: data.id.toString(),
        username: data.username,
        points: data.points,
        coupons: data.coupons,
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
      coupons: 0, // Will be loaded separately
      isLoggedIn: true,
      isAdmin: data.isAdmin || false
    };
  }

  async getCurrentWord() {
    const response = await fetch('/api/game/current-word', {
      headers: this.getAuthHeaders()
    });

    await this.handleResponse(response);
    return await response.json();
  }

  async submitPhoto(imageData: string) {
    const response = await fetch('/api/game/submit', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ imageData })
    });

    await this.handleResponse(response);
    return await response.json();
  }

  async getLeaderboard(limit: number = 10) {
    const response = await fetch(`/api/game/leaderboard?limit=${limit}`, {
      headers: this.getAuthHeaders()
    });

    await this.handleResponse(response);
    return await response.json();
  }

  async getUserStats() {
    const response = await fetch('/api/game/user-stats', {
      headers: this.getAuthHeaders()
    });

    await this.handleResponse(response);
    return await response.json();
  }

  async getSubmissionStatus() {
    const response = await fetch('/api/game/submission-status', {
      headers: this.getAuthHeaders()
    });

    await this.handleResponse(response);
    return await response.json();
  }
}

export const authService = new AuthService();