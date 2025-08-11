import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserById } from '../../../lib/database';
import { AuthUser } from '../../../lib/auth-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      
      // Get fresh user data from database
      const user = await getUserById(decoded.userId);
      
      if (!user) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다' },
          { status: 404 }
        );
      }

      // Return user data (excluding password hash)
      return NextResponse.json({
        id: user.id,
        username: user.username,
        points: user.points || 0,
        is_admin: user.is_admin || false,
        created_at: user.created_at,
        last_active: user.last_active
      });

    } catch (jwtError) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: '내부 서버 오류' },
      { status: 500 }
    );
  }
}