import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByUsername, createUser } from '../../../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '사용자명과 비밀번호가 필요합니다' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: '사용자명은 최소 3자 이상이어야 합니다' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 사용자명입니다' },
        { status: 409 }
      );
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await createUser(username, passwordHash);
    
    const user = {
      id: userId,
      username,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      is_admin: false
    };

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        isAdmin: user.is_admin || false
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (excluding password hash)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        points: 0,
        is_admin: user.is_admin || false,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '내부 서버 오류' },
      { status: 500 }
    );
  }
}