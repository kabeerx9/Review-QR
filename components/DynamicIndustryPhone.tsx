'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function DynamicIndustryPhone({ activeNiche }: { activeNiche: any }) {
  const [stars, setStars] = useState(0);
  const [showReview, setShowReview] = useState(false);

  // Reset state when niche changes
  useEffect(() => {
    setStars(0);
    setShowReview(false);
  }, [activeNiche]);

  const handleStarClick = (rating: number) => {
    setStars(rating);
    setShowReview(false);
  };

  const handleContinue = () => {
    setShowReview(true);
  };

  const predefinedReviews: Record<string, string> = {
    hotel: "The room was beautiful and the service was top notch! Highly recommend.",
    jewel: "Absolutely stunning designs and very polite staff. Great experience.",
    rest: "The food was delicious and the ambiance was perfect for a family dinner.",
    salon: "Loved my new haircut! The stylist really understood what I wanted.",
    gym: "Great equipment and very motivating trainers. Best gym in the area.",
    clinic: "The doctor was very patient and the clinic was extremely hygienic.",
  };

  const reviewText = predefinedReviews[activeNiche.id] || "Great experience!";

  return (
    <div className="bg-slate-50 rounded-[2rem] lg:rounded-[3rem] border border-slate-200 p-6 lg:p-8 shadow-inner relative h-[380px] lg:h-[500px] flex items-center justify-center overflow-hidden w-full">
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeNiche.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative z-10 flex flex-col h-full max-h-[420px]"
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{activeNiche.emoji}</div>
            <h5 className="font-black text-slate-900 text-xl">{activeNiche.mockup.title}</h5>
            <p className="text-xs text-slate-500 font-bold mt-1">Tap the stars to rate</p>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto">
            {activeNiche.mockup.cats.map((cat: string, i: number) => (
              <div key={i} className="flex flex-col items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-600 uppercase tracking-widest text-[10px] mb-2">{cat}</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(star)}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={star <= stars ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className={`h-7 w-7 transition-colors ${
                          star <= stars ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <AnimatePresence>
            {stars > 0 && !showReview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 pt-2"
              >
                <button 
                  onClick={handleContinue}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-center shadow-lg active:scale-95 transition-transform"
                >
                  Continue →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Child Screen Bottom Sheet */}
          <AnimatePresence>
            {showReview && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] rounded-3xl"
                  onClick={() => setShowReview(false)}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-[2rem] rounded-b-3xl bg-white p-5 pb-6 shadow-2xl border-t border-slate-100"
                >
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
                  <h4 className="text-center text-lg font-black text-slate-900">Post your review</h4>
                  <p className="mt-1 text-center text-xs text-slate-500 font-bold">This helps others discover us.</p>
                  
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex gap-1 text-amber-400 mb-2">
                      {[1, 2, 3, 4, 5].map((_, i) => (
                        <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm italic text-slate-700 font-medium">"{reviewText}"</p>
                  </div>

                  <button className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] active:scale-95 transition-transform">
                    <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">G</span>
                    Post on Google
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
