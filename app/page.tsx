"use client";

import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";

// Icons
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 ml-1">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const stats = [
  { value: "4.8★", label: "Average Google Rating" },
  { value: "0", label: "Manual Replies Needed" },
  { value: "10x", label: "More Public Reviews" },
  { value: "2m", label: "Setup Time Required" },
];

const timelineSteps = [
  {
    id: 0,
    title: "The Customer Scans",
    body: "No apps to download. They just point their camera at your elegant acrylic stand right at the billing counter or table.",
    tag: "Step 1",
    visual: (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="relative w-56 h-56 rounded-[2.5rem] bg-white border-4 border-orange-200 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(249,115,22,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]" />
          <svg className="w-20 h-20 text-orange-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          <div className="text-orange-600 font-black text-xs uppercase tracking-widest">Scan Me</div>
        </div>
      </div>
    )
  },
  {
    id: 1,
    title: "1-Click Custom Rating",
    body: "They tap a 5-star rating on their screen. The categories adapt specifically to your business (e.g., Food, Ambience, or Stylist).",
    tag: "Step 2",
    visual: (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-72 bg-white rounded-[2rem] border border-blue-100 shadow-2xl p-8 relative">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg">?</div>
          <h4 className="font-black text-slate-800 mb-6 text-center text-lg">How was your visit?</h4>
          <div className="space-y-5">
            <div className="space-y-2"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Service Quality</p><div className="flex gap-2 text-3xl text-amber-400 drop-shadow-sm">★★★★★</div></div>
            <div className="space-y-2"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cleanliness</p><div className="flex gap-2 text-3xl text-amber-400 drop-shadow-sm">★★★★★</div></div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "AI Writes the Review",
    body: "Instead of staring at a blank box, our AI instantly drafts a glowing, perfectly natural review for them in seconds. They just click 'Post'.",
    tag: "Step 3",
    visual: (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="w-72 bg-white rounded-[2.5rem] border border-emerald-100 shadow-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black">AI</div>
            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Auto-Drafted</p>
          </div>
          <p className="text-base text-slate-700 italic font-medium leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">&ldquo;Such an amazing experience! The staff was super friendly and the quality was top notch. Will definitely visit again.&rdquo;</p>
          <div className="w-full py-3 bg-blue-600 text-white text-sm font-black rounded-xl text-center shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:bg-blue-700 transition-colors cursor-pointer flex justify-center items-center gap-2">
            <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">G</span>
            Post to Google
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Smart Interception",
    body: "If a customer taps 1, 2, or 3 stars, they are NOT sent to Google. Instead, their feedback is routed securely to your WhatsApp.",
    tag: "Step 4",
    visual: (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="w-72 bg-white rounded-[2rem] border-2 border-red-200 shadow-2xl p-6 relative">
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div className="flex gap-1 text-2xl text-red-400">★★<span className="text-slate-200">★★★</span></div>
            <span className="bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Blocked</span>
          </div>
          <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">Private Feedback Form</p>
          <div className="w-full h-20 bg-slate-50 rounded-xl border border-slate-200 mb-4 p-2">
             <div className="w-3/4 h-2 bg-slate-200 rounded mb-2"></div>
             <div className="w-1/2 h-2 bg-slate-200 rounded"></div>
          </div>
          <div className="w-full py-3 bg-slate-900 text-white text-sm font-black rounded-xl text-center shadow-lg cursor-pointer">Send to Owner Privately</div>
        </div>
      </div>
    )
  }
];

const niches = [
  { id: "hotel", emoji: "🏨", name: "Hotels & Resorts", desc: "Right at checkout.", mockup: { title: "Enjoyed your stay?", cats: ["Room", "Service", "Cleanliness"] } },
  { id: "jewel", emoji: "💎", name: "Jewellery Shops", desc: "When the purchase is made.", mockup: { title: "Love your new jewellery?", cats: ["Design", "Staff", "Pricing"] } },
  { id: "rest", emoji: "🍽️", name: "Restaurants & Cafes", desc: "Capture delight right after the meal.", mockup: { title: "How was the food?", cats: ["Taste", "Service", "Ambience"] } },
  { id: "salon", emoji: "💇", name: "Salons & Spas", desc: "Catch them looking at the mirror.", mockup: { title: "How do you look?", cats: ["Stylist", "Hygiene", "Wait Time"] } },
  { id: "gym", emoji: "🏋️", name: "Gyms & Fitness", desc: "After a great workout.", mockup: { title: "Great workout?", cats: ["Equipment", "Trainers", "Vibe"] } },
  { id: "clinic", emoji: "🏥", name: "Clinics", desc: "Build trust with patients.", mockup: { title: "How was your visit?", cats: ["Doctor Care", "Hygiene", "Staff"] } },
];

const clientReviews = [
  { name: "Rajesh Kumar", shop: "Spice Garden", location: "Jaipur", text: "Mere Google reviews ek mahine mein 40 se 150 ho gaye! Customer khud scan karke 5-star dete hain.", rating: 5 },
  { name: "Priya Malhotra", shop: "Glow Beauty Studio", location: "Mumbai", text: "The private feedback feature saved my rating. Disappointed customers complain to me on WhatsApp instead of Google.", rating: 5 },
  { name: "Amit Saini", shop: "FitZone Gym", location: "Delhi", text: "Bohot hi aasan hai. QR code scan kiya aur AI ne khud review likh diya. Customer ka time bachta hai aur hamara rating badhta hai.", rating: 5 },
  { name: "Sunil Verma", shop: "Verma Jewellers", location: "Lucknow", text: "Auto-reply feature is pure magic. Every review gets a personal response in Hindi or English immediately. Best investment.", rating: 5 },
  { name: "Ananya Desai", shop: "Sea View Resort", location: "Goa", text: "We put the QR on the reception desk. Guests love the 1-click rating. Our ranking shot up on local search.", rating: 5 },
  { name: "Vikram Singh", shop: "City Hospital Clinic", location: "Chandigarh", text: "Patients find it extremely easy. And the AI replies sound so professional. Highly recommended for clinics.", rating: 5 },
];

const pricing = [
  { name: "Starter", price: "₹499", per: "/mo", desc: "Perfect for single locations.", features: ["1 Location", "Smart QR Routing", "AI Review Generation", "Basic Analytics"], pop: false },
  { name: "Growth", price: "₹999", per: "/mo", desc: "For serious local businesses.", features: ["Up to 3 Locations", "AI Auto-Replies on Google", "Private Feedback Alerts", "Priority WhatsApp Support"], pop: true },
];

const faqs = [
  { q: "Do customers need to download an app?", a: "No. They just scan the QR and a browser page opens. Works on any smartphone instantly." },
  { q: "How does the negative review interception work?", a: "When a customer taps 1, 2, or 3 stars, our system shows them a private feedback form instead of a Google link. That feedback is emailed/WhatsApped directly to you, so you can fix the issue before they go public." },
  { q: "Does the AI reply to reviews in different languages?", a: "Yes! Our AI natively detects the language of the customer's review (Hindi, Gujarati, English, Hinglish, Marathi, etc.) and auto-replies in that exact same language, sounding 100% human and personal." },
  { q: "Do the generated reviews sound fake?", a: "Not at all. We specifically trained our AI to write natural, conversational reviews. It uses everyday phrasing and Hinglish, making it indistinguishable from a real human review." },
  { q: "Can I manage multiple shops?", a: "Yes, our Growth and Agency plans allow you to manage multiple locations from a single dashboard, with distinct QR codes for each." },
];

// Animation variants
const fadeUp: any = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

// Scroll Tracker Component for the "How it Works"
import { useMotionValueEvent } from "framer-motion";

function ScrollLinkedExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Map the 0-1 progress to our 4 steps
    // Subtract a tiny amount from 1 so exactly 1.0 doesn't overflow to index 4
    const index = Math.floor(Math.max(0, Math.min(0.999, latest)) * timelineSteps.length);
    setActiveIndex(index);
  });

  return (
    <div ref={containerRef} className="relative w-full h-[300vh]">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-6">
          
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-orange-600 font-black tracking-widest uppercase text-sm mb-4">The Experience</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Scroll to see the magic happen.</h3>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-20 items-center bg-white rounded-[3rem] border border-slate-200 p-8 shadow-2xl relative">
            {/* Left: Text Steps */}
            <div className="space-y-3 lg:space-y-4">
              {timelineSteps.map((step, index) => (
                <div 
                  key={index}
                  className={`p-5 lg:p-6 rounded-[2rem] transition-all duration-500 ${activeIndex === index ? 'bg-slate-50 border border-slate-200 shadow-sm scale-[1.02] opacity-100' : 'border border-transparent opacity-30 grayscale'}`}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">{step.tag}</p>
                  <h4 className="text-xl lg:text-2xl font-black text-slate-900 mb-2 lg:mb-3">{step.title}</h4>
                  <p className="text-sm lg:text-base text-slate-600 font-medium leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>

            {/* Right: Dynamic Visual */}
            <div className="relative h-[350px] lg:h-[550px] w-full bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  {timelineSteps[activeIndex].visual}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


export default function Home() {
  const [activeNiche, setActiveNiche] = useState(niches[0]);

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-orange-200 selection:text-orange-900 font-sans">
      {/* SEAMLESS LIGHT BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_10%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full bg-orange-400/10 blur-[150px]" />
      </div>

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-black text-lg shadow-md transition-transform group-hover:scale-105">
              RQ
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">ReviewQR</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-bold text-slate-500 md:flex">
            <a href="#how" className="transition-colors hover:text-orange-600">The Experience</a>
            <a href="#autopilot" className="transition-colors hover:text-orange-600">AI Autopilot</a>
            <a href="#industry" className="transition-colors hover:text-orange-600">Industries</a>
            <a href="#pricing" className="transition-colors hover:text-orange-600">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105 shadow-lg hover:bg-slate-800">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative z-10 pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="flex-1 text-center lg:text-left">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 shadow-sm mb-8 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Protecting 200+ local businesses
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-[5rem] font-black leading-[1.05] tracking-tight text-slate-900 mb-6">
            Grow your Google rating. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Automatically.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 font-medium">
            A frictionless QR flow that drafts 5-star Google reviews for happy customers, quietly intercepts bad feedback, and <strong className="text-slate-900">auto-replies to all your Google reviews</strong> like a real human.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-orange-500 px-8 py-4 text-lg font-black text-white transition-all hover:bg-orange-600 hover:scale-105 shadow-[0_8px_30px_rgba(249,115,22,0.3)]">
              Get Your QR Code
            </Link>
            <a href="#how" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
              See The Magic
            </a>
          </motion.div>
          
          <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><CheckIcon /> 15-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckIcon /> No credit card</span>
          </motion.div>
        </motion.div>

        {/* Hero Interactive UI Mockup */}
        <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="flex-1 relative w-full max-w-[420px] mx-auto lg:ml-auto">
          {/* Decorative Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-200/50 via-white/50 to-blue-200/50 rounded-full blur-[60px] -z-10" />
          
          <div className="relative rounded-[3rem] border-[10px] border-slate-900 bg-white shadow-2xl overflow-hidden aspect-[9/19]">
            {/* Dynamic Island */}
            <div className="absolute top-0 inset-x-0 h-7 bg-slate-900 rounded-b-3xl w-1/3 mx-auto z-20" />
            
            <div className="absolute inset-0 p-6 pt-16 flex flex-col bg-slate-50">
              <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shadow-inner">
                  🏨
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">Grand Horizon Hotel</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Rate your stay</p>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
                  <div className="absolute -top-3 left-4 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                    AI Auto-Draft
                  </div>
                  <div className="flex gap-1 text-xl text-orange-400 mb-3">★★★★★</div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                    &ldquo;The stay was absolutely fantastic! The room was spotless, the service was fast, and the breakfast buffet was delicious. Highly recommend!&rdquo;
                  </p>
                </div>
              </div>

              <div className="mt-auto relative z-10 pb-4">
                <div className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-center shadow-[0_8px_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2">
                  <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black">G</span>
                  Post to Google
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ STATS BANNER ═══ */}
      <section className="relative z-10 border-y border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            {stats.map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center px-4"
              >
                <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">{s.value}</div>
                <div className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS (SCROLL LINKED) ═══ */}
      <section id="how" className="relative z-10 bg-slate-50 border-b border-slate-200">
        <ScrollLinkedExperience />
      </section>

      {/* ═══ INFINITE REVIEWS MARQUEE ═══ */}
      <section className="relative z-10 py-24 bg-white overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-orange-600 font-black tracking-widest uppercase text-sm mb-4">Wall of Love</h2>
          <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Real Indian business owners.<br/>Real results.</h3>
        </div>

        {/* Marquee Wrapper */}
        <div className="relative w-full flex overflow-x-hidden">
          {/* Gradient Fades for edges */}
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10" />
          
          {/* Moving Track */}
          <motion.div 
            className="flex gap-6 px-6"
            animate={{ x: [0, -1920] }} // Arbitrary large value, seamlessly loops
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          >
            {/* Map reviews twice to create a seamless infinite loop */}
            {[...clientReviews, ...clientReviews].map((review, i) => (
              <div key={i} className="w-[350px] shrink-0 bg-slate-50 border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex gap-1 text-orange-400 text-lg mb-4">
                  {Array(review.rating).fill('★').join('')}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed mb-6 italic min-h-[100px]">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-4 border-t border-slate-200 pt-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{review.name}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{review.shop}, {review.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ AI AUTOPILOT (Auto-Reply Section) ═══ */}
      <section id="autopilot" className="relative z-10 py-32 px-6 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-[80%] h-[100%] rounded-full bg-orange-600/10 blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-8">
              <h2 className="text-orange-500 font-black tracking-widest uppercase text-sm">Zero-Touch Management</h2>
              <h3 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                Put your Google Maps<br/>on Autopilot.
              </h3>
              <p className="text-xl text-slate-300 leading-relaxed font-medium">
                Never log into Google Business Profile again to reply to reviews. Our AI natively understands the customer's language and replies instantly, sounding 100% human.
              </p>
              
              <ul className="space-y-5 pt-4">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0"><CheckIcon /></div>
                  <span className="text-lg text-slate-200 font-medium">Detects language (Hindi, English, Hinglish, Marathi, etc.)</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0"><CheckIcon /></div>
                  <span className="text-lg text-slate-200 font-medium">Crafts a unique, personalized human-like response</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0"><CheckIcon /></div>
                  <span className="text-lg text-slate-200 font-medium">Automatically posts to Google 24/7 without your intervention</span>
                </li>
              </ul>
            </motion.div>

            {/* AI Reply Demo UI */}
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl">
                {/* Customer Review */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">RM</div>
                    <span className="font-bold text-slate-900">Rahul Mehta</span>
                    <span className="text-slate-400 text-xs ml-auto">2 hours ago</span>
                  </div>
                  <div className="flex gap-1 text-orange-400 text-sm mb-2">★★★★★</div>
                  <p className="text-slate-700 font-medium">"Khana bahut badhiya tha aur service bhi fast thi. Best place for family dinner!"</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Detected: Hinglish</p>
                </div>

                {/* AI Reply Flow */}
                <div className="relative pl-6 border-l-2 border-slate-100">
                  <div className="absolute -left-[13px] top-4 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">
                    AI
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-slate-900">Owner (Auto-Reply)</span>
                      <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">Posted Instantly</span>
                    </div>
                    <p className="text-slate-700 font-medium">"Aapke is pyare review ke liye bahut bahut dhanyawad Rahul ji! Humein khushi hai ki aapko khana aur fast service pasand aayi. Jaldi hi apni family ke saath wapas aayiega!"</p>
                  </div>
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══ DYNAMIC INDUSTRY TABS ═══ */}
      <section id="industry" className="relative z-10 py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-slate-400 font-black tracking-widest uppercase text-sm mb-4">Hyper-Customized</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Built exactly for your industry.</h3>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">Your customers answer questions that actually matter to your business. A hotel shouldn't ask about haircuts.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Tabs Grid */}
            <div className="grid grid-cols-2 gap-4">
              {niches.map((n) => (
                <button 
                  key={n.id}
                  onClick={() => setActiveNiche(n)}
                  className={`text-left p-5 rounded-[2rem] transition-all duration-300 ${activeNiche.id === n.id ? 'bg-orange-50 border-2 border-orange-500 shadow-md scale-105 z-10' : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'}`}
                >
                  <div className="text-3xl mb-3">{n.emoji}</div>
                  <h4 className={`text-lg font-black ${activeNiche.id === n.id ? 'text-orange-900' : 'text-slate-700'}`}>{n.name}</h4>
                </button>
              ))}
            </div>

            {/* Dynamic UI Mockup based on selection */}
            <div className="bg-slate-50 rounded-[3rem] border border-slate-200 p-8 shadow-inner relative min-h-[400px] flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeNiche.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative z-10"
                >
                  <div className="text-center mb-8">
                    <div className="text-4xl mb-4">{activeNiche.emoji}</div>
                    <h5 className="font-black text-slate-900 text-xl">{activeNiche.mockup.title}</h5>
                  </div>
                  
                  <div className="space-y-4">
                    {activeNiche.mockup.cats.map((cat, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">{cat}</span>
                        <div className="flex gap-1 text-orange-400 text-lg">★★★★★</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 w-full py-4 bg-slate-900 text-white font-bold rounded-xl text-center shadow-lg">
                    Continue →
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="relative z-10 py-32 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-orange-600 font-black tracking-widest uppercase text-sm mb-4">Pricing</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">Pays for itself in 1 day.</h3>
            <p className="text-xl text-slate-600 font-medium">Start with a 15-day free trial. No credit card required.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricing.map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-[3rem] p-10 transition-transform hover:-translate-y-2 ${p.pop ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10' : 'bg-white border border-slate-200 shadow-lg text-slate-900'}`}
              >
                {p.pop && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <h4 className="text-2xl font-black mb-3">{p.name}</h4>
                <p className={`mb-8 font-bold ${p.pop ? 'text-slate-400' : 'text-slate-500'}`}>{p.desc}</p>
                
                <div className="mb-10 flex items-end gap-2">
                  <span className="text-6xl font-black tracking-tighter">{p.price}</span>
                  <span className={`text-lg font-bold pb-2 ${p.pop ? 'text-slate-400' : 'text-slate-500'}`}>{p.per}</span>
                </div>

                <ul className="space-y-5 mb-10">
                  {p.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-4 font-bold ${p.pop ? 'text-slate-200' : 'text-slate-700'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${p.pop ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <CheckIcon />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className={`block w-full py-5 text-center rounded-2xl font-black text-lg transition-transform hover:scale-105 ${p.pop ? 'bg-white text-slate-900 shadow-xl' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                  Start Free Trial
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="relative z-10 mx-auto max-w-3xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900">Questions? Answers.</h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-[2rem] border border-slate-200 bg-white overflow-hidden transition-all hover:shadow-md">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-lg font-black text-slate-800 list-none">
                {f.q}
                <span className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 group-open:bg-orange-500 group-open:text-white transition-colors">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600 font-medium leading-relaxed">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative z-10 py-32 px-6 bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto rounded-[4rem] bg-slate-900 p-12 md:p-24 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute top-0 right-0 w-[50%] h-[100%] rounded-full bg-orange-500/20 blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tight">Ready to dominate<br/>local search?</h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              Join the smartest offline businesses who are automatically turning their daily footfall into permanent digital reputation.
            </p>
            
            <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-orange-500 px-10 py-6 text-xl font-black text-white transition-transform hover:scale-105 shadow-2xl hover:bg-orange-600">
              Get Started in 2 Minutes
            </Link>
            <p className="mt-6 text-white/50 font-black uppercase tracking-widest text-[10px]">15-day free trial. No credit card required.</p>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-slate-200 bg-[#FAFAFA] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white font-black text-lg shadow-md">RQ</div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">ReviewQR</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed text-lg font-medium">
                The smart reputation engine for modern offline businesses.
              </p>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-sm">Product</h4>
              <ul className="space-y-4 text-slate-600 font-bold">
                <li><a href="#how" className="hover:text-orange-600 transition-colors">The Experience</a></li>
                <li><a href="#autopilot" className="hover:text-orange-600 transition-colors">AI Autopilot</a></li>
                <li><a href="#industry" className="hover:text-orange-600 transition-colors">Industries</a></li>
                <li><a href="#pricing" className="hover:text-orange-600 transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-sm">Company</h4>
              <ul className="space-y-4 text-slate-600 font-bold">
                <li><Link href="/login" className="hover:text-orange-600 transition-colors">Log in</Link></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">
            <p>© 2026 ReviewQR. All rights reserved.</p>
            <p>Built for offline growth.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
