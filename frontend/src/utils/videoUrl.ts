export type VideoSourceType = 'youtube' | 'gdrive' | 'hls' | 'direct';

export interface ParsedVideo {
  type: VideoSourceType;
  rawUrl: string;
  embedUrl?: string;
  directUrl?: string;
  videoId?: string;
  isIframe: boolean;
}

/**
 * Universal video URL parser supporting YouTube, Google Drive, HLS streams, and direct MP4/WebM files.
 */
export function parseVideoUrl(rawUrl?: string): ParsedVideo {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      type: 'direct',
      rawUrl: '',
      directUrl: '',
      isIframe: false
    };
  }

  const url = rawUrl.trim();
  if (!url) {
    return {
      type: 'direct',
      rawUrl: '',
      directUrl: '',
      isIframe: false
    };
  }

  // 1. YouTube Detection
  // Matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  const ytRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      rawUrl: url,
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`,
      isIframe: true
    };
  }

  // 2. Google Drive Detection
  // Matches:
  // - https://drive.google.com/file/d/FILE_ID/view...
  // - https://drive.google.com/file/d/FILE_ID/preview
  // - https://drive.google.com/file/d/FILE_ID/edit
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  // - https://docs.google.com/file/d/FILE_ID/preview
  const gdriveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]{20,})/i;
  const gdriveMatch = url.match(gdriveRegex);
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    return {
      type: 'gdrive',
      rawUrl: url,
      videoId: fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      isIframe: true
    };
  }

  // 3. HLS Streaming (.m3u8)
  if (url.includes('.m3u8') || url.includes('/api/v1/lms/stream/')) {
    return {
      type: 'hls',
      rawUrl: url,
      directUrl: url,
      isIframe: false
    };
  }

  // 4. Direct video (MP4, WebM, Cloudinary, S3, or relative /videos/...)
  return {
    type: 'direct',
    rawUrl: url,
    directUrl: url,
    isIframe: false
  };
}

/**
 * Returns human-readable label and color badge info for video sources.
 */
export function getVideoSourceBadge(type: VideoSourceType): { label: string; color: string; bg: string } {
  switch (type) {
    case 'youtube':
      return { label: 'YouTube Embed', color: '#dc2626', bg: '#fef2f2' };
    case 'gdrive':
      return { label: 'Google Drive Stream', color: '#2563eb', bg: '#eff6ff' };
    case 'hls':
      return { label: 'HLS Live Stream', color: '#7c3aed', bg: '#f5f3ff' };
    case 'direct':
    default:
      return { label: 'MP4 / Direct Video', color: '#16a34a', bg: '#f0fdf4' };
  }
}

