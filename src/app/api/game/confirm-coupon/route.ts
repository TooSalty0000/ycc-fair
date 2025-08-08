import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { confirmCoupon } from '../../../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const { couponId } = await request.json();

    if (!couponId) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    const success = await confirmCoupon(decoded.userId, couponId);

    if (!success) {
      return NextResponse.json(
        { error: 'Coupon not found or already confirmed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Coupon confirmed! You can now visit the booth to claim your prize.' 
    });

  } catch (error) {
    console.error('Confirm coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}