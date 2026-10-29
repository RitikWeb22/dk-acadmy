import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Video } from '../models/Video.js';
import { Course } from '../models/Course.js';

export interface TranscodeJob {
  videoId: string;
  rawFilePath: string;
  outputDir: string;
  courseId?: string;
  lectureId?: string;
}

class VideoTranscodeService {
  private queue: TranscodeJob[] = [];
  private isProcessing = false;

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const rawDir = path.join(process.cwd(), 'storage', 'private', 'raw-videos');
    const hlsDir = path.join(process.cwd(), 'storage', 'private', 'hls');
    if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
    if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });
  }

  public async queueTranscode(job: TranscodeJob): Promise<void> {
    this.queue.push(job);
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const currentJob = this.queue.shift();
    if (!currentJob) {
      this.isProcessing = false;
      return;
    }

    try {
      await this.transcodeToHLS(currentJob);
    } catch (err: any) {
      console.error(`[Transcode Error] Job failed for videoId ${currentJob.videoId}:`, err);
      await Video.findByIdAndUpdate(currentJob.videoId, {
        status: 'failed',
        errorMessage: err.message || 'FFmpeg transcoding failed'
      });
    } finally {
      this.processNext();
    }
  }

  private async transcodeToHLS(job: TranscodeJob): Promise<void> {
    const { videoId, rawFilePath, outputDir, courseId, lectureId } = job;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await Video.findByIdAndUpdate(videoId, {
      status: 'processing',
      transcodeProgress: 10
    });

    // 1. Probe duration using ffprobe or ffmpeg
    const duration = await this.getVideoDuration(rawFilePath);

    // 2. Generate multi-bitrate HLS streams (360p, 480p, 720p)
    // We execute ffmpeg command producing HLS variants
    const ffmpegArgs = [
      '-y',
      '-i', rawFilePath,
      // 720p stream
      '-vf', 'scale=w=1280:h=720:force_original_aspect_ratio=decrease',
      '-c:a', 'aac', '-ar', '48000', '-b:a', '128k',
      '-c:v', 'libx264', '-profile:v', 'main', '-crf', '22',
      '-g', '48', '-keyint_min', '48', '-sc_threshold', '0',
      '-b:v', '1500k', '-maxrate', '1800k', '-bufsize', '2400k',
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(outputDir, '720p_%03d.ts'),
      path.join(outputDir, '720p.m3u8'),

      // 480p stream
      '-vf', 'scale=w=854:h=480:force_original_aspect_ratio=decrease',
      '-c:a', 'aac', '-ar', '44100', '-b:a', '96k',
      '-c:v', 'libx264', '-profile:v', 'main', '-crf', '24',
      '-g', '48', '-keyint_min', '48', '-sc_threshold', '0',
      '-b:v', '800k', '-maxrate', '1000k', '-bufsize', '1400k',
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(outputDir, '480p_%03d.ts'),
      path.join(outputDir, '480p.m3u8'),

      // 360p stream
      '-vf', 'scale=w=640:h=360:force_original_aspect_ratio=decrease',
      '-c:a', 'aac', '-ar', '44100', '-b:a', '64k',
      '-c:v', 'libx264', '-profile:v', 'baseline', '-crf', '26',
      '-g', '48', '-keyint_min', '48', '-sc_threshold', '0',
      '-b:v', '400k', '-maxrate', '500k', '-bufsize', '750k',
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(outputDir, '360p_%03d.ts'),
      path.join(outputDir, '360p.m3u8')
    ];

    await this.runFFmpeg(ffmpegArgs, videoId, duration);

    // 3. Create master playlist `master.m3u8`
    const masterPlaylistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=1800000,RESOLUTION=1280x720,NAME="720p HD"
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=950000,RESOLUTION=854x480,NAME="480p SD"
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x360,NAME="360p Low"
360p.m3u8
`;
    fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterPlaylistContent, 'utf-8');

    const streamUrl = `/api/v1/lms/stream/${videoId}/master.m3u8`;

    // 4. Update MongoDB Video document
    await Video.findByIdAndUpdate(videoId, {
      status: 'ready',
      transcodeProgress: 100,
      durationSeconds: Math.round(duration),
      masterPlaylistUrl: streamUrl,
      qualities: [
        { resolution: '720p', bandwidth: 1800000, playlistPath: '720p.m3u8' },
        { resolution: '480p', bandwidth: 950000, playlistPath: '480p.m3u8' },
        { resolution: '360p', bandwidth: 500000, playlistPath: '360p.m3u8' }
      ]
    });

    // 5. If linked to a Course & Lecture, update Course document
    if (courseId && lectureId) {
      await this.updateCourseLectureVideo(courseId, lectureId, streamUrl, Math.round(duration));
    }

    console.log(`[Transcode Complete] Video ${videoId} HLS conversion ready!`);
  }

  private async updateCourseLectureVideo(courseId: string, lectureId: string, streamUrl: string, durationSec: number) {
    try {
      const minutes = Math.floor(durationSec / 60);
      const seconds = durationSec % 60;
      const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      // Update in Course curriculumSections
      await Course.findOneAndUpdate(
        {
          _id: courseId,
          'curriculumSections.lectures.id': lectureId
        },
        {
          $set: {
            'curriculumSections.$[].lectures.$[lec].videoUrl': streamUrl,
            'curriculumSections.$[].lectures.$[lec].duration': formattedDuration
          }
        },
        {
          arrayFilters: [{ 'lec.id': lectureId }]
        }
      );
    } catch (err) {
      console.warn(`[Course Sync Warning] Could not automatically sync lecture in Course ${courseId}:`, err);
    }
  }

  private getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve) => {
      const proc = spawn('ffmpeg', ['-i', filePath]);
      let output = '';

      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', () => {
        // Parse "Duration: 00:01:23.45"
        const match = output.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
        if (match) {
          const hours = parseFloat(match[1]);
          const minutes = parseFloat(match[2]);
          const seconds = parseFloat(match[3]);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          resolve(totalSeconds);
        } else {
          resolve(60); // fallback duration
        }
      });

      proc.on('error', () => {
        resolve(60);
      });
    });
  }

  private runFFmpeg(args: string[], videoId: string, totalDuration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', args);

      proc.stderr.on('data', async (data) => {
        const text = data.toString();
        // Extract time=00:00:12.34 to calculate progress
        const timeMatch = text.match(/time=(\d+):(\d+):(\d+\.?\d*)/);
        if (timeMatch && totalDuration > 0) {
          const h = parseFloat(timeMatch[1]);
          const m = parseFloat(timeMatch[2]);
          const s = parseFloat(timeMatch[3]);
          const currentSec = h * 3600 + m * 60 + s;
          const progressPercent = Math.min(95, Math.max(10, Math.round((currentSec / totalDuration) * 90)));
          
          // Debounced or periodic update
          if (progressPercent % 15 === 0) {
            Video.findByIdAndUpdate(videoId, { transcodeProgress: progressPercent }).catch(() => {});
          }
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with error code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export const videoTranscodeService = new VideoTranscodeService();
