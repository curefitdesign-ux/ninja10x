import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { LayoutGroup } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import NotificationCenter from "@/components/NotificationCenter";
import ReactionNotificationPill from "@/components/ReactionNotificationPill";
import BottomNavBar from "@/components/BottomNavBar";
import Index from "./pages/Index";
import Preview from "./pages/Preview";
import Activity from "./pages/Activity";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import Progress from "./pages/Progress";
import Camera from "./pages/Camera";
import Gallery from "./pages/Gallery";

import Reel from "./pages/Reel";
import ReelGenerationBase from "./pages/ReelGeneration";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import AvatarCrop from "./pages/AvatarCrop";
import PageTransition from "./components/PageTransition";
import { enableAutoMotion } from "@/lib/motion";

const queryClient = new QueryClient();

// Protected route wrapper that also checks for profile
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading, session } = useAuth();
  const { needsSetup, loading: profileLoading } = useProfile();
  
  // Wait for auth to fully initialize before making any decisions
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }
  
  // Only redirect if we're certain there's no session (auth is done loading)
  if (!session && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for profile check if we have a user
  if (user && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (needsSetup) {
    return <Navigate to="/profile-setup" replace />;
  }
  
  return <>{children}</>;
};

// Route for profile setup (handles both new setup and edit mode)
const ProfileSetupRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { needsSetup, loading: profileLoading } = useProfile();
  const location = useLocation();
  const isEditMode = new URLSearchParams(location.search).get('edit') === 'true';
  
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If profile exists and not in edit mode, redirect to home
  if (!needsSetup && !isEditMode) {
    return <Navigate to="/reel" replace />;
  }
  
  return <>{children}</>;
};

// Force ReelGeneration to fully remount on every navigation (location.key changes per navigate call)
const ReelGeneration = () => {
  const location = useLocation();
  return <ReelGenerationBase key={location.key} />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <LayoutGroup>
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile-setup" element={<ProfileSetupRouteWrapper><ProfileSetupPage /></ProfileSetupRouteWrapper>} />
          <Route path="/avatar-crop" element={<ProtectedRoute><AvatarCrop /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/reel" replace />} />
          <Route path="/create" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/preview" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/camera" element={<ProtectedRoute><Camera /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          
          <Route path="/reel" element={<ProtectedRoute><Reel /></ProtectedRoute>} />
          <Route path="/reel-generation" element={<ProtectedRoute><ReelGeneration /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </LayoutGroup>
  );
};

const App = () => {
  useEffect(() => enableAutoMotion(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationCenter />
          <ReactionNotificationPill />
          <AnimatedRoutes />
          <BottomNavBar />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
