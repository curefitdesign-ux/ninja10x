import { motion } from "framer-motion";

const GradientMeshBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#0a0a12]" />
      
      {/* Gradient orbs with slow drift animation */}
      {/* Top-left warm purple/brown orb */}
      <motion.div
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -15, 10, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(280, 30%, 35%, 0.5) 0%, hsla(320, 25%, 25%, 0.3) 40%, transparent 70%)',
          top: '-10%',
          left: '-5%',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Top-right muted blue orb */}
      <motion.div
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 20, -10, 0],
          scale: [1, 0.95, 1.03, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute w-[450px] h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(220, 45%, 40%, 0.5) 0%, hsla(240, 35%, 30%, 0.3) 40%, transparent 70%)',
          top: '5%',
          right: '-10%',
          filter: 'blur(70px)',
        }}
      />
      
      {/* Mid-left purple accent */}
      <motion.div
        animate={{
          x: [0, 15, -20, 0],
          y: [0, -25, 15, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(260, 35%, 35%, 0.45) 0%, hsla(280, 30%, 25%, 0.25) 40%, transparent 70%)',
          top: '25%',
          left: '10%',
          filter: 'blur(75px)',
        }}
      />
      
      {/* Center-right teal/green subtle orb */}
      <motion.div
        animate={{
          x: [0, -20, 10, 0],
          y: [0, 15, -20, 0],
          scale: [1, 0.97, 1.04, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(180, 30%, 30%, 0.35) 0%, hsla(200, 25%, 25%, 0.2) 40%, transparent 70%)',
          top: '45%',
          right: '5%',
          filter: 'blur(65px)',
        }}
      />
      
      {/* Bottom deep blue orb */}
      <motion.div
        animate={{
          x: [0, 30, -15, 0],
          y: [0, -10, 20, 0],
          scale: [1, 1.02, 0.96, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(230, 40%, 25%, 0.45) 0%, hsla(250, 35%, 20%, 0.25) 40%, transparent 70%)',
          bottom: '-15%',
          left: '20%',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Bottom-right subtle purple */}
      <motion.div
        animate={{
          x: [0, -18, 25, 0],
          y: [0, 25, -15, 0],
          scale: [1, 0.98, 1.05, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(270, 30%, 30%, 0.4) 0%, hsla(290, 25%, 22%, 0.2) 40%, transparent 70%)',
          bottom: '5%',
          right: '-5%',
          filter: 'blur(70px)',
        }}
      />
      
      {/* Grain/Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Additional fine grain layer */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='turbulence' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5, 5, 10, 0.6) 100%)',
        }}
      />
    </div>
  );
};

export default GradientMeshBackground;
