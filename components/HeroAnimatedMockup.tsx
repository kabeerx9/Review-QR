'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function HeroAnimatedMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 3500); // 3.5 seconds per step
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="flex-1 relative w-full max-w-[280px] lg:max-w-[320px] mx-auto lg:ml-auto mt-8 lg:mt-0">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-orange-200/50 via-white/50 to-blue-200/50 rounded-full blur-[60px] -z-10" />
      
      <div className="relative rounded-[2.5rem] lg:rounded-[3rem] border-[8px] lg:border-[10px] border-slate-900 bg-white shadow-2xl overflow-hidden aspect-[9/19] max-h-[600px]">
        {/* Dynamic Island */}
        <div className="absolute top-0 inset-x-0 h-7 bg-slate-900 rounded-b-3xl w-1/3 mx-auto z-20" />
        
        <div className="absolute inset-0 p-4 lg:p-6 pt-12 lg:pt-16 flex flex-col bg-slate-50">
          <div className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-8 bg-white p-3 lg:p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl lg:text-2xl shadow-inner shrink-0">
              🏨
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base lg:text-lg leading-tight">Grand Horizon Hotel</h3>
              <p className="text-[10px] lg:text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Rate your stay</p>
            </div>
          </div>

          <div className="space-y-6 flex-1 relative">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center"
                >
                  <h4 className="font-black text-slate-800 mb-3 lg:mb-4 text-center text-base lg:text-lg">How was your visit?</h4>
                  <div className="flex gap-1 lg:gap-2 text-2xl lg:text-3xl text-slate-200">★★★★★</div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center relative"
                >
                  <h4 className="font-black text-slate-800 mb-3 lg:mb-4 text-center text-base lg:text-lg">How was your visit?</h4>
                  <div className="flex gap-1 lg:gap-2 text-2xl lg:text-3xl text-orange-400 drop-shadow-sm">
                    {[1, 2, 3, 4, 5].map((star, i) => (
                      <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}>★</motion.div>
                    ))}
                  </div>
                  {/* Simulated Cursor */}
                  <motion.div 
                    initial={{ x: 0, y: 100, opacity: 0 }}
                    animate={{ x: 80, y: 50, opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute z-10"
                  >
                    <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/30 blur-sm" />
                    <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 shadow-lg ring-2 ring-white" />
                  </motion.div>
                </motion.div>
              )}

              {(step === 2 || step === 3) && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative"
                >
                  <div className="absolute -top-3 left-4 bg-emerald-100 text-emerald-700 text-[9px] lg:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                    AI Auto-Draft
                  </div>
                  <div className="flex gap-1 text-lg lg:text-xl text-orange-400 mb-2 lg:mb-3">★★★★★</div>
                  <motion.p 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="text-xs lg:text-sm text-slate-600 font-medium leading-relaxed italic overflow-hidden"
                  >
                    &ldquo;The stay was absolutely fantastic! The room was spotless, the service was fast, and the breakfast buffet was delicious. Highly recommend!&rdquo;
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-auto relative z-10 pb-4">
            <motion.div 
              animate={step === 3 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: step === 3 ? Infinity : 0, duration: 2 }}
              className={`w-full py-3 lg:py-4 rounded-xl lg:rounded-2xl text-white font-bold text-center flex justify-center items-center gap-2 transition-colors text-sm lg:text-base ${step >= 2 ? 'bg-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.3)]' : 'bg-slate-300'}`}
            >
              <span className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-black ${step >= 2 ? 'bg-white text-blue-600' : 'bg-slate-400 text-white'}`}>G</span>
              Post to Google
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
