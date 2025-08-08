import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWord } from '../../../lib/database';
import { requireAuth } from '../../../lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await requireAuth(request);

    // Get current word
    const currentWord = await getCurrentWord();

    if (!currentWord) {
      return NextResponse.json(
        { error: 'No active word found' },
        { status: 404 }
      );
    }

    // Return word data without revealing completion count details
    return NextResponse.json({
      id: currentWord.id,
      word: currentWord.word,
      progress: Math.min(currentWord.current_completions / currentWord.required_completions, 1),
      totalSubmissions: currentWord.current_completions,
      requiredSubmissions: currentWord.required_completions,
      isActive: true
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.error('Current word error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}