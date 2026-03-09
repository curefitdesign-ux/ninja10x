import { ReactionType } from '@/services/journey-service';

// Core reaction images
import clapImg from '@/assets/reactions/clap-hands.png';
import fireImg from '@/assets/reactions/fire-new.png';
import fistbumpImg from '@/assets/reactions/fistbump-hands.png';
import wowImg from '@/assets/reactions/wow.png';
import flexImg from '@/assets/reactions/flex.png';
import trophyImg from '@/assets/reactions/dumbbells.png';
import runnerImg from '@/assets/reactions/runner.png';
import energyImg from '@/assets/reactions/energy.png';
import timerImg from '@/assets/reactions/stopwatch.png';
import heartImg from '@/assets/reactions/heart-workout.png';

// Activity-specific reaction images
import mountainImg from '@/assets/reactions/mountain.png';
import compassImg from '@/assets/reactions/compass.png';
import footballImg from '@/assets/reactions/football.png';
import bicycleImg from '@/assets/reactions/bicycle.png';
import lotusImg from '@/assets/reactions/lotus.png';
import boxingGlovesImg from '@/assets/reactions/boxing-gloves.png';
import cricketBatImg from '@/assets/reactions/cricket-bat.png';
import basketballImg from '@/assets/reactions/basketball.png';
import medalImg from '@/assets/reactions/medal.png';
import shuttlecockImg from '@/assets/reactions/shuttlecock.png';

// 3D reaction images for story bar (different assets)
import fire3dImg from '@/assets/reactions/fire-3d.png';
import clap3dImg from '@/assets/reactions/clap-3d.png';
import fistbump3dImg from '@/assets/reactions/fistbump.png';

export const ALL_REACTION_IMAGES: Record<ReactionType, string> = {
  heart: heartImg,
  fire: fireImg,
  clap: clapImg,
  fistbump: fistbumpImg,
  wow: wowImg,
  flex: flexImg,
  trophy: trophyImg,
  runner: runnerImg,
  energy: energyImg,
  timer: timerImg,
  mountain: mountainImg,
  compass: compassImg,
  football: footballImg,
  bicycle: bicycleImg,
  lotus: lotusImg,
  'boxing-gloves': boxingGlovesImg,
  'cricket-bat': cricketBatImg,
  basketball: basketballImg,
  medal: medalImg,
  shuttlecock: shuttlecockImg,
};

export const STORY_BAR_IMAGES = {
  fire: fire3dImg,
  clap: clap3dImg,
  fistbump: fistbump3dImg,
  wow: wowImg,
};

// Core reactions (always shown)
export const CORE_REACTIONS: ReactionType[] = ['fire', 'clap', 'fistbump', 'flex', 'trophy', 'runner', 'energy', 'timer', 'heart', 'wow'];

// Activity-specific reactions mapping
export const ACTIVITY_REACTIONS: Record<string, { reactions: ReactionType[]; label: string }> = {
  'Trekking': { reactions: ['mountain', 'compass', 'medal'], label: 'Trekking' },
  'Football': { reactions: ['football', 'medal'], label: 'Football' },
  'Cycling': { reactions: ['bicycle', 'medal'], label: 'Cycling' },
  'Yoga': { reactions: ['lotus'], label: 'Yoga' },
  'Boxing': { reactions: ['boxing-gloves', 'medal'], label: 'Boxing' },
  'HRX': { reactions: ['boxing-gloves', 'medal'], label: 'HRX' },
  'Cricket': { reactions: ['cricket-bat', 'medal'], label: 'Cricket' },
  'Basketball': { reactions: ['basketball', 'medal'], label: 'Basketball' },
  'Running': { reactions: ['runner', 'medal'], label: 'Running' },
  'Racquet Sports': { reactions: ['shuttlecock', 'medal'], label: 'Racquet Sports' },
};

export const REACTION_LABELS: Record<string, string> = {
  heart: '❤️ loved',
  fire: '🔥 fired up',
  clap: '👏 applauded',
  fistbump: '🤜 fist bumped',
  wow: '😮 wowed at',
  flex: '💪 flexed on',
  trophy: '🏆 celebrated',
  runner: '🏃 cheered',
  energy: '⚡ energized',
  timer: '⏱️ timed',
};

export const REACTION_VERBS: Record<string, string> = {
  heart: 'loved',
  fire: 'fired up',
  clap: 'applauded',
  fistbump: 'fist bumped',
  wow: 'wowed at',
  flex: 'flexed on',
  trophy: 'celebrated',
  runner: 'cheered',
  energy: 'energized',
  timer: 'timed',
};
