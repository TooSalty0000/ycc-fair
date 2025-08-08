import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserCoupons } from '../../../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const coupons = await getUserCoupons(decoded.userId);

    return NextResponse.json({ coupons });

  } catch (error) {
    console.error('User coupons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}