import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-utils';
import { getAllWords, addNewWord, removeWord, setActiveWord, updateWordRequiredCompletions } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const words = await getAllWords();
    return NextResponse.json({ words });

  } catch (error) {
    console.error('Admin words error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, wordId, word, requiredCompletions } = await request.json();

    switch (action) {
      case 'add':
        if (!word) {
          return NextResponse.json({ error: 'Word is required' }, { status: 400 });
        }
        const newWordId = await addNewWord(word.trim().toLowerCase());
        return NextResponse.json({ success: true, wordId: newWordId });

      case 'remove':
        if (!wordId) {
          return NextResponse.json({ error: 'Word ID is required' }, { status: 400 });
        }
        await removeWord(wordId);
        return NextResponse.json({ success: true });

      case 'activate':
        if (!wordId) {
          return NextResponse.json({ error: 'Word ID is required' }, { status: 400 });
        }
        await setActiveWord(wordId);
        return NextResponse.json({ success: true });

      case 'updateRequiredCompletions':
        if (!wordId || !requiredCompletions) {
          return NextResponse.json({ error: 'Word ID and required completions are required' }, { status: 400 });
        }
        await updateWordRequiredCompletions(wordId, requiredCompletions);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('Admin words action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}