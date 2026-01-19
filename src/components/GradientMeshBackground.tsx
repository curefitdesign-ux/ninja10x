import { motion } from "framer-motion";

const GradientMeshBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#0d0d14]" />
      
      {/* Top-left dusty mauve/brown orb */}
      <motion.div
        animate={{
          x: [0, 8, -5, 0],
          y: [0, -6, 4, 0],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(20, 15%, 35%, 0.4) 0%, hsla(350, 12%, 28%, 0.25) 35%, transparent 65%)',
          top: '-15%',
          left: '-10%',
          filter: 'blur(100px)',
        }}
      />
      
      {/* Top-right deep navy blue orb */}
      <motion.div
        animate={{
          x: [0, -6, 4, 0],
          y: [0, 5, -4, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute w-[550px] h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(220, 35%, 35%, 0.45) 0%, hsla(230, 30%, 25%, 0.3) 35%, transparent 65%)',
          top: '0%',
          right: '-15%',
          filter: 'blur(90px)',
        }}
      />
      
      {/* Center purple/mauve blend */}
      <motion.div
        animate={{
          x: [0, 5, -8, 0],
          y: [0, -4, 6, 0],
        }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(270, 20%, 30%, 0.35) 0%, hsla(260, 18%, 22%, 0.2) 35%, transparent 65%)',
          top: '30%',
          left: '15%',
          filter: 'blur(95px)',
        }}
      />
      
      {/* Bottom-right subtle teal hint */}
      <motion.div
        animate={{
          x: [0, -4, 6, 0],
          y: [0, 4, -5, 0],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 15,
        }}
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(160, 25%, 25%, 0.3) 0%, hsla(180, 20%, 18%, 0.15) 35%, transparent 65%)',
          bottom: '5%',
          right: '10%',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Bottom deep navy */}
      <motion.div
        animate={{
          x: [0, 6, -4, 0],
          y: [0, -3, 5, 0],
        }}
        transition={{
          duration: 52,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
        className="absolute w-[600px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(230, 30%, 18%, 0.5) 0%, hsla(240, 25%, 12%, 0.3) 40%, transparent 70%)',
          bottom: '-20%',
          left: '0%',
          filter: 'blur(100px)',
        }}
      />
      
      {/* Grain/Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.25] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8, 8, 15, 0.5) 100%)',
        }}
      />
    </div>
  );
};

export default GradientMeshBackground;
