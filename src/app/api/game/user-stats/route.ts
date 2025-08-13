import { NextRequest, NextResponse } from 'next/server';
import { getUserStats } from '../../../lib/database';
import { requireAuth } from '../../../lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);

    // Get user stats
    const userStats = await getUserStats(authUser.userId);

    if (!userStats) {
      return NextResponse.json({
        id: authUser.userId,
        username: authUser.username,
        points: 0,
        coupons: 0,
        wordsCompleted: 0
      });
    }

    // Return formatted user stats
    return NextResponse.json({
      id: authUser.userId,
      username: userStats.username,
      points: userStats.total_points,
      coupons: userStats.total_coupons,
      wordsCompleted: userStats.words_completed,
      is_admin: authUser.isAdmin || false
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Session expired due to database reset') {
      return NextResponse.json(
        { error: 'SESSION_EXPIRED_RESET', message: '데이터베이스가 재설정되어 로그아웃됩니다' },
        { status: 401 }
      );
    }
    
    console.error('User stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}