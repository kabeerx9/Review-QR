'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NOTIFICATIONS = [
  { name: 'Rahul', action: 'just received a 5-star Google Review', time: 'Just now', icon: '🌟' },
  { name: 'Spice Garden', action: 'generated 12 reviews today', time: '2m ago', icon: '🚀' },
  { name: 'Glow Salon', action: 'intercepted a 1-star review privately', time: '5m ago', icon: '🛡️' },
  { name: 'Amit', action: 'started a free trial', time: '12m ago', icon: '🎉' },
];

export function LiveToasts() {
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    const showNextToast = () => {
      // Pick a random toast that isn't the current one
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * NOTIFICATIONS.length);
      } while (nextIndex === currentIndex && NOTIFICATIONS.length > 1);
      
      setCurrentIndex(nextIndex);

      // Hide after 4 seconds
      setTimeout(() => {
        setCurrentIndex(-1);
      }, 4000);
    };

    // Show first toast after 3 seconds
    const initialDelay = setTimeout(showNextToast, 3000);

    // Then loop every 12-20 seconds
    const interval = setInterval(() => {
      showNextToast();
    }, 15000 + Math.random() * 5000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [currentIndex]);

  return (
    <div className="fixed top-24 left-6 right-6 md:top-auto md:bottom-6 md:left-6 md:right-auto z-50 pointer-events-none flex justify-center md:justify-start">
      <AnimatePresence>
        {currentIndex >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-sm pointer-events-auto"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl shrink-0">
              {NOTIFICATIONS[currentIndex].icon}
            </div>
            <div>
              <p className="text-sm text-slate-800 leading-snug">
                <span className="font-bold">{NOTIFICATIONS[currentIndex].name}</span> {NOTIFICATIONS[currentIndex].action}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {NOTIFICATIONS[currentIndex].time}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
