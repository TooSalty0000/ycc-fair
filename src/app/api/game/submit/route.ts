import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-utils';
import { getCurrentWord, createSubmission, addCoupon, checkWordCompletion } from '../../../lib/database';
import { verifyImageWithGemini } from '../../../lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);
    
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Get current word
    const currentWord = await getCurrentWord();
    if (!currentWord) {
      return NextResponse.json(
        { error: 'No active word found' },
        { status: 404 }
      );
    }

    // Verify image with Gemini AI
    const aiResult = await verifyImageWithGemini(imageData, currentWord.word);
    
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
    
    // 30% chance for coupon
    const gotCoupon = Math.random() < 0.3;

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
        message: `Great! Found "${currentWord.word}" in your photo!`,
        confidence: aiResult.confidence,
        wordProgressed: !!nextWord,
        nextWord: nextWord ? nextWord.word : null
      });

    } catch (error: unknown) {
      const submitError = error as { message?: string };
      if (submitError.message === 'Already submitted for this word') {
        return NextResponse.json({
          success: false,
          points: 0,
          message: `You've already found "${currentWord.word}"! Try the current word.`,
          alreadySubmitted: true
        });
      }
      throw error;
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
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