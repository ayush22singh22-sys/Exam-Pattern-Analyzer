"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const characters = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    image: "/mini_luffy.png",
    quote: "Study hard! We're gonna be the Kings of Exams!",
  },
  {
    id: "yuji",
    name: "Yuji Itadori",
    image: "/mini_yuji.png",
    quote: "Let's exorcise these hard questions together!",
  },
  {
    id: "levi",
    name: "Levi Ackerman",
    image: "/mini_levi.png",
    quote: "Make a choice you won't regret. Keep studying.",
  }
];

export default function AnimeCharacters() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % characters.length);
    }, 8000); // Change character every 8 seconds
    return () => clearInterval(interval);
  }, []);

  const current = characters[currentIndex];

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex items-end gap-3 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative pointer-events-auto"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-full left-4 mb-4 w-48 bg-black/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl rounded-bl-sm shadow-xl"
          >
            <p className="text-xs font-medium text-white leading-relaxed">"{current.quote}"</p>
            <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider font-bold">{current.name}</p>
          </motion.div>
          
          <div 
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-pointer hover:border-white transition-colors" 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % characters.length)}
            title="Click to change character!"
          >
            <img 
              src={current.image} 
              alt={current.name} 
              className="w-full h-full object-cover bg-black"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
