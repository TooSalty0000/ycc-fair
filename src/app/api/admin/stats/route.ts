import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-utils';
import { getAllUsersStats, getAllCouponsForAdmin } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    // Check if user is admin
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [usersStats, allCoupons] = await Promise.all([
      getAllUsersStats(),
      getAllCouponsForAdmin()
    ]);

    return NextResponse.json({
      users: usersStats,
      coupons: allCoupons
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}