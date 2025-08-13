import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '../../../lib/database';
import { requireAuth } from '../../../lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await requireAuth(request);

    // Get limit from query params (default 10)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get leaderboard data
    const leaderboard = await getLeaderboard(Math.min(limit, 50)); // Max 50 entries

    // Format leaderboard data
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      points: entry.total_points,
      wordsCompleted: entry.words_completed
    }));

    return NextResponse.json(formattedLeaderboard);

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }
    
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}