import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-utils';
import { getBoothHours, isBoothOpen } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await requireAuth(request);

    // Get user's timezone from headers or use default
    const userTimezone = request.headers.get('x-timezone') || undefined;

    // Get booth operating hours and current status
    const boothHours = await getBoothHours();
    const isOpen = await isBoothOpen(userTimezone);

    return NextResponse.json({
      isOpen,
      openTime: boothHours.openTime,
      closeTime: boothHours.closeTime,
      currentTime: new Date().toISOString(),
      timezone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
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
    
    console.error('Booth status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}