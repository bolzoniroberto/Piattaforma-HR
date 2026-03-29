import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Target, Users, BarChart3, Award, Network, ClipboardCheck,
  TrendingUp, ArrowRight, ChevronLeft, ChevronRight,
  Building2, UserCheck, ShieldCheck, Zap, Globe, Star,
} from "lucide-react";

// ─── Neon palette ──────────────────────────────────────────────────────────────
// cyan: #00f5ff  |  magenta: #ff0080  |  green: #00ff88  |  violet: #a855f7

// ─── Retro grid background ────────────────────────────────────────────────────
function RetroGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
      }}
    />
  );
}

// ─── Neon glow orbs ───────────────────────────────────────────────────────────
function GlowOrb({ color, className }: { color: string; className?: string }) {
  return (
    <div
      className={`absolute rounded-full blur-[120px] opacity-30 pointer-events-none ${className}`}
      style={{ background: color }}
    />
  );
}

// ─── Scanline overlay ─────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
      }}
    />
  );
}

// ─── Neon badge ───────────────────────────────────────────────────────────────
function NeonBadge({ children, color = "cyan" }: { children: React.ReactNode; color?: "cyan" | "pink" | "green" | "violet" }) {
  const styles = {
    cyan:   "border-cyan-500/50 text-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_rgba(0,245,255,0.2)]",
    pink:   "border-pink-500/50 text-pink-400 bg-pink-500/10 shadow-[0_0_12px_rgba(255,0,128,0.2)]",
    green:  "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_12px_rgba(0,255,136,0.2)]",
    violet: "border-violet-500/50 text-violet-400 bg-violet-500/10 shadow-[0_0_12px_rgba(168,85,247,0.2)]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${styles[color]}`}>
      {children}
    </span>
  );
}

// ─── 3D Feature card (used in carousel) ──────────────────────────────────────
interface FeatureCard {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: "cyan" | "pink" | "green" | "violet";
  stats: { label: string; val: string }[];
  visual: React.ReactNode;
}

function Card3D({ card, active }: { card: FeatureCard; active: boolean }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const neon = {
    cyan:   { border: "rgba(0,245,255,0.4)",   glow: "rgba(0,245,255,0.15)",   text: "#00f5ff",  bg: "rgba(0,245,255,0.08)" },
    pink:   { border: "rgba(255,0,128,0.4)",   glow: "rgba(255,0,128,0.15)",   text: "#ff0080",  bg: "rgba(255,0,128,0.08)" },
    green:  { border: "rgba(0,255,136,0.4)",   glow: "rgba(0,255,136,0.15)",   text: "#00ff88",  bg: "rgba(0,255,136,0.08)" },
    violet: { border: "rgba(168,85,247,0.4)",  glow: "rgba(168,85,247,0.15)",  text: "#a855f7",  bg: "rgba(168,85,247,0.08)" },
  }[card.color];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 12;
    setTilt({ x, y });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative rounded-2xl p-6 transition-all duration-300 cursor-default flex-shrink-0 w-[320px] md:w-[380px]"
      style={{
        background: `linear-gradient(135deg, #0d1424 0%, #0a0f1e 100%)`,
        border: `1px solid ${neon.border}`,
        boxShadow: active
          ? `0 0 0 1px ${neon.border}, 0 0 40px ${neon.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
          : `0 0 20px ${neon.glow}`,
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${active ? "scale(1.02)" : "scale(0.97)"}`,
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: neon.text }} />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-2xl" style={{ borderColor: neon.text }} />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-2xl" style={{ borderColor: neon.text }} />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: neon.text }} />

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{ background: neon.bg, boxShadow: `0 0 20px ${neon.glow}` }}
      >
        <card.icon className="h-6 w-6" style={{ color: neon.text }} />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2 font-mono" style={{ color: neon.text }}>
        {card.eyebrow}
      </p>
      <h3 className="text-xl font-bold text-white mb-3 leading-snug">{card.title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{card.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {card.stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg p-3 text-center"
            style={{ background: neon.bg, border: `1px solid ${neon.border}` }}
          >
            <div className="text-xl font-bold font-mono" style={{ color: neon.text }}>{s.val}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Visual mockup */}
      <div
        className="mt-5 rounded-xl overflow-hidden"
        style={{ background: "#060b18", border: `1px solid ${neon.border}`, padding: "12px" }}
      >
        {card.visual}
      </div>
    </div>
  );
}

// ─── Mini dashboard visuals ───────────────────────────────────────────────────

function MboMiniVisual() {
  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between text-slate-500 border-b border-cyan-500/20 pb-1 mb-2">
        <span className="text-cyan-400/70">▸ tabellone.mbo</span>
        <span className="text-emerald-400 text-[10px]">● live</span>
      </div>
      {[
        { name: "M.Bianchi", pct: 94, color: "#00f5ff" },
        { name: "L.Rossi", pct: 78, color: "#a855f7" },
        { name: "G.Verdi", pct: 108, color: "#00ff88" },
      ].map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-slate-500 w-16 truncate text-[10px]">{r.name}</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(r.pct, 100)}%`,
                background: r.color,
                boxShadow: `0 0 8px ${r.color}`,
              }}
            />
          </div>
          <span className="text-[10px] font-bold w-8 text-right" style={{ color: r.color }}>{r.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function PerfMiniVisual() {
  return (
    <div className="font-mono text-xs space-y-2">
      <div className="flex items-center gap-1 text-[10px] text-pink-400/70 border-b border-pink-500/20 pb-1 mb-2">
        <span>▸ ciclo.valutazione</span>
      </div>
      {[
        { label: "Autoval.", val: 82, color: "#ff0080" },
        { label: "360°", val: 67, color: "#a855f7" },
        { label: "Manager", val: 91, color: "#ff0080" },
      ].map((item, i) => (
        <div key={i} className="space-y-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">{item.label}</span>
            <span className="font-bold" style={{ color: item.color }}>{item.val}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${item.val}%`, background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsMiniVisual() {
  const bars = [65, 80, 55, 90, 70, 85];
  return (
    <div className="font-mono text-xs">
      <div className="flex items-center gap-1 text-[10px] text-violet-400/70 border-b border-violet-500/20 pb-1 mb-3">
        <span>▸ analytics.dash</span>
      </div>
      <div className="flex items-end gap-1.5 h-12">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm"
              style={{
                height: `${(h / 100) * 40}px`,
                background: `linear-gradient(180deg, #a855f7 0%, rgba(168,85,247,0.3) 100%)`,
                boxShadow: "0 0 6px rgba(168,85,247,0.6)",
              }}
            />
            <span className="text-[8px] text-slate-600">Q{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrgMiniVisual() {
  return (
    <div className="font-mono text-[10px] text-slate-500 space-y-1">
      <div className="text-green-400/70 border-b border-green-500/20 pb-1 mb-2">▸ org.network</div>
      <div className="flex flex-col items-center gap-1">
        <div className="px-3 py-1 rounded border border-emerald-500/40 text-emerald-400 text-[9px]">CEO</div>
        <div className="w-px h-3 bg-emerald-500/30" />
        <div className="flex gap-3">
          {["CTO", "CFO", "CMO"].map((r) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <div className="px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400/70 text-[9px]">{r}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature cards data ────────────────────────────────────────────────────────
const featureCards: FeatureCard[] = [
  {
    id: "mbo",
    eyebrow: "MBO Engine",
    title: "Obiettivi che guidano la performance",
    description: "Assegna obiettivi con pesi, target e premi. Calcolo automatico del payout con Entry Gate e overperformance.",
    icon: Target,
    color: "cyan",
    stats: [{ label: "Moduli", val: "6+" }, { label: "Real-time", val: "✓" }],
    visual: <MboMiniVisual />,
  },
  {
    id: "performance",
    eyebrow: "Performance 360°",
    title: "Un ciclo completo di valutazione",
    description: "Autovalutazione, feedback multi-livello e valutazione manager in un unico flusso strutturato.",
    icon: ClipboardCheck,
    color: "pink",
    stats: [{ label: "Livelli", val: "3" }, { label: "Cicli", val: "∞" }],
    visual: <PerfMiniVisual />,
  },
  {
    id: "analytics",
    eyebrow: "Analytics Hub",
    title: "Decisioni guidate dai dati",
    description: "Dashboard KPI, report di completamento, distribuzione competenze e export CSV per analisi esterne.",
    icon: BarChart3,
    color: "violet",
    stats: [{ label: "KPI live", val: "12+" }, { label: "Export", val: "CSV" }],
    visual: <AnalyticsMiniVisual />,
  },
  {
    id: "org",
    eyebrow: "Org Navigator",
    title: "La struttura aziendale, chiara",
    description: "Visualizza la gerarchia, esplora i team e le relazioni di reporting con una vista interattiva.",
    icon: Network,
    color: "green",
    stats: [{ label: "Livelli", val: "N" }, { label: "Vista", val: "live" }],
    visual: <OrgMiniVisual />,
  },
  {
    id: "competenze",
    eyebrow: "Skills Matrix",
    title: "Modelli di competenza su misura",
    description: "Definisci modelli per ogni ruolo, assegna cicli e traccia l'evoluzione delle competenze nel tempo.",
    icon: Award,
    color: "pink",
    stats: [{ label: "Ruoli", val: "∞" }, { label: "Livelli", val: "5" }],
    visual: (
      <div className="font-mono text-[10px] space-y-1.5">
        <div className="text-pink-400/70 border-b border-pink-500/20 pb-1 mb-2">▸ competenze.matrix</div>
        {["Leadership", "Problem Solving", "Comunicazione"].map((c, i) => (
          <div key={c} className="flex items-center gap-2">
            <span className="text-slate-500 text-[9px] w-20 truncate">{c}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((dot) => (
                <div key={dot} className="w-2.5 h-2.5 rounded-sm" style={{ background: dot <= i + 3 ? "#ff0080" : "#1a1f2e", boxShadow: dot <= i + 3 ? "0 0 4px #ff0080" : "none" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "sviluppo",
    eyebrow: "Growth Tracker",
    title: "Crescita professionale guidata",
    description: "Manager e dipendenti co-progettano piani di sviluppo concreti con obiettivi, azioni e scadenze.",
    icon: TrendingUp,
    color: "cyan",
    stats: [{ label: "Piani", val: "attivi" }, { label: "Alert", val: "auto" }],
    visual: (
      <div className="font-mono text-[10px] space-y-1.5">
        <div className="text-cyan-400/70 border-b border-cyan-500/20 pb-1 mb-2">▸ sviluppo.tracker</div>
        {[
          { task: "Leadership training", done: true },
          { task: "Cert. PM avanzato", done: false },
          { task: "Mentoring Q2", done: false },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-[9px]">
            <span style={{ color: t.done ? "#00f5ff" : "#374151" }}>{t.done ? "✓" : "○"}</span>
            <span className={t.done ? "text-slate-400 line-through" : "text-slate-400"}>{t.task}</span>
          </div>
        ))}
      </div>
    ),
  },
];

// ─── Carousel ─────────────────────────────────────────────────────────────────
function FeatureCarousel() {
  const [active, setActive] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardWidth = 400;

  useEffect(() => {
    if (trackRef.current) {
      const offset = active * cardWidth - (trackRef.current.parentElement?.clientWidth ?? 0) / 2 + cardWidth / 2;
      trackRef.current.style.transform = `translateX(-${Math.max(0, offset)}px)`;
    }
  }, [active]);

  const prev = () => setActive((a) => Math.max(0, a - 1));
  const next = () => setActive((a) => Math.min(featureCards.length - 1, a + 1));

  return (
    <div className="relative">
      {/* Track */}
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-5 pb-6 transition-transform duration-500 ease-out"
          style={{ paddingLeft: "max(2rem, calc(50vw - 190px))" }}
        >
          {featureCards.map((card, i) => (
            <div key={card.id} onClick={() => setActive(i)} className="cursor-pointer">
              <Card3D card={card} active={i === active} />
            </div>
          ))}
          <div className="w-16 shrink-0" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <button
          onClick={prev}
          disabled={active === 0}
          className="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ boxShadow: active > 0 ? "0 0 12px rgba(0,245,255,0.2)" : "none" }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-2">
          {featureCards.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === active ? "24px" : "8px",
                height: "8px",
                background: i === active ? "#00f5ff" : "rgba(0,245,255,0.2)",
                boxShadow: i === active ? "0 0 8px #00f5ff" : "none",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={active === featureCards.length - 1}
          className="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ boxShadow: active < featureCards.length - 1 ? "0 0 12px rgba(0,245,255,0.2)" : "none" }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Community stats ──────────────────────────────────────────────────────────
const communityStats = [
  { val: "6", label: "Moduli integrati", icon: Zap, color: "#00f5ff" },
  { val: "360°", label: "Feedback multi-livello", icon: Globe, color: "#ff0080" },
  { val: "∞", label: "Obiettivi configurabili", icon: Target, color: "#a855f7" },
  { val: "Real-time", label: "Analytics & Report", icon: BarChart3, color: "#00ff88" },
  { val: "3", label: "Ruoli utente", icon: Users, color: "#00f5ff" },
  { val: "DIRS", label: "Overperformance cap", icon: Star, color: "#ff0080" },
];

function CommunitySection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <GlowOrb color="#00f5ff" className="w-[400px] h-[400px] -left-40 top-0" />
      <GlowOrb color="#a855f7" className="w-[300px] h-[300px] right-0 bottom-0" />
      <RetroGrid />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <NeonBadge color="green">Community & Piattaforma</NeonBadge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4 leading-tight">
            Una piattaforma,{" "}
            <span style={{ color: "#00ff88", textShadow: "0 0 30px rgba(0,255,136,0.5)" }}>tre prospettive</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Dipendenti, Manager e HR lavorano in sinergia sulla stessa piattaforma.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
          {communityStats.map((s, i) => (
            <div
              key={i}
              className="relative rounded-2xl p-6 group overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0d1424 0%, #0a0f1e 100%)",
                border: `1px solid ${s.color}30`,
                boxShadow: `0 0 20px ${s.color}10`,
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ boxShadow: `inset 0 0 30px ${s.color}15` }} />
              <s.icon className="h-5 w-5 mb-3" style={{ color: s.color }} />
              <div className="text-3xl font-bold font-mono mb-1" style={{ color: s.color, textShadow: `0 0 20px ${s.color}60` }}>
                {s.val}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Persona cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: UserCheck,
              role: "Dipendente",
              color: "#00f5ff",
              points: ["Visualizza i tuoi obiettivi MBO", "Completa l'autovalutazione", "Richiedi e dai feedback", "Monitora il piano di sviluppo"],
            },
            {
              icon: Users,
              role: "Manager",
              color: "#a855f7",
              points: ["Valuta le performance del team", "Costruisci piani di sviluppo", "Monitora peso e avanzamento MBO", "Accedi ai report del team"],
            },
            {
              icon: Building2,
              role: "HR / Admin",
              color: "#ff0080",
              points: ["Gestisci anagrafica e strutture", "Configura cicli di valutazione", "Assegna obiettivi in bulk", "Analizza dati e genera report"],
            },
          ].map((persona) => (
            <div
              key={persona.role}
              className="rounded-2xl p-6 group relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0d1424 0%, #080c18 100%)",
                border: `1px solid ${persona.color}30`,
              }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2" style={{ background: persona.color }} />

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${persona.color}15`, border: `1px solid ${persona.color}40`, boxShadow: `0 0 20px ${persona.color}20` }}
              >
                <persona.icon className="h-6 w-6" style={{ color: persona.color }} />
              </div>

              <h3 className="text-xl font-bold text-white mb-4" style={{ textShadow: `0 0 20px ${persona.color}30` }}>
                {persona.role}
              </h3>

              <ul className="space-y-3">
                {persona.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <span className="text-sm shrink-0 mt-0.5" style={{ color: persona.color }}>›</span>
                    <span className="text-sm text-slate-400">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 3D Hero HUD element ──────────────────────────────────────────────────────
function HeroHUD() {
  return (
    <div
      className="relative w-full max-w-xl mx-auto"
      style={{ perspective: "1000px" }}
    >
      {/* Main panel */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #0d1424 0%, #080c18 100%)",
          border: "1px solid rgba(0,245,255,0.3)",
          boxShadow: "0 0 60px rgba(0,245,255,0.15), 0 0 120px rgba(0,245,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
          transform: "rotateX(4deg) rotateY(-4deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Terminal header */}
        <div
          className="px-5 py-3 flex items-center gap-3 border-b"
          style={{ background: "rgba(0,245,255,0.05)", borderColor: "rgba(0,245,255,0.15)" }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57", boxShadow: "0 0 6px #ff5f57" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e", boxShadow: "0 0 6px #febc2e" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#28c840", boxShadow: "0 0 6px #28c840" }} />
          </div>
          <span className="text-xs font-mono text-cyan-400/70 ml-2">talenthub://tabellone-mbo · 2026</span>
          <span className="ml-auto text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="p-5 space-y-3">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-slate-600 uppercase tracking-wider border-b border-cyan-500/10 pb-2">
            <span className="col-span-4">Dipendente</span>
            <span className="col-span-3">Dept</span>
            <span className="col-span-3">Performance</span>
            <span className="col-span-2 text-right">Payout</span>
          </div>

          {[
            { name: "M. Bianchi", dept: "Technology", pct: 94, payout: "€ 8.4k", color: "#00f5ff", type: "DIRS" },
            { name: "L. Rossi", dept: "Finance", pct: 78, payout: "€ 5.2k", color: "#a855f7", type: "STD" },
            { name: "G. Verdi", dept: "Sales", pct: 108, payout: "€ 11.2k", color: "#00ff88", type: "CEO" },
            { name: "A. Ferrari", dept: "Marketing", pct: 61, payout: "€ 3.1k", color: "#ff0080", type: "STD" },
          ].map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 items-center py-1.5 rounded-lg px-2 group transition-colors"
              style={{ background: "rgba(255,255,255,0.01)" }}
            >
              <div className="col-span-4 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 font-mono"
                  style={{ background: `${row.color}20`, color: row.color, border: `1px solid ${row.color}40` }}
                >
                  {row.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="text-[11px] text-slate-300 font-medium truncate">{row.name}</span>
              </div>
              <div className="col-span-3">
                <span className="text-[10px] text-slate-500 font-mono">{row.dept}</span>
              </div>
              <div className="col-span-3 flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(row.pct, 100)}%`, background: row.color, boxShadow: `0 0 6px ${row.color}` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: row.color }}>{row.pct}%</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-[11px] font-bold font-mono text-white">{row.payout}</span>
              </div>
            </div>
          ))}

          {/* Entry Gate indicator */}
          <div
            className="mt-2 rounded-xl px-4 py-2.5 flex items-center justify-between"
            style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.2)" }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400">Entry Gate</span>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: "#00ff88", textShadow: "0 0 8px #00ff88" }}>
              ✓ SUPERATO · 97.3%
            </span>
          </div>
        </div>
      </div>

      {/* Floating chip top-right */}
      <div
        className="absolute -top-4 -right-4 rounded-xl px-3 py-2 flex items-center gap-2 z-10"
        style={{
          background: "#0d1424",
          border: "1px solid rgba(255,0,128,0.4)",
          boxShadow: "0 0 20px rgba(255,0,128,0.2)",
          transform: "translateZ(20px)",
        }}
      >
        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
        <span className="text-xs font-mono text-pink-400 font-bold">MBO 2026</span>
      </div>

      {/* Floating chip bottom-left */}
      <div
        className="absolute -bottom-4 -left-4 rounded-xl px-3 py-2 flex items-center gap-2 z-10 hidden md:flex"
        style={{
          background: "#0d1424",
          border: "1px solid rgba(0,245,255,0.4)",
          boxShadow: "0 0 20px rgba(0,245,255,0.2)",
          transform: "translateZ(20px)",
        }}
      >
        <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-xs font-mono text-cyan-400">+24% Q3</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#080c14" }}>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
        style={{
          background: "rgba(8,12,20,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,245,255,0.1)",
          boxShadow: "0 0 30px rgba(0,0,0,0.5)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(0,245,255,0.2) 0%, rgba(168,85,247,0.2) 100%)",
                border: "1px solid rgba(0,245,255,0.4)",
                boxShadow: "0 0 20px rgba(0,245,255,0.2)",
              }}
            >
              <Target className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-xl leading-none tracking-tight">TalentHub</span>
              <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 font-mono" style={{ color: "#00f5ff" }}>
                Enterprise Platform
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-slate-500">
            {[["#showcase", "Showcase"], ["#community", "Community"], ["#solutions", "Soluzioni"]].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="hover:text-cyan-400 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 hover:after:w-full after:transition-all"
                style={{ "--tw-content": "", afterBackground: "#00f5ff" } as React.CSSProperties}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-400 hover:text-cyan-400 font-bold text-sm transition-colors">
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button
                className="font-bold text-sm h-10 px-5 rounded-xl gap-2 transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, rgba(0,245,255,0.2) 0%, rgba(168,85,247,0.2) 100%)",
                  border: "1px solid rgba(0,245,255,0.5)",
                  color: "#00f5ff",
                  boxShadow: "0 0 20px rgba(0,245,255,0.15)",
                }}
              >
                Inizia ora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-24 overflow-hidden lg:pt-36 lg:pb-32">
        <GlowOrb color="#00f5ff" className="w-[700px] h-[700px] -top-40 right-[-15%]" />
        <GlowOrb color="#a855f7" className="w-[500px] h-[500px] top-20 -left-32" />
        <GlowOrb color="#ff0080" className="w-[300px] h-[300px] bottom-0 left-1/2" />
        <RetroGrid />
        <Scanlines />

        <div className="max-w-7xl mx-auto px-6 relative flex flex-col lg:flex-row items-center gap-16 lg:gap-12">

          {/* Left */}
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="mb-8">
              <NeonBadge color="cyan">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Piattaforma HR enterprise · v2026
              </NeonBadge>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] font-black text-white leading-[1.02] mb-6 tracking-tight">
              Gestisci il talento.<br />
              <span
                className="inline-block"
                style={{
                  background: "linear-gradient(90deg, #00f5ff 0%, #a855f7 50%, #ff0080 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 30px rgba(0,245,255,0.4))",
                }}
              >
                Misura la performance.
              </span><br />
              <span className="text-slate-300">Cresci insieme.</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Un'unica piattaforma per MBO, valutazioni 360°, feedback, organigrammi e analytics HR.
              Trasparente per i dipendenti, potente per i manager.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-13 px-8 text-base font-bold gap-2 rounded-xl transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,245,255,0.25) 0%, rgba(168,85,247,0.25) 100%)",
                    border: "1px solid rgba(0,245,255,0.6)",
                    color: "#00f5ff",
                    boxShadow: "0 0 30px rgba(0,245,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  Accedi alla piattaforma
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#showcase">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-13 px-8 text-base text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-all"
                >
                  Scopri le funzionalità
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="mt-14 flex flex-wrap items-center justify-center lg:justify-start gap-8">
              {communityStats.slice(0, 4).map((s, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="text-3xl font-bold font-mono" style={{ color: s.color, textShadow: `0 0 20px ${s.color}60` }}>
                    {s.val}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — 3D HUD */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-none relative z-10">
            <HeroHUD />
          </div>
        </div>
      </section>

      {/* ── Feature Carousel ── */}
      <section id="showcase" className="relative py-24 overflow-hidden">
        <GlowOrb color="#a855f7" className="w-[500px] h-[500px] top-0 right-0" />
        <GlowOrb color="#00f5ff" className="w-[400px] h-[400px] bottom-0 left-0" />
        <RetroGrid />

        <div className="relative">
          <div className="max-w-6xl mx-auto px-6 mb-12 text-center">
            <NeonBadge color="violet">Feature Showcase</NeonBadge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4 leading-tight">
              Sei moduli.{" "}
              <span style={{ color: "#a855f7", textShadow: "0 0 30px rgba(168,85,247,0.5)" }}>Un'unica piattaforma.</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Naviga i moduli della piattaforma. Clicca su una card per esplorarla.
            </p>
          </div>

          <FeatureCarousel />
        </div>
      </section>

      {/* ── Community ── */}
      <section id="community">
        <CommunitySection />
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 overflow-hidden">
        <GlowOrb color="#00f5ff" className="w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <RetroGrid />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{
              background: "rgba(0,245,255,0.1)",
              border: "1px solid rgba(0,245,255,0.4)",
              boxShadow: "0 0 40px rgba(0,245,255,0.2)",
            }}
          >
            <Target className="h-10 w-10 text-cyan-400" />
          </div>

          <h2
            className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight"
            style={{ textShadow: "0 0 40px rgba(0,245,255,0.1)" }}
          >
            Pronto a trasformare<br />
            <span style={{ color: "#00f5ff", textShadow: "0 0 30px rgba(0,245,255,0.5)" }}>
              la gestione del talento?
            </span>
          </h2>

          <p className="text-lg text-slate-400 mb-10 font-mono">
            {">"} Accedi e configura obiettivi, cicli di valutazione e strutture organizzative.
          </p>

          <Link href="/login">
            <Button
              size="lg"
              className="h-14 px-12 text-base font-bold gap-3 rounded-2xl transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #00f5ff20 0%, #a855f720 100%)",
                border: "1px solid rgba(0,245,255,0.6)",
                color: "#00f5ff",
                boxShadow: "0 0 40px rgba(0,245,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              Accedi alla piattaforma
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-10 border-t"
        style={{ borderColor: "rgba(0,245,255,0.1)", background: "#060911" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)" }}
            >
              <Target className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <span className="text-slate-500 text-sm font-mono">TalentHub — Enterprise HR Platform</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span>MBO</span>
            <span>Performance</span>
            <span>Analytics</span>
            <span>Competenze</span>
            <Link href="/login">
              <span className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer">Accedi</span>
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
