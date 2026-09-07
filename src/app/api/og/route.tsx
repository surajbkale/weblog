import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters with fallbacks
    const title = searchParams.get('title')?.slice(0, 100) || 'Weblogs';
    const author = searchParams.get('author') || 'Anonymous';
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // Slate-900 to Indigo-950
            padding: '40px 80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Logo / Brand Mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)', // Blue-500 to Violet-500
              borderRadius: '50%',
              width: '100px',
              height: '100px',
              color: 'white',
              fontSize: 48,
              fontWeight: 800,
              marginBottom: '50px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            }}
          >
            W
          </div>
          
          {/* Post Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: '40px',
              maxWidth: '900px',
            }}
          >
            {title}
          </div>
          
          {/* Author info */}
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              color: '#94a3b8', // slate-400
              fontWeight: 500,
            }}
          >
            By {author}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
