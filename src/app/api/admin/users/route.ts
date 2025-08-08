import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-utils';
import { deleteUser, resetUserPassword } from '../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, userId, newPassword } = await request.json();

    switch (action) {
      case 'delete':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        await deleteUser(userId);
        return NextResponse.json({ success: true, message: 'User deleted successfully' });

      case 'resetPassword':
        if (!userId || !newPassword) {
          return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 });
        }
        if (newPassword.length < 6) {
          return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }
        await resetUserPassword(userId, newPassword);
        return NextResponse.json({ success: true, message: 'Password reset successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('Admin user action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}