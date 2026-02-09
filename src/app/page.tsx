"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Atom, ArrowRight, FileText, Compass, Zap, Play, Code, Sparkles, 
  Github, Brain, Layers, ChevronRight, Beaker, BookOpen, Cpu
} from "lucide-react";

// Pre-computed deterministic particle positions (looks random but is stable)
const PARTICLE_DATA = [
  { xPercent: 15, yPercent: 20, scale: 0.8, drift: -150, duration: 15 },
  { xPercent: 85, yPercent: 40, scale: 0.6, drift: -200, duration: 18 },
  { xPercent: 30, yPercent: 70, scale: 0.9, drift: -120, duration: 12 },
  { xPercent: 70, yPercent: 10, scale: 0.5, drift: -180, duration: 20 },
  { xPercent: 45, yPercent: 55, scale: 0.7, drift: -220, duration: 14 },
  { xPercent: 10, yPercent: 80, scale: 0.65, drift: -160, duration: 16 },
  { xPercent: 90, yPercent: 25, scale: 0.85, drift: -140, duration: 13 },
  { xPercent: 55, yPercent: 90, scale: 0.55, drift: -190, duration: 19 },
  { xPercent: 25, yPercent: 35, scale: 0.75, drift: -170, duration: 17 },
  { xPercent: 60, yPercent: 60, scale: 0.95, drift: -130, duration: 11 },
  { xPercent: 5, yPercent: 50, scale: 0.6, drift: -210, duration: 15 },
  { xPercent: 75, yPercent: 75, scale: 0.8, drift: -145, duration: 18 },
  { xPercent: 40, yPercent: 15, scale: 0.7, drift: -185, duration: 12 },
  { xPercent: 95, yPercent: 65, scale: 0.5, drift: -155, duration: 20 },
  { xPercent: 20, yPercent: 85, scale: 0.9, drift: -175, duration: 14 },
];

// Animated floating particles
function FloatingParticles() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  if (dimensions.width === 0) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_DATA.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
          initial={{ 
            x: (p.xPercent / 100) * dimensions.width, 
            y: (p.yPercent / 100) * dimensions.height,
            scale: p.scale
          }}
          animate={{ 
            y: [null, p.drift],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: p.duration,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

// Animated code snippet for hero section
const codeSnippet = `// From paper to prototype in seconds
const paper = await upload("research.pdf");
const analysis = await gemini.analyze(paper);
const prototype = await gemini.generatePrototype({
  concept: analysis.keyAlgorithm,
  interactive: true,
  visualization: "3d"
});`;

function TypewriterCode() {
  const [displayedCode, setDisplayedCode] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < codeSnippet.length) {
      const timeout = setTimeout(() => {
        setDisplayedCode(prev => prev + codeSnippet[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  return (
    <pre className="text-xs sm:text-sm font-mono text-left overflow-hidden">
      <code className="text-gray-300">
        {displayedCode}
        <span className="animate-pulse text-blue-400">|</span>
      </code>
    </pre>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      {/* Background Grid - Same as other pages */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Radial gradients for depth */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Animated particles */}
      {mounted && <FloatingParticles />}

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <motion.div 
                className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Atom className="w-5 h-5 text-blue-400" />
              </motion.div>
              <span className="text-xl font-bold text-white">
                Sci<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Proto</span>
              </span>
            </div>
            
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link href="/papers" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
                Your Papers
              </Link>
              <Link href="/discover" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
                Discover
              </Link>
              <a 
                href="https://github.com/mutaician/sciproto" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5 text-gray-400" />
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-20">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-gray-300">Powered by</span>
            <span className="text-white font-semibold">Gemini 3</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
          >
            Transform Research
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Into Living Prototypes
              </span>
              <motion.span 
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload any research paper and watch AI generate interactive 
            visualizations that bring complex algorithms to life.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/papers"
              className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
            >
              <FileText className="w-5 h-5" />
              Upload a Paper
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
            </Link>
            
            <Link
              href="/discover"
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-lg border border-white/10 hover:border-purple-500/30 transition-all"
            >
              <Compass className="w-5 h-5 text-purple-400" />
              Browse arXiv
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>

          {/* Code Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden">
              {/* Window controls */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-4 text-xs text-gray-500 font-mono">sciproto.ts</span>
              </div>
              {mounted && <TypewriterCode />}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Three simple steps to turn any paper into an interactive experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8" />,
                title: "1. Upload Paper",
                description: "Upload any PDF research paper or browse the latest from arXiv",
                color: "blue",
                gradient: "from-blue-500/20 to-blue-600/5"
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: "2. AI Analysis",
                description: "Gemini 3 extracts key concepts, algorithms, and mathematical foundations",
                color: "purple",
                gradient: "from-purple-500/20 to-purple-600/5"
              },
              {
                icon: <Play className="w-8 h-8" />,
                title: "3. Interactive Prototype",
                description: "Get working React prototypes with real-time parameter controls",
                color: "emerald",
                gradient: "from-emerald-500/20 to-emerald-600/5"
              }
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group relative p-8 rounded-2xl bg-gradient-to-br ${step.gradient} border border-${step.color}-500/10 hover:border-${step.color}-500/30 transition-all overflow-hidden`}
              >
                {/* Background glow on hover */}
                <div className={`absolute inset-0 bg-${step.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className={`relative z-10 inline-flex p-4 rounded-xl bg-${step.color}-500/10 text-${step.color}-400 mb-6 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <h3 className="relative z-10 text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="relative z-10 text-gray-400 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                <Beaker className="w-4 h-4" />
                Use Cases
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Perfect for Researchers & Students
              </h2>
              <ul className="space-y-4">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, text: "Understand complex algorithms visually" },
                  { icon: <Layers className="w-5 h-5" />, text: "Explore parameter spaces interactively" },
                  { icon: <Cpu className="w-5 h-5" />, text: "Validate paper claims with real implementations" },
                  { icon: <Zap className="w-5 h-5" />, text: "Accelerate literature review process" },
                  { icon: <Code className="w-5 h-5" />, text: "Get working code to build upon" }
                ].map((item, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 text-gray-300"
                  >
                    <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                      {item.icon}
                    </div>
                    {item.text}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl" />
              <div className="relative aspect-square rounded-2xl bg-gray-900/50 backdrop-blur border border-white/10 flex items-center justify-center overflow-hidden">
                {/* Animated visualization preview */}
                <div className="relative w-48 h-48">
                  <motion.div
                    className="absolute inset-0 border-2 border-blue-500/30 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-4 border-2 border-purple-500/30 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-8 border-2 border-emerald-500/30 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Atom className="w-16 h-16 text-blue-400" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-center">
                  <p className="text-sm text-gray-400">Real-time interactive visualizations</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl" />
            <div className="relative bg-gray-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
              <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Explore?
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto">
                Start transforming research papers into interactive experiences today.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold text-lg transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-105"
              >
                <Compass className="w-5 h-5" />
                Discover Papers
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Atom className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-gray-400">SciProto</span>
          </div>
          <p>Built for the Gemini 3 Hackathon 🚀</p>
          <div className="flex items-center gap-4">
            <Link href="/papers" className="hover:text-gray-300 transition-colors">Papers</Link>
            <Link href="/discover" className="hover:text-gray-300 transition-colors">Discover</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
