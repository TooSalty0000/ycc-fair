import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, setBoothHours, getBoothHours } from '../../../lib/database';
import { requireAuth } from '../../../lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    // Check if user is admin
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const db = await getDatabase();

    const { action, rate, completions, openTime, closeTime } = await request.json();

    if (action === 'updateCouponRate') {
      if (typeof rate !== 'number' || rate < 0 || rate > 100) {
        return NextResponse.json({ error: '드롭률은 0-100 사이의 숫자여야 합니다' }, { status: 400 });
      }


      // Update coupon drop rate
      await db.run(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES ('coupon_drop_rate', ?, CURRENT_TIMESTAMP)
      `, rate.toString());

      return NextResponse.json({ 
        success: true, 
        message: '쿠폰 드롭률이 업데이트되었습니다',
        rate 
      });
    }

    if (action === 'updateDefaultCompletions') {
      if (typeof completions !== 'number' || completions < 1 || completions > 20) {
        return NextResponse.json({ error: '필요 완료 수는 1-20 사이의 숫자여야 합니다' }, { status: 400 });
      }

      // Update default required completions
      await db.run(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES ('default_required_completions', ?, CURRENT_TIMESTAMP)
      `, completions.toString());

      return NextResponse.json({ 
        success: true, 
        message: '기본 필요 완료 수가 업데이트되었습니다',
        completions 
      });
    }

    if (action === 'updateBoothHours') {
      if (!openTime || !closeTime) {
        return NextResponse.json({ error: '개장 시간과 폐장 시간이 필요합니다' }, { status: 400 });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(openTime) || !timeRegex.test(closeTime)) {
        return NextResponse.json({ error: '시간 형식이 올바르지 않습니다 (HH:MM)' }, { status: 400 });
      }

      await setBoothHours(openTime, closeTime);

      return NextResponse.json({ 
        success: true, 
        message: '부스 운영 시간이 업데이트되었습니다',
        openTime, 
        closeTime 
      });
    }

    return NextResponse.json({ error: '알 수 없는 작업입니다' }, { status: 400 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }
    
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    // Check if user is admin
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    const db = await getDatabase();

    // Get current settings
    const couponRateSetting = await db.get('SELECT value FROM settings WHERE key = ?', 'coupon_drop_rate') as { value: string } | undefined;
    const completionsSetting = await db.get('SELECT value FROM settings WHERE key = ?', 'default_required_completions') as { value: string } | undefined;
    
    const couponDropRate = couponRateSetting ? parseInt(couponRateSetting.value) : 30; // Default to 30%
    const defaultRequiredCompletions = completionsSetting ? parseInt(completionsSetting.value) : 5; // Default to 5
    
    // Get booth hours
    const boothHours = await getBoothHours();

    return NextResponse.json({
      coupon_drop_rate: couponDropRate,
      default_required_completions: defaultRequiredCompletions,
      booth_open_time: boothHours.openTime,
      booth_close_time: boothHours.closeTime
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }
    
    console.error('Settings GET API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}