"use client";

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Search, Eye, Zap, CheckCircle,
  FileText, Megaphone, BarChart3, Rocket, Crown, Users,
  Globe, TrendingUp, Clock, Target, ChevronRight, HelpCircle, ChevronDown, Plus, ShieldCheck,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (path: string, params?: Record<string, any>) => void;
  projects: any[];
  categories: any[];
  intents: any[];
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

import { FAQ_ITEMS } from '@/lib/faq-data';
import { getCitabilityScore } from '@/lib/copy-generator';

const ECOSYSTEM_LOGOS = [
  { name: 'OpenAI (ChatGPT)', src: '/logos/openai.png' },
  { name: 'Anthropic (Claude)', src: '/logos/anthropic.png' },
  { name: 'Perplexity AI', src: '/logos/perplexity.png' },
  { name: 'Google Gemini', src: '/logos/gemini.png' },
  { name: 'GitHub', src: '/logos/github.png' },
  { name: 'AWS', src: '/logos/aws.png' },
  { name: 'Hostinger', src: '/logos/hostinger.png' },
  { name: 'Vercel', src: '/logos/vercel.png' },
  { name: 'Abacus AI', src: '/logos/abacusai.png' },
];

/* ─── FAQ Accordion Component ─── */
function FaqItem({ item, isOpen, onToggle }: { item: typeof FAQ_ITEMS[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:border-primary/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer group"
      >
        <span className="font-bold text-sm sm:text-base pr-4 group-hover:text-primary transition">{item.question}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 text-sm text-foreground/70 dark:text-foreground/60 leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <motion.div {...fadeUp(0.1)} className="max-w-3xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <HelpCircle className="h-3.5 w-3.5" /> FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-foreground/60 max-w-lg mx-auto">
            Everything you need to know about listing your project and getting cited by AI.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default function LandingView({ onNavigate, projects }: LandingViewProps) {
  const projectCount = (projects ?? []).length;

  const partnerProjects = useMemo(
    () => (projects ?? []).filter((p: any) => p?.platformPartner),
    [projects]
  );

  const recentProjects = useMemo(
    () => [...(projects ?? [])]
      .sort((a: any, b: any) => {
        const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 6),
    [projects]
  );

  return (
    <div className="font-sans relative">

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 1 — HERO                                          ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] -z-10 pointer-events-none overflow-hidden opacity-25 select-none">
          <div className="absolute top-8 left-1/4 w-[480px] h-[480px] bg-gradient-to-tr from-purple-400 via-primary/40 to-transparent rounded-full blur-[120px] animate-pulse [animation-duration:12s]" />
          <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-primary/30 via-violet-300 to-transparent rounded-full blur-[100px] animate-pulse [animation-duration:16s] [animation-delay:4s]" />
        </div>

        <motion.div {...fadeUp(0)} className="text-center max-w-4xl mx-auto px-4 space-y-7">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Free to list • No credit card required
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display leading-[1.08]">
            Get Found by AI.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-primary to-primary/80">
              Get Cited.
            </span>
            <br className="hidden sm:block" />
            {' '}Get Traffic.
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            CitableHub structures your project so AI systems recommend it,
            directories list it, and real users find it &mdash; starting today.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('/submit')}
              className="group relative bg-gradient-to-r from-purple-600 via-primary to-primary/90 hover:from-purple-700 hover:via-primary/80 text-primary-foreground font-black rounded-2xl text-base sm:text-lg px-10 py-5 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-primary/25 transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-3"
            >
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5 -mt-1 -mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
              </span>
              <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              List Your Project Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('/discover')}
              className="group text-foreground font-bold text-base sm:text-lg px-6 py-4 transition cursor-pointer flex items-center gap-2 hover:text-primary"
            >
              <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
              Explore the Directory
              <ChevronRight className="h-4 w-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Hosting micro-copy */}
          <p className="text-xs text-muted-foreground/70 pt-1">
            Works with any host (including Hostinger Web2Agent, Vercel, or AWS)
          </p>
        </motion.div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 1.5 — DISCOVERY ECOSYSTEM LOGOS                    ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-10 sm:py-14 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Heading */}
          <p className="text-center text-sm sm:text-base font-semibold text-muted-foreground">
            Your customers are already searching here
          </p>

          {/* Infinite carousel */}
          <div className="relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="flex animate-logo-scroll">
              {[...ECOSYSTEM_LOGOS, ...ECOSYSTEM_LOGOS].map((logo, i) => (
                <div
                  key={`${logo.name}-${i}`}
                  className="flex-shrink-0 mx-6 sm:mx-8 flex items-center justify-center h-10 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  title={logo.name}
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-7 sm:h-8 w-auto max-w-[120px] object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Closing insight */}
          <p className="text-center text-xs text-muted-foreground/60 italic max-w-xl mx-auto">
            They may never visit Google first. Make sure your project exists where AI looks for answers.
          </p>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 2 — PROBLEM (Pain Agitation)                       ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <motion.div {...fadeUp(0.05)} className="max-w-3xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight leading-tight">
            You built something great.{' '}
            <span className="text-muted-foreground">Nobody knows it exists.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              {
                emoji: '🔍',
                text: 'Google prioritizes established brands. New projects stay buried on page 10.',
              },
              {
                emoji: '🤖',
                text: 'AIs answer questions without citing your project. You don\u2019t exist for them.',
              },
              {
                emoji: '📢',
                text: 'Posting on social media isn\u2019t distribution. It\u2019s noise that disappears in hours.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-sm text-foreground/70 dark:text-foreground/60 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 3 — SOLUTION (What CitableHub Does)                ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-16 sm:py-24">
        <motion.div {...fadeUp(0.1)} className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight leading-tight">
              CitableHub gives your project a structured,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">AI-readable presence</span>
              {' '}&mdash; plus a step-by-step promotion plan.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Get Structured',
                desc: 'A citable profile that AI systems can read, quote, and recommend. Compatible with any infrastructure. We enhance your existing metadata (like llms.txt) to enterprise-grade AI trust.',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Megaphone,
                title: 'Get Promoted',
                desc: 'A personalized checklist of directories and platforms to submit your project. Copy ready. Links ready. UTMs ready.',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: Eye,
                title: 'Get Discovered',
                desc: 'Real users searching for solutions find your project inside CitableHub\u2019s AI-powered directory.',
                gradient: 'from-emerald-500 to-green-500',
              },
            ].map((card, i) => (
              <div key={i} className="group bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold font-display text-lg">{card.title}</h3>
                <p className="text-sm text-foreground/70 dark:text-foreground/60 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 4 — HOW IT WORKS (3 Steps)                        ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <motion.div {...fadeUp(0.1)} className="max-w-4xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Clock className="h-3.5 w-3.5" /> 10 minutes
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight">
              From invisible to citable in 10 minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'List your project',
                desc: 'Fill in your project details. Our AI autofills the hard parts.',
                icon: Rocket,
              },
              {
                step: '02',
                title: 'Get your Launch Kit',
                desc: 'Instantly receive your AI-optimized profile + promotion checklist with copy ready to paste.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Submit and track',
                desc: 'Submit to recommended directories. Track clicks, saves, and ranking movement from your dashboard.',
                icon: BarChart3,
              },
            ].map((s, i) => (
              <div key={i} className="relative bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-primary/60 dark:text-primary/50 font-display">{s.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-bold font-display text-base">{s.title}</h3>
                <p className="text-sm text-foreground/70 dark:text-foreground/60 leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 5 — SOCIAL PROOF / TRUST                          ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-16 sm:py-24">
        <motion.div {...fadeUp(0.1)} className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              Already trusted by founders and builders
            </h2>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: projectCount.toString(), label: 'Projects Listed', icon: Globe },
              { value: partnerProjects.length.toString(), label: 'Launch Partners', icon: Crown },
              { value: '10+', label: 'Promotion Destinations', icon: Megaphone },
              { value: '10 min', label: 'Average Setup Time', icon: Clock },
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 text-center space-y-1 shadow-sm">
                <stat.icon className="h-5 w-5 text-primary mx-auto" />
                <div className="text-2xl sm:text-3xl font-black font-display text-foreground">{stat.value}</div>
                <div className="text-xs text-foreground/60 dark:text-foreground/50 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Partner logos */}
          {partnerProjects.length > 0 && (
            <div className="space-y-4">
              <p className="text-center text-xs text-muted-foreground font-bold uppercase tracking-wider">Featured Launch Partners</p>
              <div className="flex flex-wrap justify-center gap-6">
                {partnerProjects.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => onNavigate(`/p/${p.slug}`)}
                    className="group flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                  >
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                        {(p.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-sm group-hover:text-primary transition">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">{p.category}</div>
                    </div>
                    <Crown className="h-3.5 w-3.5 text-violet-500 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 5.5 — RECENTLY ADDED                               ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <motion.div {...fadeUp(0.1)} className="max-w-5xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Plus className="h-3.5 w-3.5" /> Recently Added
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              Fresh on CitableHub
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              The latest projects optimized for AI discoverability
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((p: any) => {
              const citScore = getCitabilityScore(p);
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate(`/p/${p.slug}`)}
                  className="group bg-card border border-border rounded-2xl p-5 text-left shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer space-y-3"
                >
                  {/* Verified Entity Badge */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Citable Verified Entity
                  </div>
                  <div className="flex items-start gap-3">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-base flex-shrink-0">
                        {(p.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-sm group-hover:text-primary transition truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">{p.category || 'Uncategorized'}</div>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/60 line-clamp-2 leading-relaxed">
                    {p.summary || p.description || 'AI-citable profile on CitableHub'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        citScore >= 70 ? 'bg-emerald-500' : citScore >= 40 ? 'bg-amber-500' : 'bg-red-400'
                      }`} />
                      <span className="text-[10px] font-bold text-muted-foreground">Citability {citScore}%</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate('/projects')}
              className="text-sm font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              View all {projectCount} projects <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 6 — ALWAYS FREE + BOOST CTA                       ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-16 sm:py-24">
        <motion.div {...fadeUp(0.1)} className="max-w-3xl mx-auto px-4 space-y-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-3.5 w-3.5" /> Always Free
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            100% free. No limits. No catches.
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            List unlimited projects, use Discovery AI, get your AI-Citable profile, promotion checklist, and analytics — all completely free. Forever.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              'Unlimited projects',
              'AI Discovery engine',
              'Promotion checklist',
              'Full analytics',
            ].map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-1">
                <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold">{f}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={() => onNavigate('/submit')}
              className="bg-gradient-to-r from-purple-600 via-primary to-primary/90 hover:from-purple-700 text-primary-foreground font-black rounded-2xl text-base px-10 py-4 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              <Rocket className="h-5 w-5" />
              List Your Project Free
            </button>
            <p className="text-xs text-muted-foreground">
              Want to rank higher? <button onClick={() => onNavigate('/boost')} className="text-primary font-bold hover:underline cursor-pointer">Explore GQI Boosts →</button>
            </p>
          </div>
        </motion.div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 7 — EARLY ADOPTER TESTIMONIALS                     ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-16 sm:py-24">
        <motion.div {...fadeUp(0.1)} className="max-w-4xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <Users className="h-3.5 w-3.5" /> Early Adopters
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              What builders are saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'OctopuSkills',
                role: 'Marketing & Sales',
                quote: 'CitableHub gave us a structured, AI-readable profile in minutes. Our GQI score jumped and we started getting organic mentions from AI assistants within the first week.',
                initial: 'O',
                color: 'bg-orange-500',
              },
              {
                name: 'Wildverse',
                role: 'Developer Tools',
                quote: 'The promotion checklist alone saved us hours of research. We knew exactly where to submit, with copy ready to paste. This is what every indie project needs.',
                initial: 'W',
                color: 'bg-emerald-500',
              },
            ].map((t, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, si) => (
                    <span key={si} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-foreground/80 dark:text-foreground/70 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                    {t.initial}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-[10px] text-foreground/50 font-mono uppercase">{t.role}</div>
                  </div>
                  <Crown className="h-3.5 w-3.5 text-violet-500 ml-auto" />
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-foreground/50">
            Launch partners receive priority placement and a verified badge.
          </p>
        </motion.div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 8 — FAQ (AI-Optimized)                            ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <FaqSection />

      {/* ╔══════════════════════════════════════════════════════════════╗ */}
      {/* ║  SECTION 9 — FINAL CTA                                     ║ */}
      {/* ╚══════════════════════════════════════════════════════════════╝ */}
      <section className="py-20 sm:py-28">
        <motion.div {...fadeUp(0.1)} className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight">
            Your project deserves to be found.
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join CitableHub and get your AI-citable profile + promotion plan in 10 minutes.
          </p>
          <button
            onClick={() => onNavigate('/submit')}
            className="group bg-gradient-to-r from-purple-600 via-primary to-primary/90 hover:from-purple-700 hover:via-primary/80 text-primary-foreground font-black rounded-2xl text-base sm:text-lg px-12 py-5 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-primary/25 transform hover:-translate-y-1 active:translate-y-0 inline-flex items-center gap-3"
          >
            <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            List Your Project Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>
    </div>
  );
}
