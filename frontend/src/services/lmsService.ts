import { apiClient } from './apiClient';

export interface PlaybackTokenResponse {
  success: boolean;
  playbackToken?: string;
  sessionId?: string;
  expiresIn?: number;
  watermark?: {
    text: string;
    studentId: string;
  };
  message?: string;
  code?: string;
}

export interface ProgressUpdatePayload {
  courseId: string;
  lectureId: string;
  videoId?: string;
  positionSeconds: number;
  durationSeconds: number;
}

export interface CourseProgressMap {
  [lectureId: string]: {
    lastPosition: number;
    duration: number;
    percentage: number;
    isCompleted: boolean;
  };
}

export interface VideoAsset {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  sectionId?: string;
  lectureId?: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  transcodeProgress: number;
  durationSeconds: number;
  fileSizeBytes: number;
  masterPlaylistUrl: string;
  isFreePreview: boolean;
  notesPdfUrl?: string;
  createdAt: string;
}

// Generate or retrieve persistent browser device fingerprint
export const getDeviceFingerprint = (): string => {
  let fp = localStorage.getItem('dk_device_fingerprint');
  if (!fp) {
    fp = `dev_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
    localStorage.setItem('dk_device_fingerprint', fp);
  }
  return fp;
};

export const lmsService = {
  // 1. Request Short-Lived Playback Permission & Token
  async getPlaybackToken(courseId: string, lectureId: string, videoId?: string): Promise<PlaybackTokenResponse> {
    const deviceFingerprint = getDeviceFingerprint();
    return await apiClient.post<PlaybackTokenResponse>('/lms/playback-token', {
      courseId,
      lectureId,
      videoId,
      deviceFingerprint
    });
  },

  // 2. Playback Session Heartbeat (Feature D)
  async sendHeartbeat(sessionId: string): Promise<{ success: boolean; active?: boolean; revoked?: boolean; reason?: string }> {
    const deviceFingerprint = getDeviceFingerprint();
    return await apiClient.post('/lms/session/heartbeat', {
      sessionId,
      deviceFingerprint
    });
  },

  // 3. Update Learning Watch Progress (Feature E)
  async updateProgress(payload: ProgressUpdatePayload): Promise<any> {
    return await apiClient.post('/lms/progress/update', payload);
  },

  // 4. Get Student's Progress for All Lectures in Course
  async getCourseProgress(courseId: string): Promise<{ success: boolean; data?: CourseProgressMap }> {
    return await apiClient.get<CourseProgressMap>(`/lms/progress/${courseId}`);
  },

  // 5. Check Transcoding Status
  async getVideoStatus(videoId: string): Promise<any> {
    return await apiClient.get(`/lms/videos/${videoId}/status`);
  },

  // 6. List Videos for Admin Dashboard
  async getVideos(courseId?: string): Promise<{ success: boolean; data?: VideoAsset[] }> {
    const q = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
    return await apiClient.get<VideoAsset[]>(`/lms/videos${q}`);
  },

  // 7. Multipart Video Upload with real-time progress callback
  uploadVideoWithProgress(
    formData: FormData,
    onProgress: (percent: number) => void
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const tokenSession =
        localStorage.getItem('dk_academy_admin_session_v1') ||
        localStorage.getItem('dk_academy_admin_session') ||
        localStorage.getItem('dk_academy_student_session');

      let token = '';
      if (tokenSession) {
        try {
          token = JSON.parse(tokenSession).token;
        } catch (_) {}
      }

      xhr.open('POST', `${apiClient.baseUrl}/lms/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            resolve({ success: false, message: response.message || 'Upload failed' });
          }
        } catch (e: any) {
          resolve({ success: false, message: 'Server response parsing failed' });
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during video upload'));
      };

      xhr.send(formData);
    });
  },

  // 8. Resumable Chunk Upload (tus/resumable pattern)
  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    totalChunks: number,
    chunkBlob: Blob,
    originalName: string,
    metadata: any
  ): Promise<any> {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', String(chunkIndex));
    formData.append('totalChunks', String(totalChunks));
    formData.append('originalName', originalName);
    formData.append('metadataStr', JSON.stringify(metadata));
    formData.append('chunk', chunkBlob, `part_${chunkIndex}.chunk`);

    const tokenSession =
      localStorage.getItem('dk_academy_admin_session_v1') ||
      localStorage.getItem('dk_academy_admin_session');
    let token = '';
    if (tokenSession) {
      try {
        token = JSON.parse(tokenSession).token;
      } catch (_) {}
    }

    const res = await fetch(`${apiClient.baseUrl}/lms/upload/chunk`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    return await res.json();
  }
};
