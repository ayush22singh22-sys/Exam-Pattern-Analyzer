"use client";

import { motion } from "framer-motion";

export default function JJKBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Infinite Void Minimalist Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
          transform: "perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)",
          transformOrigin: "top center",
        }}
      />

      {/* Hollow Purple Ambient Aura (Gojo) */}
      <motion.div 
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[150px] opacity-20"
        style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, rgba(59, 130, 246, 0.4) 50%, transparent 80%)" }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Cursed Energy Crimson Aura (Sukuna) */}
      <motion.div 
        className="absolute top-[30%] -right-[15%] w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[150px] opacity-10"
        style={{ background: "radial-gradient(circle, rgba(225, 29, 72, 0.8) 0%, rgba(159, 18, 57, 0.4) 50%, transparent 80%)" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Minimalist Dismantle/Cleave Slashes (Sukuna) */}
      <div className="absolute top-0 right-0 w-full h-full opacity-[0.04]">
        <motion.div 
          className="absolute top-[10%] right-[20%] w-[40vw] h-[2px] bg-white rotate-[-35deg]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "circOut", delay: 1 }}
          style={{ transformOrigin: "right" }}
        />
        <motion.div 
          className="absolute top-[15%] right-[10%] w-[50vw] h-[1px] bg-white rotate-[-35deg]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "circOut", delay: 1.2 }}
          style={{ transformOrigin: "right" }}
        />
        <motion.div 
          className="absolute top-[22%] right-[25%] w-[35vw] h-[3px] bg-white rotate-[-35deg]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "circOut", delay: 1.4 }}
          style={{ transformOrigin: "right" }}
        />
      </div>

      {/* Floating Black Flash Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: Math.random() > 0.8 ? "0 0 10px 2px rgba(225, 29, 72, 0.5)" : "none"
          }}
          animate={{
            y: [0, -100],
            opacity: [0, Math.random() * 0.5 + 0.2, 0],
            scale: [0, Math.random() * 2 + 1, 0]
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
        />
      ))}
      {/* Anime Character Watermarks */}
      <div className="absolute inset-0 pointer-events-none z-[1] flex justify-between items-end opacity-[0.25] mix-blend-screen px-10 pb-0"
           style={{ maskImage: "linear-gradient(to top, black 10%, transparent 80%)", WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 80%)" }}
      >
        <motion.img 
          src="/luffy-bg.png" 
          alt="Luffy Background"
          className="w-auto h-[65vh] max-w-[45vw] object-contain object-bottom"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        />
        <motion.img 
          src="/yuji-bg.png" 
          alt="Yuji Background"
          className="w-auto h-[65vh] max-w-[45vw] object-contain object-bottom"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
        />
      </div>
    </div>
  );
}
