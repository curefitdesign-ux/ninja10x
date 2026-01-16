import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Plus, ArrowRight, Home, Dumbbell, Activity as ActivityIcon, ShoppingBag, Users, Flame, Footprints } from "lucide-react";

// Import assets
import curoMascot from "@/assets/activity-page/curo-mascot.png";
import bookClassIcon from "@/assets/activity-page/book-class-icon.png";
import checkinGymIcon from "@/assets/activity-page/checkin-gym-icon.png";
import playSportsIcon from "@/assets/activity-page/play-sports-icon.png";
import workoutAtHomeIcon from "@/assets/activity-page/workout-at-home-icon.png";
import connectFitnessDevice from "@/assets/activity-page/connect-fitness-device.png";
import workoutWithFriends from "@/assets/activity-page/workout-with-friends.png";
import smartWorkoutPlan from "@/assets/activity-page/smart-workout-plan.png";

const Activity = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("activity");

  const activities = [
    { id: "book", label: "book a cult\nclass", icon: bookClassIcon },
    { id: "checkin", label: "checkin at\ngym", icon: checkinGymIcon },
    { id: "play", label: "play a\nsport", icon: playSportsIcon },
    { id: "workout", label: "workout\nat home", icon: workoutAtHomeIcon },
  ];

  const fitnessPrograms = [
    { id: 1, title: "YOGA", subtitle: "FOR BEGINNERS", gradient: "from-purple-900/80 to-purple-600/60" },
    { id: 2, title: "WORKOUT", subtitle: "FOR BEGINNERS", gradient: "from-slate-700/80 to-slate-500/60" },
    { id: 3, title: "Belly\nBurn", subtitle: "", gradient: "from-rose-800/80 to-rose-500/60" },
    { id: 4, title: "walk\nfitness", subtitle: "", gradient: "from-amber-700/80 to-amber-400/60" },
    { id: 5, title: "CULT\nJUNIOR", subtitle: "", gradient: "from-indigo-900/80 to-indigo-600/60" },
    { id: 6, title: "Prenatal\nYoga", subtitle: "", gradient: "from-cyan-700/80 to-cyan-400/60" },
  ];

  const navItems = [
    { id: "home", icon: Home, label: "HOME" },
    { id: "fitness", icon: Dumbbell, label: "FITNESS" },
    { id: "activity", icon: ActivityIcon, label: "ACTIVITY", isCenter: true },
    { id: "store", icon: ShoppingBag, label: "STORE" },
    { id: "social", icon: Users, label: "SOCIAL" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Scrollable Content */}
      <div className="pb-24 overflow-y-auto">
        {/* Stats Header */}
        <div className="px-4 pt-4">
          <div className="flex gap-3">
            {/* Days Streak */}
            <div className="flex-1 bg-gradient-to-br from-[#1a1a2e] to-[#16161a] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-white">4</span>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider mt-1">DAYS STREAK</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            {/* Weekly Activity */}
            <div className="flex-1 bg-gradient-to-br from-[#1a1a2e] to-[#16161a] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-white">5<span className="text-white/40">/3</span></span>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider mt-1">WEEKLY ACTIVITY</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Footprints className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mascot Section */}
        <div className="relative px-4 mt-6">
          <div className="relative flex flex-col items-center">
            {/* Circular Progress Ring */}
            <div className="relative w-48 h-48">
              {/* Progress circle background */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset="70"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="50%" stopColor="#22d3d1" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Ring markers */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4 rounded-full bg-[#1a1a2e] border-2 border-cyan-400/60" />
              <div className="absolute top-0 right-4 w-4 h-4 rounded-full bg-[#1a1a2e] border-2 border-green-400/60" />
              
              {/* Mascot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={curoMascot} 
                  alt="Curo mascot" 
                  className="w-32 h-32 object-contain drop-shadow-2xl"
                />
              </div>
              
              {/* Week indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/40 whitespace-nowrap">
                Cult ninja • Week 1 • Day 1
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
              <p className="text-sm text-white/80">
                Hey, I'm Curo.<br />
                Let's build a workout together!
              </p>
            </div>
          </div>
        </div>

        {/* Photo Slots Section */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-center gap-2">
            {/* Photo slots */}
            <div className="flex items-center">
              {[1, 2, 3, 4].map((_, idx) => (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br from-[#2a2a3e] to-[#1a1a2e] border border-white/10 ${idx > 0 ? '-ml-2' : ''} flex items-center justify-center overflow-hidden`}
                  style={{ transform: `rotate(${(idx - 1.5) * 5}deg)` }}
                >
                  <Plus className="w-4 h-4 text-white/30" />
                </div>
              ))}
            </div>
            
            {/* Play Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="ml-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
              onClick={() => navigate("/")}
            >
              <Play className="w-5 h-5 text-white fill-white" />
            </motion.button>
          </div>
        </div>

        {/* Activities Section */}
        <div className="px-4 mt-8">
          <p className="text-center text-white/70 text-sm mb-4">
            Do any of the following<br />
            activities today
          </p>
          
          <div className="grid grid-cols-4 gap-3">
            {activities.map((activity) => (
              <motion.button
                key={activity.id}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a2e] border border-white/10 flex items-center justify-center mb-2 overflow-hidden">
                  <img 
                    src={activity.icon} 
                    alt={activity.label}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-[10px] text-white/60 text-center whitespace-pre-line leading-tight">
                  {activity.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Feature Cards Row */}
        <div className="px-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Connect Fitness Device */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="relative aspect-square rounded-3xl overflow-hidden"
            >
              <img 
                src={connectFitnessDevice}
                alt="Connect Fitness device"
                className="w-full h-full object-cover"
              />
            </motion.button>

            {/* Workout With Friends */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="relative aspect-square rounded-3xl overflow-hidden"
            >
              <img 
                src={workoutWithFriends}
                alt="Workout With Friends"
                className="w-full h-full object-cover"
              />
            </motion.button>
          </div>
        </div>

        {/* Smart Workout Plan */}
        <div className="px-4 mt-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="relative w-full h-28 rounded-3xl overflow-hidden"
          >
            <img 
              src={smartWorkoutPlan}
              alt="Smart workout plan"
              className="w-full h-full object-cover"
            />
          </motion.button>
        </div>

        {/* Fitness Programs Section */}
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Fitness Programs</h2>
            <ArrowRight className="w-5 h-5 text-white/60" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {fitnessPrograms.map((program) => (
              <motion.button
                key={program.id}
                whileTap={{ scale: 0.98 }}
                className={`relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br ${program.gradient}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-left">
                  <h3 className="text-xl font-bold text-white whitespace-pre-line leading-tight">
                    {program.title}
                  </h3>
                  {program.subtitle && (
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">
                      {program.subtitle}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5">
          <div className="flex items-center justify-around py-2 px-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}>
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-2xl ${
                  item.isCenter && activeTab === item.id
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                    : ''
                }`}
              >
                {item.isCenter && activeTab === item.id ? (
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full blur opacity-60" />
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-white" />
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
