import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getUserById, isSessionValid } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface AuthUser {
  userId: number;
  username: string;
  isAdmin?: boolean;
  loginTime?: string;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return await verifyToken(token);
}

export async function requireAuth(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    throw new Error('Authentication required');
  }
  
  // Check if session is still valid after database resets
  if (authUser.loginTime && !(await isSessionValid(authUser.loginTime))) {
    throw new Error('Session expired due to database reset');
  }
  
  return authUser;
}

export async function getUserFromAuth(authUser: AuthUser) {
  return await getUserById(authUser.userId);
}