import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Play, Loader2, CheckCircle, AlertCircle, Video, Upload, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BrutalistCard } from '@/components/BrutalistCard';
import { 
  generateVideosForAllImages, 
  type ImageInput,
  type GenerationResult 
} from '@/services/runway-service';

// Configuration data for 3 days
const DAYS_CONFIG = [
  { day: 1, activity: 'BOXING' },
  { day: 2, activity: 'SPRINTS' },
  { day: 3, activity: 'LIFTING' },
];

interface DayStatus {
  status: 'idle' | 'uploading' | 'generating' | 'stitching' | 'complete' | 'error';
  images: ImageInput[];
  videoResults: GenerationResult[];
  finalVideoUrls: string[];
  progress?: { completed: number; total: number };
  error?: string;
}

const createInitialDayStatus = (): DayStatus => ({
  status: 'idle',
  images: [],
  videoResults: [],
  finalVideoUrls: [],
});

export default function BrutalistGenerator() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [dayStatuses, setDayStatuses] = useState<Record<number, DayStatus>>({
    1: createInitialDayStatus(),
    2: createInitialDayStatus(),
    3: createInitialDayStatus(),
  });
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const updateDayStatus = useCallback((day: number, update: Partial<DayStatus>) => {
    setDayStatuses(prev => ({
      ...prev,
      [day]: { ...prev[day], ...update },
    }));
  }, []);

  const handleImageUpload = useCallback((day: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageInput[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newImages.push({ url, name: file.name });
      }
    });

    if (newImages.length > 0) {
      setDayStatuses(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          images: [...prev[day].images, ...newImages],
        },
      }));
      toast.success(`Added ${newImages.length} image(s) to Day ${day}`);
    }
  }, []);

  const removeImage = useCallback((day: number, index: number) => {
    setDayStatuses(prev => {
      const newImages = [...prev[day].images];
      // Revoke the object URL to free memory
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return {
        ...prev,
        [day]: { ...prev[day], images: newImages },
      };
    });
  }, []);

  const generateForDay = useCallback(async (day: number, activity: string) => {
    const status = dayStatuses[day];
    
    if (!apiKey.trim()) {
      toast.error('Please enter your RunwayML API key');
      return;
    }

    if (status.images.length === 0) {
      toast.error(`Please upload at least one image for Day ${day}`);
      return;
    }

    updateDayStatus(day, { 
      status: 'generating', 
      error: undefined,
      progress: { completed: 0, total: status.images.length }
    });

    try {
      const results = await generateVideosForAllImages(
        status.images,
        activity,
        apiKey,
        (completed, total, result) => {
          updateDayStatus(day, { 
            progress: { completed, total },
            videoResults: result ? [...dayStatuses[day].videoResults, result] : dayStatuses[day].videoResults,
          });
        }
      );

      // All videos generated - collect all URLs
      const finalVideoUrls = results.map(r => r.videoUrl);
      
      updateDayStatus(day, { 
        status: 'complete', 
        videoResults: results,
        finalVideoUrls,
      });
      
      toast.success(`Day ${day}: Generated ${results.length} video(s)!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      updateDayStatus(day, { status: 'error', error: message });
      toast.error(`Day ${day}: ${message}`);
    }
  }, [apiKey, updateDayStatus, dayStatuses]);

  const generateAll = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your RunwayML API key');
      return;
    }

    const daysWithImages = DAYS_CONFIG.filter(({ day }) => dayStatuses[day].images.length > 0);
    
    if (daysWithImages.length === 0) {
      toast.error('Please upload images for at least one day');
      return;
    }

    setIsGeneratingAll(true);

    // Generate sequentially to avoid rate limits
    for (const { day, activity } of daysWithImages) {
      await generateForDay(day, activity);
    }

    setIsGeneratingAll(false);
  }, [apiKey, generateForDay, dayStatuses]);

  const allComplete = Object.values(dayStatuses).every(s => 
    s.images.length === 0 || s.status === 'complete'
  );
  const anyGenerating = Object.values(dayStatuses).some(s => 
    s.status === 'generating' || s.status === 'stitching'
  );
  const hasAnyImages = Object.values(dayStatuses).some(s => s.images.length > 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2">
            BRUTALIST
          </h1>
          <p className="text-xl text-yellow-400 font-mono tracking-widest">
            FITNESS VIDEO GENERATOR
          </p>
        </motion.div>

        {/* API Key Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto mb-12"
        >
          <label className="block text-sm font-mono text-neutral-400 mb-2">
            RUNWAY API KEY
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="rl_xxxxxxxxxxxx"
                className="pl-11 bg-neutral-900 border-neutral-700 text-white font-mono"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowApiKey(!showApiKey)}
              className="border-neutral-700 text-neutral-400 hover:text-white"
            >
              {showApiKey ? 'HIDE' : 'SHOW'}
            </Button>
          </div>
        </motion.div>

        {/* Days Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {DAYS_CONFIG.map(({ day, activity }, index) => {
            const status = dayStatuses[day];
            
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative"
              >
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={(el) => { fileInputRefs.current[day] = el; }}
                  onChange={(e) => handleImageUpload(day, e.target.files)}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {status.finalVideoUrls.length > 0 ? (
                  <BrutalistCard
                    videoUrls={status.finalVideoUrls}
                    dayNumber={day}
                    activityName={activity}
                  />
                ) : (
                  <div className="aspect-[9/16] bg-neutral-900 border-2 border-neutral-800 rounded-lg flex flex-col p-4">
                    {/* Day indicator */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-mono text-sm text-neutral-500">DAY {day}</span>
                      <span className="text-yellow-400 font-bold">{activity}</span>
                    </div>

                    {/* Image thumbnails */}
                    {status.images.length > 0 && (
                      <div className="flex-1 overflow-y-auto mb-4">
                        <div className="grid grid-cols-3 gap-2">
                          {status.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square group">
                              <img
                                src={img.url}
                                alt={img.name || `Image ${idx + 1}`}
                                className="w-full h-full object-cover rounded"
                              />
                              <button
                                onClick={() => removeImage(day, idx)}
                                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {status.videoResults[idx] && (
                                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center rounded">
                                  <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status indicator */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <AnimatePresence mode="wait">
                        {status.status === 'idle' && status.images.length === 0 && (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                          >
                            <Image className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                            <p className="text-sm text-neutral-500 font-mono mb-4">
                              Upload images to generate
                            </p>
                          </motion.div>
                        )}

                        {status.status === 'generating' && (
                          <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                          >
                            <Loader2 className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-spin" />
                            <h3 className="text-xl font-bold text-white mb-2">
                              GENERATING...
                            </h3>
                            {status.progress && (
                              <p className="text-sm text-neutral-400 font-mono">
                                {status.progress.completed}/{status.progress.total} videos
                              </p>
                            )}
                          </motion.div>
                        )}

                        {status.status === 'stitching' && (
                          <motion.div
                            key="stitching"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                          >
                            <Loader2 className="w-12 h-12 text-green-400 mx-auto mb-4 animate-spin" />
                            <h3 className="text-xl font-bold text-white mb-2">
                              STITCHING...
                            </h3>
                          </motion.div>
                        )}

                        {status.status === 'error' && (
                          <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                          >
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-400 mb-2">
                              ERROR
                            </h3>
                            <p className="text-xs text-neutral-500 font-mono max-w-[200px]">
                              {status.error}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 mt-4">
                      <Button
                        onClick={() => fileInputRefs.current[day]?.click()}
                        disabled={status.status === 'generating' || status.status === 'stitching'}
                        variant="outline"
                        className="w-full border-neutral-700 text-neutral-300 hover:text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        ADD IMAGES ({status.images.length})
                      </Button>

                      {status.images.length > 0 && (status.status === 'idle' || status.status === 'error') && (
                        <Button
                          onClick={() => generateForDay(day, activity)}
                          disabled={!apiKey.trim() || anyGenerating}
                          className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          GENERATE {status.images.length} VIDEO{status.images.length > 1 ? 'S' : ''}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Generate All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            onClick={generateAll}
            disabled={!apiKey.trim() || isGeneratingAll || anyGenerating || !hasAnyImages || allComplete}
            size="lg"
            className="bg-yellow-400 text-black hover:bg-yellow-300 font-black text-xl px-12 py-6 h-auto"
          >
            {isGeneratingAll || anyGenerating ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                GENERATING...
              </>
            ) : allComplete && hasAnyImages ? (
              <>
                <CheckCircle className="w-6 h-6 mr-3" />
                ALL COMPLETE
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-3" />
                GENERATE ALL
              </>
            )}
          </Button>

          <p className="mt-4 text-sm text-neutral-500 font-mono">
            Each image generates a 5-second video (~60-90s each)
          </p>
        </motion.div>
      </div>
    </div>
  );
}
