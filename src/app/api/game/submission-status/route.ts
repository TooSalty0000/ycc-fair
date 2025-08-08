import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getCurrentWord, hasUserSubmittedForWord } from '../../../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    // Get current word
    const currentWord = await getCurrentWord();
    if (!currentWord) {
      return NextResponse.json({ error: 'No active word found' }, { status: 404 });
    }

    // Check if user has already submitted for this word
    const hasSubmitted = await hasUserSubmittedForWord(decoded.userId, currentWord.id);

    return NextResponse.json({
      hasSubmitted,
      currentWord: {
        id: currentWord.id,
        word: currentWord.word,
        currentCompletions: currentWord.current_completions,
        requiredCompletions: currentWord.required_completions
      }
    });

  } catch (error) {
    console.error('Submission status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}