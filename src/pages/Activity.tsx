import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Home, Dumbbell, Activity as ActivityIcon, ShoppingBag, Users, Flame, Footprints } from "lucide-react";
import CircularProgressRing from "@/components/CircularProgressRing";
import GradientMeshBackground from "@/components/GradientMeshBackground";
import PullToRefresh from "@/components/PullToRefresh";
import PhotoLoggingWidget from "@/components/PhotoLoggingWidget";
// Import new activity icons
import bookClassIcon from "@/assets/activity-icons/book-class.png";
import checkinGymIcon from "@/assets/activity-icons/checkin-gym.png";
import playSportsIcon from "@/assets/activity-icons/play-sports.png";
import workoutAtHomeIcon from "@/assets/activity-icons/workout-home.png";
// Import feature assets
import connectFitnessDevice from "@/assets/activity-page/connect-fitness-device.png";
import workoutWithFriends from "@/assets/activity-page/workout-with-friends.png";
import smartWorkoutPlan from "@/assets/activity-page/smart-workout-plan.png";
// Fitness program images
import yogaBeginners from "@/assets/programs/yoga-beginners.png";
import workoutBeginners from "@/assets/programs/workout-beginners.png";
import bellyBurn from "@/assets/programs/belly-burn.png";
import walkFitness from "@/assets/programs/walk-fitness.png";
import cultJunior from "@/assets/programs/cult-junior.png";
import prenatalYoga from "@/assets/programs/prenatal-yoga.png";

const Activity = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("activity");

  const activities = [
    { id: "book", label: "book a cult\nclass", icon: bookClassIcon },
    { id: "checkin", label: "checkin at\ngym", icon: checkinGymIcon },
    { id: "play", label: "play a\nsport", icon: playSportsIcon },
    { id: "workout", label: "workout\nat home", icon: workoutAtHomeIcon },
  ];

  const handleRefresh = useCallback(async () => {
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Could refetch data here
  }, []);

  const fitnessPrograms = [
    { id: 1, image: yogaBeginners },
    { id: 2, image: workoutBeginners },
    { id: 3, image: bellyBurn },
    { id: 4, image: walkFitness },
    { id: 5, image: cultJunior },
    { id: 6, image: prenatalYoga },
  ];

  const navItems = [
    { id: "home", icon: Home, label: "HOME" },
    { id: "fitness", icon: Dumbbell, label: "FITNESS" },
    { id: "activity", icon: ActivityIcon, label: "ACTIVITY", isCenter: true },
    { id: "store", icon: ShoppingBag, label: "STORE" },
    { id: "social", icon: Users, label: "SOCIAL" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-x-hidden relative">
      {/* Gradient Mesh Background */}
      <GradientMeshBackground />
      
      {/* Pull to Refresh Wrapper */}
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Scrollable Content */}
        <div className="relative z-10 pb-28 pt-2">
          {/* Stats Header - Glassmorphic */}
          <div className="px-4 pt-4">
          <div className="flex gap-3">
            {/* Days Streak */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 relative group"
            >
              {/* Liquid glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-500/30 via-red-500/20 to-transparent rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative bg-white/[0.08] backdrop-blur-xl rounded-3xl p-4 border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-white drop-shadow-lg">4</span>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">DAYS STREAK</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                    <Flame className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Weekly Activity */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1 relative group"
            >
              {/* Liquid glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-transparent rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative bg-white/[0.08] backdrop-blur-xl rounded-3xl p-4 border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-white drop-shadow-lg">5<span className="text-white/40">/3</span></span>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">WEEKLY ACTIVITY</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    <Footprints className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mascot Section with Circular Progress */}
        <div className="relative px-4 mt-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            {/* Pixel-perfect Circular Progress Ring */}
            <CircularProgressRing 
              currentDay={1} 
              currentWeek={1}
            />

            {/* Chat Bubble - Enhanced glassmorphic */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-4 relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-60" />
              <div className="relative bg-white/[0.1] backdrop-blur-xl rounded-2xl px-6 py-3 text-center border border-white/[0.15] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <p className="text-sm text-white/90">
                  Hey, I'm Curo.<br />
                  Let's build a workout together!
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Photo Logging Widget - 12 cards in 4 clusters */}
        <div className="mt-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PhotoLoggingWidget />
          </motion.div>
        </div>

        {/* Activities Section - Glassmorphic */}
        <div className="px-4 mt-10">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-center text-white/70 text-sm mb-4"
          >
            Do any of the following<br />
            activities today
          </motion.p>
          
          <div className="grid grid-cols-4 gap-3">
            {activities.map((activity, idx) => (
              <motion.button
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + idx * 0.05 }}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="flex flex-col items-center group"
              >
                <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                  <img 
                    src={activity.icon} 
                    alt={activity.label}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <span className="text-[10px] text-white/60 text-center whitespace-pre-line leading-tight group-hover:text-white/80 transition-colors">
                  {activity.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Feature Cards Row */}
        <div className="px-4 mt-10">
          <div className="grid grid-cols-2 gap-3">
            {/* Connect Fitness Device */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <img 
                src={connectFitnessDevice}
                alt="Connect Fitness device"
                className="w-full h-auto object-contain"
              />
            </motion.button>

            {/* Workout With Friends */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <img 
                src={workoutWithFriends}
                alt="Workout With Friends"
                className="w-full h-auto object-contain"
              />
            </motion.button>
          </div>
        </div>

        {/* Smart Workout Plan */}
        <div className="px-4 mt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="relative w-full rounded-3xl overflow-hidden"
          >
            <img 
              src={smartWorkoutPlan}
              alt="Smart workout plan"
              className="w-full h-auto object-contain"
            />
          </motion.button>
        </div>

        {/* Fitness Programs Section */}
        <div className="px-4 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Fitness Programs</h2>
            <ArrowRight className="w-5 h-5 text-white/60" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {fitnessPrograms.map((program) => (
              <motion.button
                key={program.id}
                whileTap={{ scale: 0.98 }}
                className="relative aspect-[4/5] rounded-2xl overflow-hidden"
              >
                <img 
                  src={program.image} 
                  alt={`Fitness program ${program.id}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </div>
        </div>
      </PullToRefresh>

      {/* Bottom Navigation - Glassmorphic Liquid */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Glow effect behind nav */}
        <div className="absolute inset-x-0 -top-4 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="relative bg-white/[0.08] backdrop-blur-2xl border-t border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_-8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-around py-2 px-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}>
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-2xl transition-all duration-200 ${
                  item.isCenter && activeTab === item.id
                    ? ''
                    : ''
                }`}
              >
                {item.isCenter && activeTab === item.id ? (
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/50 to-pink-500/50 rounded-full blur-lg" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.5)]">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-[10px] mt-1 ${activeTab === item.id ? 'text-white' : 'text-white/40'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activity;
