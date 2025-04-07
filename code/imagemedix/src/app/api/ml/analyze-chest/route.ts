import { NextRequest, NextResponse } from 'next/server';

// Set CORS headers for the preflight request
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
  console.log('API route: Received chest X-ray analysis request');
  
  try {
    // Get Google API key from environment variables
    // Note: In Next.js, environment variables that should be accessible client-side 
    // should be prefixed with NEXT_PUBLIC_
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    
    if (!GOOGLE_API_KEY) {
      console.error('API route: NEXT_PUBLIC_GOOGLE_API_KEY not set in environment variables');
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    // Get the image data from the request
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'Please provide an image file' }, { status: 400 });
    }

    console.log(`API route: Image file received: ${imageFile.name}, ${imageFile.size} bytes, type ${imageFile.type}`);

    // Read the file as an ArrayBuffer and convert to base64
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('API route: File converted to base64, preparing to send to Gemini API');
    
    try {
      // Forward the request to Google Gemini API
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

      console.log('API route: Received response from Gemini API, status:', response.status);
      
      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API route: Gemini API error response:', errorData);
        throw new Error(`Gemini API returned ${response.status}: ${errorData}`);
      }

      // Parse the response from Gemini
      const data = await response.json();
      console.log('API route: Successfully parsed Gemini response data');
      
      // Extract the text response
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Process the text response to extract classification
      let classification = { 
        condition: 'unknown',
        confidence: 0.5,
        explanation: textResponse
      };
      
      // Check for keywords in the response to determine classification
      const lowerCaseResponse = textResponse.toLowerCase();
      
      if (lowerCaseResponse.includes('normal') && !lowerCaseResponse.includes('pneumonia')) {
        classification.condition = 'normal';
        // Try to extract confidence score if mentioned
        const confidenceMatch = lowerCaseResponse.match(/confidence(?:\s+score)?(?:\s+of)?(?:\s+is)?(?:\s*:)?\s*(?:is\s+)?([0-9]*\.?[0-9]+)/i);
        if (confidenceMatch) {
          classification.confidence = parseFloat(confidenceMatch[1]);
          // Ensure confidence is between 0 and 1
          if (classification.confidence > 1) {
            classification.confidence = classification.confidence / 100;
          }
        } else {
          // If no confidence explicitly stated, use a high default for definitive statements
          classification.confidence = 0.85;
        }
      } else if (lowerCaseResponse.includes('pneumonia')) {
        classification.condition = 'pneumonia';
        // Try to extract confidence score if mentioned
        const confidenceMatch = lowerCaseResponse.match(/confidence(?:\s+score)?(?:\s+of)?(?:\s*:)?\s*(?:is\s+)?([0-9]*\.?[0-9]+)/i);
        if (confidenceMatch) {
          classification.confidence = parseFloat(confidenceMatch[1]);
          // Ensure confidence is between 0 and 1
          if (classification.confidence > 1) {
            classification.confidence = classification.confidence / 100;
          }
        } else {
          // If no confidence explicitly stated, use a high default for definitive statements
          classification.confidence = 0.85;
        }
      }
      
      // Format the response to match the expected format from the original HuggingFace API
      const formattedResponse = [
        { label: 'normal', score: classification.condition === 'normal' ? classification.confidence : 1 - classification.confidence },
        { label: 'pneumonia', score: classification.condition === 'pneumonia' ? classification.confidence : 1 - classification.confidence }
      ];
      
      // Sort to make highest probability first
      formattedResponse.sort((a, b) => b.score - a.score);
      
      // Add the full text explanation in a way that doesn't break the expected format
      const responseWithExplanation = {
        classifications: formattedResponse,
        explanation: textResponse,
        raw_response: data
      };
      
      return NextResponse.json(responseWithExplanation);
      
    } catch (error) {
      console.error('API route: Error from Gemini API:', error);
      
      // If Gemini API is not available, return mock data
      console.log('API route: Using mock data due to API error');
      
      // Create mock data that simulates the expected response format
      const mockData = [
        { label: 'normal', score: Math.random() < 0.5 ? 0.85 : 0.15 },
        { label: 'pneumonia', score: Math.random() < 0.5 ? 0.15 : 0.85 }
      ];
      
      // Sort to make highest probability first
      mockData.sort((a, b) => b.score - a.score);
      
      return NextResponse.json({
        classifications: mockData,
        explanation: "This is mock data generated because the Gemini API request failed.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('API route: Unhandled error in API route:', error);
    
    // Always return a valid response, even in case of errors
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