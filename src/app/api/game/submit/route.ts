import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-utils';
import { getCurrentWord, createSubmission, addCoupon, checkWordCompletion, getDatabase, hasUserSubmittedForWord, isBoothOpen } from '../../../lib/database';
import { verifyImageWithGemini } from '../../../lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);
    
    // Prevent admin users from playing the game
    if (authUser.isAdmin) {
      return NextResponse.json(
        { error: '관리자 사용자는 게임을 할 수 없습니다' },
        { status: 403 }
      );
    }

    // Check if booth is open
    const boothOpen = await isBoothOpen();
    if (!boothOpen) {
      return NextResponse.json(
        { 
          success: false, 
          message: '부스 운영 시간이 아닙니다. 운영 시간 내에 다시 시도해주세요.' 
        },
        { status: 403 }
      );
    }
    
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다' },
        { status: 400 }
      );
    }

    // Get current word
    const currentWord = await getCurrentWord();
    if (!currentWord) {
      return NextResponse.json(
        { error: '활성 단어를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Check if user has already submitted for this word
    const hasSubmitted = await hasUserSubmittedForWord(authUser.userId, currentWord.id);
    if (hasSubmitted) {
      return NextResponse.json({
        success: false,
        points: 0,
        message: `이미 "${currentWord.word}"를 찾으셨습니다! 현재 단어를 시도해보세요.`,
        alreadySubmitted: true
      });
    }

    // Verify image with Gemini AI
    console.log(`Processing submission for word: ${currentWord.word}`);
    const aiResult = await verifyImageWithGemini(imageData, currentWord.word);
    console.log(`AI result:`, aiResult);
    
    if (!aiResult.success) {
      return NextResponse.json({
        success: false,
        points: 0,
        message: aiResult.message,
        isScreen: aiResult.isScreen,
        explanation: aiResult.explanation
      });
    }

    // Calculate points based on confidence
    const basePoints = 1;
    const bonusPoints = Math.floor(aiResult.confidence / 20);
    const totalPoints = basePoints + bonusPoints;
    
    // Get coupon drop rate from settings (default 30%)
    let couponDropRate = 30;
    try {
      const db = await getDatabase();
      const setting = await db.get('SELECT value FROM settings WHERE key = ?', 'coupon_drop_rate') as { value: string } | undefined;
      if (setting) {
        couponDropRate = parseInt(setting.value);
      }
    } catch (error) {
      console.error('Failed to get coupon drop rate:', error);
    }
    
    // Check if user gets a coupon based on drop rate
    const gotCoupon = Math.random() < (couponDropRate / 100);

    try {
      // Create submission record
      await createSubmission(
        authUser.userId,
        currentWord.id,
        currentWord.word,
        totalPoints,
        aiResult.confidence,
        // Don't store full image data to save space, just a hash or reference
        imageData.substring(0, 100) + '...'
      );

      // Add coupon if earned
      if (gotCoupon) {
        await addCoupon(authUser.userId, currentWord.word);
      }

      // Check if word should progress to next one
      const nextWord = await checkWordCompletion();
      
      return NextResponse.json({
        success: true,
        points: totalPoints,
        token: gotCoupon,
        message: `훌륭합니다! 사진에서 "${currentWord.word}"를 찾았습니다!`,
        confidence: aiResult.confidence,
        wordProgressed: !!nextWord,
        nextWord: nextWord ? nextWord.word : null
      });

    } catch (error: unknown) {
      console.error('Submission creation error:', error);
      return NextResponse.json(
        { error: '제출 처리 중 오류가 발생했습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }
    
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}