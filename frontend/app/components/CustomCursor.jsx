"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const trailX = useMotionValue(-100);
  const trailY = useMotionValue(-100);

  const springX = useSpring(trailX, { damping: 25, stiffness: 200, mass: 0.5 });
  const springY = useSpring(trailY, { damping: 25, stiffness: 200, mass: 0.5 });

  const dotRef = useRef(null);
  const isHovering = useRef(false);

  useEffect(() => {
    const handleMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      trailX.set(e.clientX);
      trailY.set(e.clientY);
    };

    const handleEnter = () => {
      isHovering.current = true;
      if (dotRef.current) {
        dotRef.current.style.transform = "translate(-50%, -50%) scale(2.5)";
        dotRef.current.style.opacity = "0.4";
      }
    };

    const handleLeave = () => {
      isHovering.current = false;
      if (dotRef.current) {
        dotRef.current.style.transform = "translate(-50%, -50%) scale(1)";
        dotRef.current.style.opacity = "1";
      }
    };

    window.addEventListener("mousemove", handleMove);

    const interactives = document.querySelectorAll("a, button, [data-magnetic]");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
    });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      });
    };
  }, [cursorX, cursorY, trailX, trailY]);

  return (
    <>
      {/* Main dot */}
      <motion.div
        ref={dotRef}
        className="fixed pointer-events-none z-[10000] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 0 20px rgba(255,255,255,0.4), 0 0 40px rgba(255,255,255,0.15)",
          translateX: "-50%",
          translateY: "-50%",
          transition: "transform 0.2s ease, opacity 0.2s ease",
        }}
      />

      {/* Trail ring */}
      <motion.div
        className="fixed pointer-events-none z-[9999] hidden md:block"
        style={{
          x: springX,
          y: springY,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.2)",
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
