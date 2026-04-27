const niches = [
  "Restaurant",
  "Salon",
  "Gym",
  "Hotel",
  "Retail",
  "Clinic",
  "Coaching",
];

export default function Home() {
  const faqs = [
    {
      q: "Do customers need to download an app?",
      a: "No. They just scan the QR and open a browser page.",
    },
    {
      q: "What if the customer doesn't post the review?",
      a: "You can follow up manually for now. Automated reminder comes in later phases.",
    },
    {
      q: "How are bad reviews handled?",
      a: "Ratings below 3 are treated as private feedback and not shown as public review output.",
    },
    {
      q: "What language are the reviews in?",
      a: "Phase 0 uses a simple placeholder review text. AI Hinglish generation comes in Phase 1.",
    },
    {
      q: "Can I see what reviews were generated?",
      a: "Yes, recent review records are visible in dashboard.",
    },
    {
      q: "Do I need a Google Business account?",
      a: "You can use core flow without linking Google account in Phase 0.",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="flex items-center justify-between">
          <p className="text-lg font-bold">ReviewQR</p>
          <div className="hidden items-center gap-6 text-sm text-zinc-600 md:flex">
            <a href="#how">How it Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#owners">For Owners</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="/login" className="rounded-lg border px-3 py-2 text-sm font-medium">
              Login
            </a>
            <a
              href="/signup"
              className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white"
            >
              Start Free Trial
            </a>
          </div>
        </nav>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Turn happy customers into Google reviews. Automatically.
          </h1>
          <p className="text-zinc-600">
            Offline shops get a QR code. Customer scans, rates, AI writes a real review, and bad
            reviews stay private.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/signup"
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white"
            >
              Get Your QR Code Free
            </a>
            <a href="#how" className="text-sm font-semibold text-zinc-700">
              See how it works
            </a>
          </div>
          <p className="text-xs text-zinc-500">15-day free trial • No card required • Setup in 2 minutes</p>
        </div>
        <div className="rounded-3xl border bg-zinc-50 p-6 shadow-sm">
          <div className="mx-auto max-w-xs rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold">Customer Rating Screen</p>
            <div className="mt-4 space-y-2 text-sm text-zinc-600">
              <p>Food ★★★★★</p>
              <p>Cleanliness ★★★★☆</p>
              <p>Service ★★★★★</p>
              <p>Ambience ★★★★☆</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "Customer scans your QR at table/counter",
            "Rates your shop in 4 quick taps",
            "Gets a ready-to-post review text",
          ].map((item) => (
            <div key={item} className="rounded-2xl border p-5 shadow-sm">
              <p className="text-sm font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border bg-zinc-50 p-6">
          <h3 className="text-xl font-bold">Bad reviews? We intercept them.</h3>
          <p className="mt-2 text-sm text-zinc-600">
            If rating is below 3, it never reaches Google. You get private feedback to fix issues
            first.
          </p>
        </div>
      </section>

      <section id="owners" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold">Who It&apos;s For</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {niches.map((niche) => (
            <div key={niche} className="rounded-2xl border p-4 text-sm shadow-sm">
              {niche}
              <p className="mt-1 text-xs text-zinc-500">4 rating categories</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold">Pricing</h2>
        <p className="mt-2 text-sm text-zinc-600">15 days free, no card required.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { name: "Starter", price: "₹499/mo", desc: "1 shop, core features" },
            { name: "Growth", price: "₹999/mo", desc: "3 shops, all features", popular: true },
            { name: "Agency", price: "₹2999/mo", desc: "Unlimited shops, white label" },
          ].map((plan) => (
            <div key={plan.name} className="rounded-2xl border p-5 shadow-sm">
              {plan.popular ? (
                <p className="mb-2 inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                  Most Popular
                </p>
              ) : null}
              <p className="font-semibold">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold">{plan.price}</p>
              <p className="mt-2 text-sm text-zinc-600">{plan.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="rounded-2xl border bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold">{faq.q}</summary>
              <p className="mt-2 text-sm text-zinc-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm sm:px-6">
          <p className="font-semibold">ReviewQR</p>
          <div className="flex items-center gap-4 text-zinc-600">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
          <p className="text-zinc-500">Made for Indian shop owners 🇮🇳</p>
        </div>
      </footer>
    </main>
  );
}
