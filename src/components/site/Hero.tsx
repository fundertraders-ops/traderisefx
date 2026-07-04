import type { CSSProperties } from "react";
import { ArrowRight, CirclePlay, ShieldCheck, Sparkles, TimerReset, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";

const candles = [
  { x: 38, y: 198, h: 78, wick: 110, up: true },
  { x: 76, y: 170, h: 112, wick: 146, up: true },
  { x: 114, y: 182, h: 68, wick: 110, up: false },
  { x: 152, y: 152, h: 130, wick: 162, up: true },
  { x: 190, y: 116, h: 92, wick: 128, up: true },
  { x: 228, y: 140, h: 124, wick: 158, up: false },
  { x: 266, y: 114, h: 76, wick: 116, up: true },
  { x: 304, y: 88, h: 120, wick: 160, up: true },
  { x: 342, y: 100, h: 80, wick: 118, up: false },
  { x: 380, y: 72, h: 124, wick: 166, up: true },
  { x: 418, y: 42, h: 146, wick: 184, up: true },
  { x: 456, y: 58, h: 96, wick: 132, up: false },
  { x: 494, y: 32, h: 130, wick: 178, up: true },
  { x: 532, y: 10, h: 152, wick: 202, up: true },
];

function SparklineIcon() {
  return (
    <svg viewBox="0 0 72 36" className="h-7 w-16" aria-hidden="true">
      <path d="M2 28 C12 24 15 14 24 18 S38 30 47 18 57 7 70 5" fill="none" stroke="url(#spark-grad)" strokeWidth="3" strokeLinecap="round" />
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TradingGraphScene() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[680px] lg:h-[520px]">
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--gold)_12%,transparent),transparent_45%)]" />
      <div className="absolute left-[7%] top-[14%] h-[70%] w-[86%] rounded-[2rem] border border-border bg-card/35 shadow-[inset_0_1px_0_rgba(255,255,255,.4)] backdrop-blur-sm" />
      <div className="hero-chart-board absolute inset-x-4 top-16 h-[300px] overflow-hidden rounded-[1.7rem] lg:top-20 lg:h-[360px]">
        <div className="absolute inset-0 grid-pattern opacity-70" />
        <div className="orb-slide absolute top-1/2 h-32 w-32 rounded-full bg-gold-gradient blur-3xl" />
        <svg viewBox="0 0 600 320" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="lineA" x1="0" x2="1">
              <stop offset="0" stopColor="#8b5cf6" />
              <stop offset=".56" stopColor="#2563eb" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.20" />
              <stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M22 254 C70 230 78 182 126 198 C176 214 184 120 236 138 C270 150 292 96 326 112 C364 128 380 76 420 84 C456 90 468 40 520 52 C552 60 570 28 590 24 L590 318 L22 318 Z" fill="url(#lineFill)" />
          <path className="hero-line" d="M22 254 C70 230 78 182 126 198 C176 214 184 120 236 138 C270 150 292 96 326 112 C364 128 380 76 420 84 C456 90 468 40 520 52 C552 60 570 28 590 24" fill="none" stroke="url(#lineA)" strokeWidth="4" strokeLinecap="round" />
          <path d="M18 280 C90 250 126 276 182 248 S262 212 314 224 392 196 444 164 520 142 590 116" fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeOpacity=".45" strokeDasharray="6 8" />
        </svg>
        <div className="absolute inset-0">
          {candles.map((c, index) => (
            <div key={`${c.x}-${index}`} className="hero-candle absolute" style={{ left: `${c.x / 6}%`, top: `${c.y / 3.5}%`, height: c.wick, '--delay': `${index * 0.17}s` } as CSSProperties}>
              <span className={`absolute left-1/2 top-0 block w-px -translate-x-1/2 rounded-full ${c.up ? "bg-sky-400/70" : "bg-violet-500/60"}`} style={{ height: c.wick }} />
              <span className={`absolute left-1/2 block w-4 -translate-x-1/2 rounded-md shadow-[0_0_22px_currentColor] ${c.up ? "bg-sky-500 text-sky-400" : "bg-violet-500 text-violet-400"}`} style={{ top: (c.wick - c.h) / 2, height: c.h }} />
            </div>
          ))}
        </div>
      </div>

      <div className="float-card glass-card absolute right-4 top-9 rounded-2xl p-4 sm:right-12" style={{ '--delay': '-.8s' } as CSSProperties}>
        <div className="text-xs text-muted-foreground">Equity</div>
        <div className="mt-1 text-xl font-extrabold">$128,340</div>
        <div className="mt-1 text-xs font-bold text-success">+12.45%</div>
      </div>
      <div className="float-card glass-card absolute left-4 top-36 rounded-2xl p-4 sm:left-10" style={{ '--delay': '-1.8s' } as CSSProperties}>
        <div className="text-xs text-muted-foreground">Profit Target</div>
        <div className="mt-1 text-xl font-extrabold">$10,000</div>
      </div>
      <div className="float-card glass-card absolute bottom-12 right-7 flex items-center gap-4 rounded-2xl p-4 sm:right-16" style={{ '--delay': '-2.6s' } as CSSProperties}>
        <div>
          <div className="text-xs text-muted-foreground">Daily P&L</div>
          <div className="mt-1 text-xl font-extrabold text-success">+$856.24</div>
        </div>
        <SparklineIcon />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero pt-28 pb-12 md:pt-32 lg:pb-16">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="animate-float-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-card/75 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold shadow-sm backdrop-blur-xl">
            <Sparkles size={13} /> Real capital. Real traders. Real results.
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            Get Funded.<br />
            <span className="text-gold-gradient">Trade. Scale. Keep Profits.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Prove your skills, trade our capital, and keep up to 90% of the profits. Built for serious traders with fast payouts, transparent rules, and a clean trader-first experience.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/challenges" className="primary-button group inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-extrabold transition">
              Start Your Challenge
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </Link>
            <Link to="/" hash="how" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card/75 px-6 text-sm font-bold shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-gold/40">
              How It Works
              <CirclePlay size={18} />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-xs font-semibold text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-success" /> Up to 90% split</span>
            <span className="inline-flex items-center gap-2"><TimerReset size={15} className="text-gold" /> Payouts in 24h</span>
            <span className="inline-flex items-center gap-2"><TrendingUp size={15} className="text-gold-soft" /> Scaling capital</span>
            <span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-gold" /> Clean dashboard</span>
          </div>
        </div>

        <TradingGraphScene />
      </div>
    </section>
  );
}
