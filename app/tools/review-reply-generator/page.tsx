'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/BackButton';

const REPLY_TEMPLATES: Record<string, { positive: string; negative: string; neutral: string }> = {
  default: {
    positive: `Thank you so much for your wonderful review! 🙏 We're truly delighted to hear that you had a great experience with us. Your kind words mean the world to our team. We look forward to welcoming you again very soon!`,
    negative: `We sincerely apologise for the experience you described. This is not the standard we hold ourselves to. Please reach out to us directly so we can make this right for you. Your feedback helps us improve every single day.`,
    neutral: `Thank you for taking the time to share your feedback! We appreciate your honest review. We're always working to improve our service and would love to know more about how we can make your next visit even better.`,
  },
  hindi: {
    positive: `आपकी इस सुंदर समीक्षा के लिए बहुत-बहुत धन्यवाद! 🙏 हमें यह जानकर बेहद खुशी हुई कि आपका अनुभव अच्छा रहा। आपके शब्द हमारी पूरी टीम को प्रेरित करते हैं। जल्द ही फिर पधारें!`,
    negative: `आपके अनुभव के लिए हम क्षमाप्रार्थी हैं। यह हमारे स्तर के अनुकूल नहीं है। कृपया हमसे सीधे संपर्क करें ताकि हम इसे सुधार सकें। आपकी प्रतिक्रिया हमारे लिए बहुत महत्वपूर्ण है।`,
    neutral: `आपकी प्रतिक्रिया के लिए धन्यवाद! हम हमेशा बेहतर सेवा देने की कोशिश करते हैं। अगली बार आपको और बेहतर अनुभव देने के लिए हम प्रयासरत रहेंगे।`,
  },
};

function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const positiveWords = ['great', 'amazing', 'excellent', 'fantastic', 'wonderful', 'love', 'best', 'good', 'happy', 'satisfied', 'badhiya', 'achha', 'shukriya', 'zabardast'];
  const negativeWords = ['bad', 'terrible', 'horrible', 'worst', 'poor', 'disappointed', 'never', 'rude', 'slow', 'wrong', 'bura', 'ganda', 'bekaar'];
  const posScore = positiveWords.filter(w => lower.includes(w)).length;
  const negScore = negativeWords.filter(w => lower.includes(w)).length;
  if (negScore > posScore) return 'negative';
  if (posScore > 0) return 'positive';
  return 'neutral';
}

function detectLanguage(text: string): 'hindi' | 'default' {
  const hindiChars = /[\u0900-\u097F]/;
  const hindiWords = ['bahut', 'achha', 'badhiya', 'shukriya', 'aapka', 'dhanyawad', 'mast', 'dhannya'];
  if (hindiChars.test(text) || hindiWords.some(w => text.toLowerCase().includes(w))) return 'hindi';
  return 'default';
}

export default function ReviewReplyGenerator() {
  const [reviewText, setReviewText] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!reviewText.trim()) return;
    setIsGenerating(true);
    setGeneratedReply('');

    // Simulate brief "generating" delay for UX
    setTimeout(() => {
      const sentiment = detectSentiment(reviewText);
      const lang = detectLanguage(reviewText);
      const templates = REPLY_TEMPLATES[lang] || REPLY_TEMPLATES.default;
      setGeneratedReply(templates[sentiment]);
      setIsGenerating(false);
    }, 1200);
  };

  const copyReply = () => {
    navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-200 selection:text-orange-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-black text-sm">RQ</div>
              <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">ReviewQR</span>
            </Link>
          </div>
          <Link href="/signup" className="text-sm font-bold text-orange-600 hover:text-orange-700">Get Pro Version →</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6">Free AI Tool</div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              AI Google Review Reply Generator
            </h1>
            <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed">
              Paste any customer review below. Our AI will detect the language and sentiment, then generate a professional reply instantly — for free.
            </p>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
              <label className="block text-sm font-bold text-slate-700 mb-2">Paste Customer Review</label>
              <textarea
                rows={5}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder={`Paste any review here — English, Hindi, or Hinglish.\n\ne.g. "Khana bahut badhiya tha! Service thodi slow thi..." `}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 mb-5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium resize-none"
              />
              <button
                onClick={generate}
                disabled={isGenerating || !reviewText.trim()}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl transition-all hover:bg-slate-800 disabled:opacity-40"
              >
                {isGenerating ? 'Generating Reply...' : 'Generate Professional Reply →'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 min-h-[500px] flex flex-col">
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
                <p className="font-medium">Analysing review and generating reply…</p>
              </div>
            ) : !generatedReply ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
                <div className="text-5xl mb-4">💬</div>
                <p className="font-medium">Your AI-generated reply will appear here</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-900">Generated Reply</h2>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Ready to paste</span>
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <p className="text-slate-700 font-medium leading-relaxed">{generatedReply}</p>
                </div>
                <button
                  onClick={copyReply}
                  className={`mt-4 w-full py-3 rounded-xl font-black transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {copied ? '✓ Copied to Clipboard!' : 'Copy Reply'}
                </button>
                <div className="mt-6 bg-orange-50 border border-orange-100 p-5 rounded-2xl">
                  <h3 className="font-black text-orange-900 mb-1 text-sm">Tired of copy-pasting? 🤖</h3>
                  <p className="text-xs text-orange-800 mb-3 font-medium">ReviewQR Pro connects to your Google Business and auto-replies to every review, 24/7, in any language.</p>
                  <Link href="/signup" className="text-xs font-black text-orange-600 hover:text-orange-700">Put replies on autopilot →</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Why Replying to Google Reviews Matters for SEO</h2>
          <p className="text-slate-600 leading-relaxed">
            Replying to Google reviews is a confirmed local SEO ranking factor. Google's algorithm rewards businesses that engage actively with their customers on the platform. Additionally, 89% of consumers read owner responses before deciding to visit a business.
          </p>
        </div>
      </main>
    </div>
  );
}
