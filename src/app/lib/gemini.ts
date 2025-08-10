import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface ImageVerificationResult {
  success: boolean;
  confidence: number;
  message: string;
  isScreen: boolean;
  explanation?: string;
}

// Convert base64 image to the format Gemini expects
const base64ToGenerativeAIPart = (base64Image: string, mimeType: string) => {
  // Remove data:image/jpeg;base64, prefix if it exists
  const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };
};

export const verifyImageWithGemini = async (
  imageData: string, 
  keyword: string
): Promise<ImageVerificationResult> => {
  try {
    // Check if API key is available
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.error('Gemini API key not found');
      throw new Error('AI verification service not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Determine MIME type from base64 data
    const mimeType = imageData.match(/^data:image\/([a-z]+);base64,/)?.[1] || 'jpeg';
    const fullMimeType = `image/${mimeType}`;

    // Check image size and log for debugging
    const base64Length = imageData.length;
    const imageSizeKB = Math.round((base64Length * 0.75) / 1024);
    console.log(`Processing image: ${imageSizeKB}KB, keyword: ${keyword}`);

    // Warn if image is very large (might cause timeout)
    if (imageSizeKB > 4000) {
      console.warn(`Large image detected: ${imageSizeKB}KB - this might cause processing delays`);
    }

    const imagePart = base64ToGenerativeAIPart(imageData, fullMimeType);

    const prompt = `
You are an image verification system for a photo scavenger hunt game. Your task is to:

1. Determine if the image contains or represents the keyword: "${keyword}"
2. Detect if the image appears to be taken of a screen (phone, computer, tablet, etc.) to prevent cheating

ANTI-CHEATING DETECTION:
- Look for signs that this photo was taken of another screen/device:
  - Screen glare, reflections, or pixelation typical of digital displays
  - Visible screen bezels, frames, or device edges
  - Image appears to be a screenshot or photo of a screen
  - Unnatural lighting that suggests backlit display
  - Moiré patterns or screen door effects
  - Browser UI elements, app interfaces, or digital watermarks
  - Image quality that suggests it's a photo of a photo/screen

KEYWORD VERIFICATION:
- The image should contain the actual object, concept, or scene related to "${keyword}"
- Look for real-world, physical manifestations of the keyword
- The keyword can be represented directly or conceptually
- Be reasonably flexible but maintain accuracy

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "success": boolean (true if keyword is present AND image is not from a screen),
  "confidence": number (0-100, your confidence in the verification),
  "isScreen": boolean (true if image appears to be taken of a screen),
  "explanation": "Brief explanation of your decision"
}

Analyze this image:`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedResult: {
      success?: boolean;
      confidence?: number;
      isScreen?: boolean;
      explanation?: string;
    };
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.error('Failed to parse Gemini response:', text);
      // Fallback parsing for cases where JSON is not properly formatted
      return {
        success: false,
        confidence: 0,
        message: 'Error parsing AI response. Please try again.',
        isScreen: false,
        explanation: 'Unable to process image verification response.'
      };
    }

    // Validate and format the result
    const isScreen = parsedResult.isScreen || false;
    const keywordMatch = parsedResult.success || false;
    const confidence = Math.min(Math.max(parsedResult.confidence || 0, 0), 100);

    // Final success determination
    const finalSuccess = keywordMatch && !isScreen;

    let message = '';
    if (isScreen) {
      message = 'Photo appears to be taken of a screen. Please take a photo of the real object!';
    } else if (!keywordMatch) {
      message = `This image doesn't appear to contain "${keyword}". Try again!`;
    } else {
      message = `Great! Found "${keyword}" in your photo!`;
    }

    return {
      success: finalSuccess,
      confidence,
      message,
      isScreen,
      explanation: parsedResult.explanation || 'AI verification completed.'
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      confidence: 0,
      message: 'AI verification service is temporarily unavailable. Please try again.',
      isScreen: false,
      explanation: 'Service error occurred during verification.'
    };
  }
};

// Alternative verification function for testing/fallback
export const verifyImageFallback = async (
  imageData: string, 
  keyword: string
): Promise<ImageVerificationResult> => {
  // This is a fallback function that can be used for testing
  // or when Gemini API is not available
  console.log('Using fallback verification for:', keyword);
  
  // Simple random success for testing
  const success = Math.random() > 0.3; // 70% success rate for testing
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-100% confidence
  
  return {
    success,
    confidence,
    message: success 
      ? `Great! Found "${keyword}" in your photo!` 
      : `This image doesn't appear to contain "${keyword}". Try again!`,
    isScreen: false,
    explanation: 'Fallback verification used (for testing purposes).'
  };
};

// Health check for Gemini API
export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hello, respond with "OK"');
    const response = await result.response;
    const text = response.text();
    return text.toLowerCase().includes('ok');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
};