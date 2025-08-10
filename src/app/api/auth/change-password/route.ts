import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-utils';
import { getUserById, updateUserPassword } from '../../../lib/database';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);
    
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호가 필요합니다' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 최소 6자 이상이어야 합니다' },
        { status: 400 }
      );
    }

    // Get user from database to verify current password
    const user = await getUserById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await updateUserPassword(authUser.userId, newPasswordHash);

    return NextResponse.json({ 
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다' 
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}