import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'Please provide an image file' }, { status: 400 });
    }

    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);
    const base64Image = imageBuffer.toString('base64');
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Analyze this medical image. Is this a chest X-ray showing normal lungs or signs of pneumonia? Provide a detailed explanation and a confidence score between 0 and 1." },
                {
                  inline_data: {
                    mime_type: imageFile.type,
                    data: base64Image
                  }
                }
              ]
            }]
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API returned ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let classification = { 
        condition: 'unknown',
        confidence: 0.5,
        explanation: textResponse
      };
      
      const lowerCaseResponse = textResponse.toLowerCase();
      
      if (lowerCaseResponse.includes('normal') && !lowerCaseResponse.includes('pneumonia')) {
        classification.condition = 'normal';
        const confidenceMatch = lowerCaseResponse.match(/confidence(?:\s+score)?(?:\s+of)?(?:\s*:)?\s*(?:is\s+)?([0-9]*\.?[0-9]+)/i);
        if (confidenceMatch) {
          classification.confidence = parseFloat(confidenceMatch[1]);
          if (classification.confidence > 1) {
            classification.confidence = classification.confidence / 100;
          }
        } else {
          classification.confidence = 0.85;
        }
      } else if (lowerCaseResponse.includes('pneumonia')) {
        classification.condition = 'pneumonia';
        const confidenceMatch = lowerCaseResponse.match(/confidence(?:\s+score)?(?:\s+of)?(?:\s*:)?\s*(?:is\s+)?([0-9]*\.?[0-9]+)/i);
        if (confidenceMatch) {
          classification.confidence = parseFloat(confidenceMatch[1]);
          if (classification.confidence > 1) {
            classification.confidence = classification.confidence / 100;
          }
        } else {
          classification.confidence = 0.85;
        }
      }
      
      const formattedResponse = [
        { label: 'normal', score: classification.condition === 'normal' ? classification.confidence : 1 - classification.confidence },
        { label: 'pneumonia', score: classification.condition === 'pneumonia' ? classification.confidence : 1 - classification.confidence }
      ];
      
      formattedResponse.sort((a, b) => b.score - a.score);
      
      const responseWithExplanation = {
        classifications: formattedResponse,
        explanation: textResponse,
        raw_response: data
      };
      
      return NextResponse.json(responseWithExplanation);
      
    } catch (error) {
      const mockData = [
        { label: 'normal', score: Math.random() < 0.5 ? 0.85 : 0.15 },
        { label: 'pneumonia', score: Math.random() < 0.5 ? 0.15 : 0.85 }
      ];
      
      mockData.sort((a, b) => b.score - a.score);
      
      return NextResponse.json({
        classifications: mockData,
        explanation: "This is mock data generated because the Gemini API request failed.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to analyze chest X-ray',
      message: error instanceof Error ? error.message : 'Unknown error',
      classifications: [
        { label: 'normal', score: 0.5 },
        { label: 'pneumonia', score: 0.5 }
      ]
    }, { status: 500 });
  }
}
