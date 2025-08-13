import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-utils';
import { getAllWords, addNewWord, removeWord, setActiveWord, bulkAddWords, bulkReplaceWords, manualNextWord, clearAllData, resetWordCycle } from '../../../lib/database';

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

    const { action, wordId, word, words } = await request.json();

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

      case 'bulk_add':
        if (!words || !Array.isArray(words) || words.length === 0) {
          return NextResponse.json({ error: 'Words array is required' }, { status: 400 });
        }
        const addedCount = await bulkAddWords(words);
        return NextResponse.json({ success: true, addedCount, message: `${addedCount}개의 단어가 추가되었습니다` });

      case 'bulk_replace':
        if (!words || !Array.isArray(words) || words.length === 0) {
          return NextResponse.json({ error: 'Words array is required' }, { status: 400 });
        }
        const replacedCount = await bulkReplaceWords(words);
        return NextResponse.json({ success: true, replacedCount, message: `모든 단어가 교체되었습니다 (${replacedCount}개)` });

      case 'next_word':
        const nextWord = await manualNextWord();
        return NextResponse.json({ success: true, nextWord: nextWord?.word || null, message: '다음 단어로 변경되었습니다' });

      case 'clear_all':
        await clearAllData();
        return NextResponse.json({ success: true, message: '모든 데이터가 삭제되었습니다' });

      case 'reset_cycle':
        const cycleResetWord = await resetWordCycle();
        return NextResponse.json({ 
          success: true, 
          currentWord: cycleResetWord?.word || null,
          message: '단어 순환이 재설정되었습니다. 모든 단어를 다시 사용할 수 있습니다.' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('Admin words action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}