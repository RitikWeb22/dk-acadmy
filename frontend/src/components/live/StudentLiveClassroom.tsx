import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useParticipants,
  useDataChannel,
  useRoomContext
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import {
  Radio,
  Users,
  MessageSquare,
  Sparkles,
  Send,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  LogOut,
  HelpCircle
} from 'lucide-react';

interface LiveSessionData {
  roomId: string;
  title: string;
  subject: string;
  topic: string;
  batchId?: string;
  batchName?: string;
  teacherName?: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startedAt?: string;
  participantCount?: number;
}

interface DoubtMessage {
  id: string;
  senderName: string;
  senderId?: string;
  text: string;
  timestamp: string;
  isAnswered?: boolean;
}

interface StudentLiveClassroomProps {
  currentStudent?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
  } | null;
  apiBaseUrl?: string;
  initialRoomId?: string;
  onLeaveClassroom?: () => void;
}

// ══════════════════════════════════════════════════════════════════════════
// Inner Viewer Classroom (Inside <LiveKitRoom>)
// ══════════════════════════════════════════════════════════════════════════
const StudentClassroomInner: React.FC<{
  session: LiveSessionData;
  studentName: string;
  studentId: string;
  onLeave: () => void;
}> = ({ session, studentName, studentId, onLeave }) => {
  const room = useRoomContext();
  const participants = useParticipants();

  const [doubts, setDoubts] = useState<DoubtMessage[]>([]);
  const [inputDoubt, setInputDoubt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // LiveKit Data Channel for Doubts (<100ms ultra-low latency WebRTC)
  const { send } = useDataChannel('doubts', (msg) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload);
      const parsed = JSON.parse(decoded);

      if (parsed.type === 'NEW_DOUBT' || parsed.text) {
        setDoubts((prev) => [
          ...prev,
          {
            id: parsed.id || `doubt_${Date.now()}`,
            senderName: parsed.senderName || 'Student',
            senderId: parsed.senderId,
            text: parsed.text,
            timestamp:
              parsed.timestamp ||
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAnswered: false
          }
        ]);
      } else if (parsed.type === 'DOUBT_ANSWERED') {
        setDoubts((prev) =>
          prev.map((d) => (d.id === parsed.id ? { ...d, isAnswered: true } : d))
        );
      } else if (parsed.type === 'TEACHER_BROADCAST') {
        setAnnouncement(parsed.text);
        // Also append as teacher note in feed
        setDoubts((prev) => [
          ...prev,
          {
            id: `announce_${Date.now()}`,
            senderName: `📢 ${parsed.senderName || 'DK Sir'}`,
            text: parsed.text,
            timestamp: parsed.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAnswered: true
          }
        ]);
      }
    } catch (err) {
      console.warn('[Student DataChannel Error]:', err);
    }
  });

  // Auto-scroll chat feed
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [doubts.length]);

  // Video tracks: look for Teacher's Camera and Screen Share
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: true }
  );

  // Prioritize Screen Share if teacher is presenting whiteboard / problem sheet
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const activeTeacherTrack = screenTrack || cameraTrack;

  // Send Doubt to Teacher
  const handleSendDoubt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputDoubt.trim()) return;

    const newDoubt: DoubtMessage = {
      id: `doubt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderName: studentName,
      senderId: studentId,
      text: inputDoubt.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAnswered: false
    };

    // Optimistically update local feed
    setDoubts((prev) => [...prev, newDoubt]);

    // Send payload over LiveKit Data Channel
    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: 'NEW_DOUBT',
          ...newDoubt
        })
      );
      send(payload, { reliable: true });
    } catch (err) {
      console.error('Failed to send doubt over data channel:', err);
    }

    setInputDoubt('');
  };

  // Fullscreen toggle
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

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION & BROADCAST BANNER
          ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold uppercase tracking-wider animate-pulse">
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span>LIVE NOW</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
              {session.title || 'JEE Advanced Live Lecture'}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-indigo-400 font-medium">{session.teacherName || 'DK Sir'}</span>
              <span>•</span>
              <span className="text-slate-400">{session.batchName || 'JEE Rankers Batch'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Participants Count */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>
              {Math.max(1, participants.length)} <span className="hidden sm:inline">Students In Class</span>
            </span>
          </div>

          {/* Leave Classroom */}
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN STAGE: Live Video Player + Real-time Doubt Sidebar
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* LEFT: Full-Screen Adaptive Video Canvas */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 bg-slate-950 min-w-0">
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
            {activeTeacherTrack ? (
              <VideoTrack
                trackRef={activeTeacherTrack as any}
                className="w-full h-full object-contain bg-black rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 animate-pulse text-indigo-400">
                  <Radio className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-200">
                  Connected to Live Classroom
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  DK Sir is currently adjusting the camera / lecture slides. Audio is live.
                </p>
                <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Ultra-low latency WebRTC stream</span>
                </div>
              </div>
            )}

            {/* Broadcast Overlay Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>DK Academy Live Class (1080p Full HD)</span>
              </span>

              {screenTrack && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/90 text-white text-[11px] font-bold uppercase tracking-wider">
                  Screen Share
                </span>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 backdrop-blur-sm transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Student Privacy Notice: Mic & Camera Disabled */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Viewer Mode: Camera &amp; Mic are securely disabled</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT: BUILT-IN REAL-TIME DOUBT CHAT SIDEBAR (<100ms lag)
            ───────────────────────────────────────────────────────────── */}
        <aside className="w-full lg:w-96 flex flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-100">Live Doubt Queue</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              &lt;100ms DataChannel
            </span>
          </div>

          {/* Teacher Broadcast Banner if posted */}
          {announcement && (
            <div className="m-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Notice from DK Sir</span>
              </div>
              <p className="leading-relaxed">{announcement}</p>
            </div>
          )}

          {/* Doubt Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {doubts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <HelpCircle className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
                <p className="text-xs font-semibold text-slate-300">Have a doubt in this concept?</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                  Type your question below. DK Sir receives it instantly on his live teacher queue and solves it on the board.
                </p>
              </div>
            ) : (
              doubts.map((doubt) => {
                const isMine = doubt.senderId === studentId || doubt.senderName === studentName;
                return (
                  <div
                    key={doubt.id}
                    className={`p-3 rounded-xl border transition ${
                      isMine
                        ? 'bg-indigo-950/40 border-indigo-500/30 ml-4'
                        : 'bg-slate-950 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate max-w-[140px] ${isMine ? 'text-indigo-400' : 'text-slate-200'}`}>
                          {doubt.senderName} {isMine && '(You)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{doubt.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed break-words">
                      {doubt.text}
                    </p>

                    {doubt.isAnswered && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Addressed on board by DK Sir</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Quick Doubt Suggestions Chips */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {['Repeat step 2', 'Show shortcut formula', 'Why did sign flip?'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setInputDoubt(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800 transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box with "Send Doubt" */}
          <form
            onSubmit={handleSendDoubt}
            className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputDoubt}
              onChange={(e) => setInputDoubt(e.target.value)}
              placeholder="Ask DK Sir a doubt in real-time..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!inputDoubt.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Main StudentLiveClassroom (Banner + Join Flow)
// ══════════════════════════════════════════════════════════════════════════
export const StudentLiveClassroom: React.FC<StudentLiveClassroomProps> = ({
  currentStudent,
  apiBaseUrl = '/api',
  initialRoomId,
  onLeaveClassroom
}) => {
  const [activeSession, setActiveSession] = useState<LiveSessionData | null>(null);
  const [isFetchingSession, setIsFetchingSession] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isInClass, setIsInClass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // LiveKit Token & WsUrl
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  const studentName = currentStudent?.name || 'Aarav Sharma';
  const studentId = currentStudent?.id || currentStudent?._id || `student_${Math.random().toString(36).substring(2, 8)}`;

  // Poll for active live sessions from backend
  useEffect(() => {
    let isMounted = true;
    const fetchActiveSessions = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/live/sessions?status=LIVE`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
          setActiveSession(json.data[0]);
        }
      } catch (err) {
        console.warn('Live sessions fetch note:', err);
      } finally {
        if (isMounted) setIsFetchingSession(false);
      }
    };

    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 15000); // refresh every 15s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiBaseUrl]);

  // "Join Class" Click Handler
  const handleJoinClass = async (roomIdToJoin?: string) => {
    const targetRoom = roomIdToJoin || activeSession?.roomId || initialRoomId || 'dk-jee-math-mastery-live';
    setIsJoining(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/live/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: targetRoom,
          userId: studentId,
          role: 'student',
          userName: studentName,
          batchId: activeSession?.batchId || 'all'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to join live classroom');
      }

      setToken(data.token);
      setWsUrl(data.wsUrl || import.meta.env.VITE_LIVEKIT_URL || 'wss://dk-acadmey-jpdi7yks.livekit.cloud');
      setIsInClass(true);
    } catch (err: any) {
      console.error('Join live class error:', err);
      setErrorMsg(err.message || 'Unable to join live classroom. Please verify enrollment and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClass = () => {
    setIsInClass(false);
    setToken(null);
    onLeaveClassroom?.();
  };

  // If in class, mount LiveKit viewer room
  if (isInClass && token && wsUrl) {
    return (
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={wsUrl}
        connect={true}
        data-lk-theme="default"
        onError={(err) => {
          console.error('[LiveKit Student Room Error]:', err);
          setErrorMsg(err.message);
        }}
        onDisconnected={() => {
          setIsInClass(false);
          setToken(null);
        }}
        className="h-screen w-full bg-slate-950"
      >
        <RoomAudioRenderer />
        <StudentClassroomInner
          session={activeSession || {
            roomId: initialRoomId || 'dk-jee-math-mastery-live',
            title: 'JEE 2027 Advanced Math & Calculus Mastery: 20-30s Inspection Tricks',
            subject: 'Mathematics',
            topic: 'Definite Integrals & Straight Lines Speed Shortcuts',
            teacherName: 'Dharmendra Kumar (DK Sir)',
            status: 'LIVE',
            participantCount: 42
          }}
          studentName={studentName}
          studentId={studentId}
          onLeave={handleLeaveClass}
        />
      </LiveKitRoom>
    );
  }

  // Standalone Banner / Pre-join Card on Student Dashboard
  return (
    <div className="w-full font-sans">
      {/* 🔴 LIVE NOW BANNER */}
      {activeSession ? (
        <div className="w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-indigo-500/30 p-4 sm:p-5 shadow-xl shadow-indigo-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="relative mt-1">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-slate-900 animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider">
                  Live Now
                </span>
                <span className="text-xs text-indigo-400 font-semibold">
                  {activeSession.subject || 'Mathematics'}
                </span>
                <span className="text-slate-600 text-xs">•</span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{activeSession.participantCount || 42} Attending</span>
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                {activeSession.title || 'JEE Advanced Live Lecture Broadcast'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mentor: <span className="text-slate-200 font-medium">{activeSession.teacherName || 'DK Sir'}</span>
                {activeSession.batchName && ` • ${activeSession.batchName}`}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleJoinClass(activeSession.roomId)}
              disabled={isJoining}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isJoining ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Join Class</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-slate-500" />
            <span>No live class in session right now. Next live lecture scheduled at 6:00 PM IST.</span>
          </div>
          <button
            type="button"
            onClick={() => handleJoinClass('dk-jee-math-mastery-live')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Preview Classroom</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default StudentLiveClassroom;

