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
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Find user in database
    let user = await getUserByUsername(username);
    let isNewUser = false;

    if (!user) {
      // User doesn't exist, create new account
      const passwordHash = await bcrypt.hash(password, 12);
      const userId = await createUser(username, passwordHash);
      
      user = {
        id: userId,
        username,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };
      
      isNewUser = true;
    } else {
      // User exists, verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Wrong password for existing username' },
          { status: 401 }
        );
      }
    }

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
    const userData = {
      id: user.id,
      username: user.username,
      created_at: user.created_at,
      isNewUser,
      isAdmin: user.is_admin || false,
      token
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}