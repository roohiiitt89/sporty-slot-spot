"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ArrowRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

// SVG silhouettes for swimming, football, badminton, basketball, tennis, cricket, volleyball, running
const silhouettes = [
  // Swimming
  <svg key="swimming" viewBox="0 0 64 32" className="absolute left-2 top-4 w-28 h-10 sm:w-36 sm:h-16 md:w-48 md:h-24 opacity-40 text-emerald-500 animate-float-slow" fill="none"><path d="M8 28c4 0 8-4 12-4s8 4 12 4 8-4 12-4 8 4 12 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/><ellipse cx="32" cy="16" rx="6" ry="2" fill="currentColor"/><path d="M28 14c-2-4 4-8 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>,
  // Football (soccer)
  <svg key="football" viewBox="0 0 64 64" className="absolute right-2 top-16 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 opacity-35 text-emerald-400 animate-float-medium" fill="none"><circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="3" fill="none"/><circle cx="32" cy="32" r="6" fill="currentColor"/><path d="M32 16v12m0 8v12m-12-12h12m8 0h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  // Badminton
  <svg key="badminton" viewBox="0 0 64 64" className="absolute left-1/2 bottom-4 w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 opacity-30 text-emerald-600 animate-float-fast" fill="none"><ellipse cx="48" cy="16" rx="4" ry="8" transform="rotate(30 48 16)" fill="currentColor"/><rect x="14" y="44" width="24" height="4" rx="2" transform="rotate(-30 14 44)" fill="currentColor"/><rect x="36" y="12" width="4" height="24" rx="2" transform="rotate(30 36 12)" fill="currentColor"/></svg>,
  // Basketball
  <svg key="basketball" viewBox="0 0 64 64" className="absolute left-8 bottom-20 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 opacity-40 text-emerald-700 animate-float-medium" fill="none"><circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="3" fill="none"/><path d="M16 32c8 0 16 8 32 0" stroke="currentColor" strokeWidth="2"/><path d="M32 16c0 8 0 24 0 32" stroke="currentColor" strokeWidth="2"/></svg>,
  // Tennis
  <svg key="tennis" viewBox="0 0 64 64" className="absolute right-16 top-4 w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 opacity-35 text-emerald-300 animate-float-fast" fill="none"><ellipse cx="48" cy="16" rx="8" ry="4" fill="currentColor"/><rect x="14" y="44" width="24" height="4" rx="2" transform="rotate(-30 14 44)" fill="currentColor"/></svg>,
  // Cricket
  <svg key="cricket" viewBox="0 0 64 64" className="absolute left-2 bottom-2 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 opacity-40 text-emerald-400 animate-float-slow" fill="none"><rect x="40" y="10" width="4" height="36" rx="2" transform="rotate(20 40 10)" fill="currentColor"/><circle cx="20" cy="54" r="6" fill="currentColor"/></svg>,
  // Volleyball
  <svg key="volleyball" viewBox="0 0 64 64" className="absolute right-8 bottom-8 w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 opacity-35 text-emerald-500 animate-float-medium" fill="none"><circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="3" fill="none"/><path d="M18 32c8-8 20-8 28 0" stroke="currentColor" strokeWidth="2"/><path d="M32 18c0 8 0 20 0 28" stroke="currentColor" strokeWidth="2"/></svg>,
  // Running
  <svg key="running" viewBox="0 0 64 64" className="absolute right-1/3 top-1/2 w-20 h-10 sm:w-28 sm:h-14 md:w-36 md:h-20 opacity-40 text-emerald-600 animate-float-fast" fill="none"><path d="M20 40c4-8 12-8 16 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/><circle cx="32" cy="24" r="6" fill="currentColor"/><path d="M32 30v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
];

export function AuroraBackgroundDemo() {
  const navigate = useNavigate();
  return (
    <AuroraBackground className="bg-black dark:bg-black">
      {/* Animated sports silhouettes */}
      <div className="pointer-events-none select-none absolute inset-0 z-0">
        {silhouettes}
      </div>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-6 items-center justify-center px-4 z-10"
      >
        {/* Animated headline with blur/fade/emerald highlight */}
        <motion.h1
          initial={{ filter: "blur(8px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-center text-white drop-shadow-lg"
        >
          <span className="bg-gradient-to-r from-emerald-800 via-emerald-500 to-emerald-800 bg-clip-text text-transparent animate-gradient-x">
            Book Your Next
          </span>
          <br />
          <span className="text-emerald-400 animate-text-blur">Sports Slot</span>
        </motion.h1>
        {/* Animated subheadline with shimmer/typewriter */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
          className="font-light text-base sm:text-lg md:text-2xl text-emerald-200 py-2 text-center max-w-2xl animate-shimmer"
        >
          Discover, book, and play at the best venues. <span className="text-emerald-400 font-semibold">Fast. Easy. Anywhere.</span>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.97 }}
          className="bg-emerald-800 hover:bg-emerald-700 transition text-white rounded-full w-fit px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-bold flex items-center gap-2 shadow-2xl border-2 border-emerald-900/60 mt-4"
          onClick={() => navigate("/book")}
        >
          Book a Slot
          <ArrowRight className="ml-1 w-6 h-6" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.97 }}
          className="mt-3 bg-transparent border-2 border-emerald-700 text-emerald-300 hover:bg-emerald-900/20 transition rounded-full w-fit px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-bold flex items-center gap-2 shadow-lg"
          onClick={() => navigate("/challenge")}
        >
          <Activity className="w-6 h-6 mr-2" />
          Challenge Mode
        </motion.button>
      </motion.div>
    </AuroraBackground>
  );
}

// Tailwind custom animations (add to tailwind.config.js):
// animation: {
//   'float-slow': 'float 8s ease-in-out infinite',
//   'float-medium': 'float 5s ease-in-out infinite',
//   'float-fast': 'float 3s ease-in-out infinite',
//   'gradient-x': 'gradient-x 8s ease-in-out infinite',
//   'text-blur': 'text-blur 2s ease-in-out infinite',
//   'shimmer': 'shimmer 2s linear infinite',
// },
// keyframes: {
//   float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
//   'gradient-x': { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
//   'text-blur': { '0%, 100%': { filter: 'blur(2px)' }, '50%': { filter: 'blur(0px)' } },
//   shimmer: { '100%': { backgroundPosition: '200% 0' } },
// }, 
