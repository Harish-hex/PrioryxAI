import { NextRequest, NextResponse } from 'next/server'

// Trusted channels to boost in results
const TRUSTED_CHANNELS = [
  'freecodecamp', 'traversy media', 'programming with mosh',
  'neetcode', 'techworld with nana', 'fireship', 'web dev simplified',
  'cs dojo', 'clever programmer', 'academind', 'kevin powell',
  'developedbyed', 'hitesh choudhary'
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const API_KEY = process.env.YOUTUBE_API_KEY
    if (!API_KEY) {
      return NextResponse.json({ error: 'YouTube API key is missing' }, { status: 500 })
    }

    // Enhance query for better tech/coding results
    const enhancedQuery = `${query} (tutorial OR course OR complete) -shorts`
    
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('q', enhancedQuery)
    url.searchParams.set('type', 'video')
    url.searchParams.set('videoDuration', 'medium') // Filter out shorts
    url.searchParams.set('maxResults', '15')
    url.searchParams.set('key', API_KEY)
    
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 } // cache for 1 hour
    })
    
    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`)
    }

    const data = await response.json()
    
    // Transform and sort results
    let videos = data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      duration: 'Video', // YouTube Search API doesn't return duration directly here
      views: 'Popular',
      isTrusted: TRUSTED_CHANNELS.some(c => 
        item.snippet.channelTitle.toLowerCase().includes(c)
      )
    }))

    // Sort: Trusted channels first
    videos = videos.sort((a: any, b: any) => {
      if (a.isTrusted && !b.isTrusted) return -1;
      if (!a.isTrusted && b.isTrusted) return 1;
      return 0;
    })

    return NextResponse.json({ videos: videos.slice(0, 12) })

  } catch (error: any) {
    console.error('YouTube Search Error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
