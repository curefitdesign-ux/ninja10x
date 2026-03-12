import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Camera, Upload, Mic, MicOff, X, Send, Image, Video, Trash2, Play, Pause, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface FeedbackSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type AttachmentType = "screenshot" | "video" | "audio";

interface Attachment {
  type: AttachmentType;
  blob: Blob;
  url: string; // object URL for preview
  name: string;
}

export default function FeedbackSheet({ isOpen, onClose }: FeedbackSheetProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-capture screenshot when sheet opens
  useEffect(() => {
    if (isOpen && attachments.length === 0) {
      captureScreenshot();
    }
    if (!isOpen) {
      // Reset on close
      setMessage("");
      setAttachments([]);
      setIsRecording(false);
      setRecordingDuration(0);
      setIsSubmitting(false);
      setSubmitted(false);
      stopRecording();
    }
  }, [isOpen]);

  const captureScreenshot = useCallback(async () => {
    setIsCapturingScreen(true);
    try {
      // Small delay so the sheet doesn't capture itself
      await new Promise((r) => setTimeout(r, 100));
      const root = document.getElementById("root");
      if (!root) return;
      const canvas = await html2canvas(root, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: "#0a0720",
        ignoreElements: (el) => {
          // Ignore the feedback sheet itself
          return el.getAttribute("data-feedback-sheet") === "true";
        },
      });
      canvas.toBlob((blob) => {
        if (blob) {
          setAttachments((prev) => {
            // Replace existing screenshot
            const filtered = prev.filter((a) => a.type !== "screenshot");
            return [
              ...filtered,
              {
                type: "screenshot",
                blob,
                url: URL.createObjectURL(blob),
                name: `screenshot-${Date.now()}.png`,
              },
            ];
          });
        }
      }, "image/png");
    } catch (e) {
      console.error("Screenshot capture failed:", e);
    } finally {
      setIsCapturingScreen(false);
    }
  }, []);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setAttachments((prev) => {
        const filtered = prev.filter((a) => a.type !== "screenshot");
        return [
          ...filtered,
          {
            type: "screenshot",
            blob: file,
            url: URL.createObjectURL(file),
            name: file.name,
          },
        ];
      });
      e.target.value = "";
    },
    []
  );

  const handleVideoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video must be under 50MB");
        return;
      }
      setAttachments((prev) => {
        const filtered = prev.filter((a) => a.type !== "video");
        return [
          ...filtered,
          {
            type: "video",
            blob: file,
            url: URL.createObjectURL(file),
            name: file.name,
          },
        ];
      });
      e.target.value = "";
    },
    []
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        const ext = mediaRecorder.mimeType.includes("webm") ? "webm" : "m4a";
        setAttachments((prev) => {
          const filtered = prev.filter((a) => a.type !== "audio");
          return [
            ...filtered,
            {
              type: "audio",
              blob: audioBlob,
              url: URL.createObjectURL(audioBlob),
              name: `voice-${Date.now()}.${ext}`,
            },
          ];
        });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      toast.error("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const removeAttachment = useCallback((type: AttachmentType) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.type === type);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((a) => a.type !== type);
    });
  }, []);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const uploadFile = async (blob: Blob, path: string) => {
    const { error } = await supabase.storage
      .from("feedback-attachments")
      .upload(path, blob, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage
      .from("feedback-attachments")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!message.trim() && attachments.length === 0) {
      toast.error("Please add a message or attachment");
      return;
    }
    setIsSubmitting(true);
    try {
      const userId = user.id;
      let screenshotUrl: string | null = null;
      let videoUrl: string | null = null;
      let audioUrl: string | null = null;

      for (const att of attachments) {
        const path = `${userId}/${att.name}`;
        const url = await uploadFile(att.blob, path);
        if (att.type === "screenshot") screenshotUrl = url;
        if (att.type === "video") videoUrl = url;
        if (att.type === "audio") audioUrl = url;
      }

      const { error } = await supabase.from("feedback" as any).insert({
        user_id: userId,
        message: message.trim(),
        screenshot_url: screenshotUrl,
        video_url: videoUrl,
        audio_url: audioUrl,
        current_route: window.location.pathname,
        device_info: navigator.userAgent,
      } as any);

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-feedback', {
          body: {
            message: message.trim(),
            screenshotUrl,
            videoUrl,
            audioUrl,
            currentRoute: window.location.pathname,
            deviceInfo: navigator.userAgent,
            userEmail: user.email,
            userName: user.user_metadata?.display_name || user.email,
          },
        });
      } catch (emailErr) {
        console.warn('Email notification failed (feedback still saved):', emailErr);
      }

      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("Feedback submit failed:", err);
      toast.error("Failed to send feedback. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const screenshot = attachments.find((a) => a.type === "screenshot");
  const video = attachments.find((a) => a.type === "video");
  const audio = attachments.find((a) => a.type === "audio");

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="px-0 pt-3 rounded-t-3xl max-h-[85vh] overflow-y-auto border-t border-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 -8px 40px rgba(0,0,0,0.4)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
        }}
        data-feedback-sheet="true"
      >
        <SheetTitle className="sr-only">Send Feedback</SheetTitle>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              className="flex flex-col items-center justify-center py-12 px-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
              <h3
                className="text-xl font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                Feedback Sent!
              </h3>
              <p
                className="text-sm text-center"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Thanks for helping us improve.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4 px-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  Send Feedback
                </h3>
              </div>

              {/* Text input */}
              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Describe the issue or suggestion
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(20px)",
                  }}
                />
              </div>

              {/* Attachments preview */}
              <div className="flex gap-3 flex-wrap">
                {/* Screenshot */}
                {screenshot ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={screenshot.url}
                      alt="Screenshot"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeAttachment("screenshot")}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div
                      className="absolute bottom-0 left-0 right-0 text-center py-0.5 text-[8px] font-medium"
                      style={{
                        background: "rgba(0,0,0,0.5)",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      Screenshot
                    </div>
                  </div>
                ) : isCapturingScreen ? (
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px dashed rgba(255,255,255,0.15)",
                    }}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white/80 animate-spin" />
                  </div>
                ) : null}

                {/* Video */}
                {video && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                    <video
                      src={video.url}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeAttachment("video")}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div
                      className="absolute bottom-0 left-0 right-0 text-center py-0.5 text-[8px] font-medium"
                      style={{
                        background: "rgba(0,0,0,0.5)",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      Video
                    </div>
                  </div>
                )}

                {/* Audio */}
                {audio && (
                  <div
                    className="relative w-20 h-20 rounded-xl flex flex-col items-center justify-center border border-white/10"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <Mic className="w-5 h-5 text-emerald-400 mb-1" />
                    <span
                      className="text-[9px]"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      Voice
                    </span>
                    <button
                      onClick={() => removeAttachment("audio")}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons row */}
              <div className="flex gap-2">
                {/* Screenshot button */}
                <button
                  onClick={() => {
                    if (screenshot) {
                      // Replace via file picker
                      imageInputRef.current?.click();
                    } else {
                      captureScreenshot();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.97] transition-transform"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Camera
                    className="w-4 h-4"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {screenshot ? "Replace" : "Screenshot"}
                  </span>
                </button>

                {/* Video upload */}
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.97] transition-transform"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Video
                    className="w-4 h-4"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {video ? "Replace" : "Video"}
                  </span>
                </button>

                {/* Voice recording */}
                <button
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else if (audio) {
                      removeAttachment("audio");
                      startRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.97] transition-transform"
                  style={{
                    background: isRecording
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(255,255,255,0.06)",
                    border: isRecording
                      ? "1px solid rgba(239, 68, 68, 0.3)"
                      : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {isRecording ? (
                    <>
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <MicOff className="w-4 h-4 text-red-400" />
                      </motion.div>
                      <span className="text-xs font-medium text-red-400">
                        {formatDuration(recordingDuration)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic
                        className="w-4 h-4"
                        style={{
                          color: audio
                            ? "rgb(16, 185, 129)"
                            : "rgba(255,255,255,0.6)",
                        }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: audio
                            ? "rgb(16, 185, 129)"
                            : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {audio ? "Re-record" : "Voice"}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Audio playback */}
              {audio && !isRecording && (
                <AudioPlayer src={audio.url} />
              )}

              {/* Submit */}
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting || isRecording}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
                style={{
                  background: "#FFFFFF",
                  boxShadow: "0 8px 32px rgba(255, 255, 255, 0.15)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-purple-400/30 border-t-purple-500 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 text-purple-600" />
                    <span
                      className="text-sm font-bold"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, #7C3AED, #EC4899)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      SEND FEEDBACK
                    </span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="absolute opacity-0 pointer-events-none"
          style={{ position: "absolute", top: -9999 }}
          onChange={handleImageUpload}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="absolute opacity-0 pointer-events-none"
          style={{ position: "absolute", top: -9999 }}
          onChange={handleVideoUpload}
        />
      </SheetContent>
    </Sheet>
  );
}

// Mini audio player component
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () =>
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className="shrink-0">
        {playing ? (
          <Pause className="w-5 h-5 text-emerald-400" />
        ) : (
          <Play className="w-5 h-5 text-emerald-400" />
        )}
      </button>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #10B981, #34D399)",
          }}
        />
      </div>
      <Mic className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
    </div>
  );
}
