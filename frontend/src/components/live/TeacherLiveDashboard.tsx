
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useDataChannel,
  useRoomContext
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Radio,
  Users,
  MessageSquare,
  Power,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Star,
  RefreshCw,
  Maximize2,
  Minimize2,
  BookOpen
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface DoubtMessage {
  id: string;
  senderName: string;
  senderId?: string;
  text: string;
  timestamp: string;
  isAnswered?: boolean;
  isStarred?: boolean;
}

interface TeacherLiveDashboardProps {
  initialRoomId?: string;
  initialTopic?: string;
  initialSubject?: string;
  initialBatchName?: string;
  teacherName?: string;
  teacherId?: string;
  apiBaseUrl?: string;
  onSessionEnded?: () => void;
}

// ══════════════════════════════════════════════════════════════════════════
// Inner Active Classroom Controls & Doubt Manager
// ══════════════════════════════════════════════════════════════════════════
const TeacherClassroomInner: React.FC<{
  sessionInfo: {
    roomId: string;
    title: string;
    subject: string;
    topic: string;
    batchName: string;
  };
  onEndSession: () => void;
  teacherName: string;
}> = ({ sessionInfo, onEndSession, teacherName }) => {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const participants = useParticipants();

  // Local state for active controls
  const [filterMode, setFilterMode] = useState<'all' | 'unanswered' | 'starred'>('all');
  const [doubts, setDoubts] = useState<DoubtMessage[]>([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const doubtListEndRef = useRef<HTMLDivElement>(null);

  // Timer tick for live session duration
  useEffect(() => {
    const timer = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // LiveKit Data Channel for Real-time Student Doubts (<100ms ultra-low latency)
  const { send } = useDataChannel('doubts', (msg) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload);
      const parsed = JSON.parse(decoded);

      if (parsed.type === 'NEW_DOUBT' || parsed.text) {
        const newDoubt: DoubtMessage = {
          id: parsed.id || `doubt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          senderName: parsed.senderName || 'Anonymous Student',
          senderId: parsed.senderId,
          text: parsed.text || '',
          timestamp:
            parsed.timestamp ||
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAnswered: false,
          isStarred: false
        };
        setDoubts((prev) => [newDoubt, ...prev]);
      } else if (parsed.type === 'DOUBT_ANSWERED') {
        setDoubts((prev) =>
          prev.map((d) => (d.id === parsed.id ? { ...d, isAnswered: true } : d))
        );
      }
    } catch (err) {
      console.warn('[DataChannel Receive Error]:', err);
    }
  });

  // Auto-scroll new doubts
  useEffect(() => {
    doubtListEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [doubts.length]);

  // Video tracks (Camera & Screen Share)
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: false }
  );

  // Identify local teacher video & screen share track
  const screenTrack = tracks.find(
    (t) => t.source === Track.Source.ScreenShare && t.participant.isLocal
  );
  const cameraTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && t.participant.isLocal
  );
  const primaryTrack = screenTrack || cameraTrack;

  // Toggle Camera
  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error('Camera toggle error:', err);
    }
  };

  // Toggle Microphone
  const toggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error('Microphone toggle error:', err);
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (err) {
      console.error('Screen share toggle error:', err);
    }
  };

  // Toggle Doubt status
  const handleToggleAnswered = (doubtId: string) => {
    setDoubts((prev) =>
      prev.map((d) => {
        if (d.id === doubtId) {
          const nextState = !d.isAnswered;
          // Broadcast update to students via DataChannel
          try {
            const updatePayload = new TextEncoder().encode(
              JSON.stringify({ type: 'DOUBT_ANSWERED', id: doubtId, isAnswered: nextState })
            );
            send(updatePayload, { reliable: true });
          } catch {
            // non-blocking
          }
          return { ...d, isAnswered: nextState };
        }
        return d;
      })
    );
  };

  const handleToggleStar = (doubtId: string) => {
    setDoubts((prev) =>
      prev.map((d) => (d.id === doubtId ? { ...d, isStarred: !d.isStarred } : d))
    );
  };

  // Broadcast Teacher Announcement
  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: 'TEACHER_BROADCAST',
          senderName: teacherName,
          text: announcementText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      );
      send(payload, { reliable: true });

      // Add to local doubt queue as a teacher highlight
      setDoubts((prev) => [
        {
          id: `announcement_${Date.now()}`,
          senderName: `📢 ${teacherName} (Teacher)`,
          text: announcementText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAnswered: true,
          isStarred: true
        },
        ...prev
      ]);
      setAnnouncementText('');
    } catch (err) {
      console.error('Failed to send announcement:', err);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Filtered doubts
  const filteredDoubts = useMemo(() => {
    if (filterMode === 'unanswered') return doubts.filter((d) => !d.isAnswered);
    if (filterMode === 'starred') return doubts.filter((d) => d.isStarred);
    return doubts;
  }, [doubts, filterMode]);

  const unansweredCount = doubts.filter((d) => !d.isAnswered).length;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP STATUS BAR: Topic, Subject, Duration & Live Counter
          ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold tracking-wider uppercase animate-pulse">
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span>LIVE STREAM</span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 truncate max-w-md sm:max-w-xl">
              <span>{sessionInfo.title}</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-indigo-400 font-semibold">{sessionInfo.subject}</span>
              <span>•</span>
              <span className="truncate">{sessionInfo.batchName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Duration Timer */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono font-medium">{formatTimer(sessionSeconds)}</span>
          </div>

          {/* Real-time Students Counter */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Users className="w-4 h-4" />
            <span>
              {Math.max(1, participants.length)} <span className="hidden sm:inline">Active Students</span>
            </span>
          </div>

          {/* End Session for Everyone */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to end this live class for all students?')) {
                setIsEnding(true);
                onEndSession();
              }
            }}
            disabled={isEnding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isEnding ? 'Ending...' : 'End Class for Everyone'}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN STAGE: Video Canvas (Left) + Doubt Queue (Right)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* LEFT: Video Canvas & Controls */}
        <div className="flex-1 flex flex-col bg-slate-950 p-3 sm:p-4 min-w-0">
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 flex items-center justify-center shadow-2xl">
            {primaryTrack ? (
              <VideoTrack
                trackRef={primaryTrack as any}
                className="w-full h-full object-contain bg-black rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700 text-slate-500">
                  <VideoOff className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Camera / Screen Share is Off</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Turn on your camera or screen share from the toolbar below so students can watch your live lecture broadcast.
                </p>
              </div>
            )}

            {/* In-Video Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>DK Sir Live Broadcast (1080p 60fps)</span>
              </span>

              {isScreenShareEnabled && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/80 text-white text-[11px] font-bold uppercase tracking-wider">
                  Screen Sharing Active
                </span>
              )}
            </div>

            {/* Floating Fullscreen Trigger */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 backdrop-blur-sm transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────
              TEACHER MEDIA CONTROLS TOOLBAR
              ───────────────────────────────────────────────────────── */}
          <div className="mt-3 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={toggleMic}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isMicrophoneEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40'
                }`}
              >
                {isMicrophoneEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                <span>{isMicrophoneEnabled ? 'Mic On' : 'Mic Muted'}</span>
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={toggleCamera}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isCameraEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40'
                }`}
              >
                {isCameraEnabled ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4" />}
                <span>{isCameraEnabled ? 'Camera On' : 'Camera Off'}</span>
              </button>

              {/* Screen Share Toggle */}
              <button
                type="button"
                onClick={toggleScreenShare}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isScreenShareEnabled
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <ScreenShare className="w-4 h-4 text-indigo-300" />
                <span>{isScreenShareEnabled ? 'Stop Sharing' : 'Share Screen'}</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Broadcasting via LiveKit WebRTC</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT: DEDICATED LIVE DOUBT QUEUE & STUDENT INTERACTION
            ───────────────────────────────────────────────────────────── */}
        <aside className="w-full lg:w-96 flex flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800">
          {/* Header & Filter Tabs */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-100">Live Doubt Queue</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {doubts.length} total
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1 rounded text-xs font-semibold transition ${
                  filterMode === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({doubts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unanswered')}
                className={`flex-1 py-1 rounded text-xs font-semibold transition flex items-center justify-center gap-1 ${
                  filterMode === 'unanswered'
                    ? 'bg-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Pending</span>
                {unansweredCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center">
                    {unansweredCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('starred')}
                className={`flex-1 py-1 rounded text-xs font-semibold transition ${
                  filterMode === 'starred'
                    ? 'bg-slate-800 text-yellow-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Starred
              </button>
            </div>
          </div>

          {/* Doubt Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {filteredDoubts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-medium text-slate-400">No incoming doubts right now.</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  When students ask doubts from their live viewer portal, they will appear here instantly in real time.
                </p>
              </div>
            ) : (
              filteredDoubts.map((doubt) => (
                <div
                  key={doubt.id}
                  className={`p-3 rounded-xl border transition ${
                    doubt.isAnswered
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-75'
                      : 'bg-slate-950 border-slate-800 shadow-sm hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold uppercase">
                        {doubt.senderName.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                        {doubt.senderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">{doubt.timestamp}</span>

                      {/* Star Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStar(doubt.id)}
                        className={`p-1 rounded hover:bg-slate-800 transition ${
                          doubt.isStarred ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400'
                        }`}
                        title="Star this doubt"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Mark Answered Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleAnswered(doubt.id)}
                        className={`p-1 rounded hover:bg-slate-800 transition ${
                          doubt.isAnswered
                            ? 'text-emerald-400'
                            : 'text-slate-500 hover:text-emerald-400'
                        }`}
                        title={doubt.isAnswered ? 'Mark as Unanswered' : 'Mark as Answered'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-8 break-words">
                    {doubt.text}
                  </p>

                  {doubt.isAnswered && (
                    <div className="mt-2 pl-8 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Answered live on board</span>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={doubtListEndRef} />
          </div>

          {/* Broadcast Announcement Bar to all Students */}
          <form
            onSubmit={handleSendAnnouncement}
            className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
          >
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Broadcast note to all students..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!announcementText.trim()}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition shadow-md shadow-indigo-600/20 cursor-pointer"
              title="Broadcast to students"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Main TeacherLiveDashboard (Pre-Live Setup & LiveKit Mount)
// ══════════════════════════════════════════════════════════════════════════
export const TeacherLiveDashboard: React.FC<TeacherLiveDashboardProps> = ({
  initialRoomId = 'dk-jee-math-mastery-live',
  initialTopic = 'Definite Integrals & 20s Inspection Shortcuts',
  initialSubject = 'Mathematics',
  initialBatchName = 'JEE 2027 Advanced Math & Calculus Mastery',
  teacherName = 'Dharmendra Kumar (DK Sir)',
  teacherId = 'teacher_dk_sir',
  apiBaseUrl = '/api',
  onSessionEnded
}) => {
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form setup state
  const [roomId, setRoomId] = useState(initialRoomId);
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState(initialSubject);
  const [batchName, setBatchName] = useState(initialBatchName);

  // LiveKit Connection Credentials
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  // Trigger "Start Live Class" flow
  const handleStartLiveClass = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const sessionPayload = {
        roomId: roomId.trim() || `dk-live-${Date.now()}`,
        title: `${subject}: ${topic.trim()}`,
        subject,
        topic: topic.trim(),
        batchId: 'jee-main-advanced-2yr-ultimate',
        batchName: batchName.trim(),
        teacherId,
        teacherName,
        description: 'Official DK Academy Live Interactive Broadcast'
      };

      // 1. Initialize or start live session via backend
      let data: any;
      if (apiBaseUrl && apiBaseUrl !== '/api') {
        const fullUrl = `${apiBaseUrl.replace(/\/+$/, '')}/live/sessions`;
        const res = await fetch(fullUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionPayload)
        });
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server returned status ${res.status}: ${text.slice(0, 120)}`);
        }
      } else {
        data = await apiClient.post('/live/sessions', sessionPayload);
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to start live session');
      }

      // If token returned directly from start endpoint
      let activeToken = data.token;
      let activeWsUrl = data.wsUrl || import.meta.env.VITE_LIVEKIT_URL || 'wss://dk-acadmey-jpdi7yks.livekit.cloud';

      // Fallback: If start endpoint didn't provide token, query /token
      if (!activeToken) {
        const tokenPayload = {
          roomId: data.data?.roomId || roomId,
          userId: teacherId,
          role: 'teacher',
          userName: teacherName
        };

        let tokenData: any;
        if (apiBaseUrl && apiBaseUrl !== '/api') {
          const fullTokenUrl = `${apiBaseUrl.replace(/\/+$/, '')}/live/token`;
          const tokenRes = await fetch(fullTokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokenPayload)
          });
          const tokenText = await tokenRes.text();
          try {
            tokenData = JSON.parse(tokenText);
          } catch {
            throw new Error(`Server returned status ${tokenRes.status}`);
          }
        } else {
          tokenData = await apiClient.post('/live/token', tokenPayload);
        }

        if (!tokenData || !tokenData.success) {
          throw new Error(tokenData?.message || 'Failed to fetch teacher LiveKit token');
        }
        activeToken = tokenData.token;
        activeWsUrl = tokenData.wsUrl || activeWsUrl;
      }

      setToken(activeToken);
      setWsUrl(activeWsUrl);
      setIsLive(true);
    } catch (err: any) {
      console.error('Start live class error:', err);
      setErrorMsg(err.message || 'Could not start live stream. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // End Session Handler
  const handleEndSession = async () => {
    try {
      if (apiBaseUrl && apiBaseUrl !== '/api') {
        await fetch(`${apiBaseUrl.replace(/\/+$/, '')}/live/sessions/${encodeURIComponent(roomId)}/end`, {
          method: 'POST'
        });
      } else {
        await apiClient.post(`/live/sessions/${encodeURIComponent(roomId)}/end`);
      }
    } catch (err) {
      console.warn('End session notification error:', err);
    }
    setIsLive(false);
    setToken(null);
    onSessionEnded?.();
  };

  // If live, render `<LiveKitRoom>`
  if (isLive && token && wsUrl) {
    return (
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={wsUrl}
        connect={true}
        data-lk-theme="default"
        onError={(err) => {
          console.error('[LiveKit Room Error]:', err);
          setErrorMsg(err.message);
        }}
        onDisconnected={() => {
          setIsLive(false);
          setToken(null);
        }}
        className="h-screen w-full bg-slate-950"
      >
        <RoomAudioRenderer />
        <TeacherClassroomInner
          sessionInfo={{
            roomId,
            title: `${subject}: ${topic}`,
            subject,
            topic,
            batchName
          }}
          onEndSession={handleEndSession}
          teacherName={teacherName}
        />
      </LiveKitRoom>
    );
  }

  // Pre-Live Teacher Setup Dashboard
  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Teacher Broadcast Console
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Go Live in Classroom</h1>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleStartLiveClass} className="space-y-4">
          {/* Topic Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Live Lecture Topic / Chapter Focus *
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Definite Integrals: 20-30s Inspection Shortcuts"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Subject & Batch Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Mathematics">Mathematics (DK Sir)</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Batch / Class
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Target Batch Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Room ID (Auto / Custom) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Classroom Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. dk-jee-math-mastery-live"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Enrolled students will automatically join this room ID from their dashboard.
            </p>
          </div>

          {/* Broadcast Highlights Info */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>LiveKit WebRTC 1080p Ultra-Low Latency Publishing</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Student Doubt Queue (&lt;100ms DataChannel)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Student microphones &amp; cameras are automatically muted</span>
            </div>
          </div>

          {/* Submit "Start Live Class" Button */}
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm tracking-wide transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Initializing Live Classroom Stream...</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 animate-pulse text-white" />
                <span>Start Live Class Now</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherLiveDashboard;

