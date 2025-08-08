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
        tokens: 0,
        wordsCompleted: 0
      });
    }

    // Return formatted user stats
    return NextResponse.json({
      id: authUser.userId,
      username: userStats.username,
      points: userStats.total_points,
      tokens: userStats.total_tokens,
      wordsCompleted: userStats.words_completed,
      is_admin: authUser.isAdmin || false
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
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