"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Atom, ArrowRight, FileText, Compass, Zap, Play, Code, Sparkles, Github } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Animated Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />

      {/* Header */}
      <header className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Atom className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xl font-bold text-white">
                Sci<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Proto</span>
              </span>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/papers" className="text-sm text-gray-400 hover:text-white transition-colors">
                Your Papers
              </Link>
              <Link href="/discover" className="text-sm text-gray-400 hover:text-white transition-colors">
                Discover
              </Link>
              <a 
                href="https://github.com" 
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
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Powered by Gemini 3
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
          >
            Transform Research
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Into Interactive Prototypes
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload any research paper and instantly generate interactive visualizations 
            that bring complex algorithms and concepts to life.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/papers"
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              <FileText className="w-5 h-5" />
              Upload a Paper
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/discover"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-lg border border-white/10 hover:border-white/20 transition-all"
            >
              <Compass className="w-5 h-5 text-purple-400" />
              Browse arXiv Papers
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white text-center mb-16"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="relative p-8 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all group"
            >
              <div className="inline-flex p-3 rounded-xl bg-blue-500/10 text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">1. Upload Paper</h3>
              <p className="text-gray-400">Upload any PDF research paper or browse papers directly from arXiv</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative p-8 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all group"
            >
              <div className="inline-flex p-3 rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">2. AI Analysis</h3>
              <p className="text-gray-400">Gemini 3 extracts key concepts, algorithms, and identifies prototypeable ideas</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">3. Interactive Prototype</h3>
              <p className="text-gray-400">Generate working React prototypes that let you explore and validate the paper&apos;s claims</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                Understand Research Like Never Before
              </h2>
              <ul className="space-y-4">
                {[
                  "Interactive visualizations of complex algorithms",
                  "Real-time parameter adjustment and exploration",
                  "Step-by-step algorithm breakdowns",
                  "Chat with an AI that understands the paper",
                  "Export and share prototypes"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <Code className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-400">Interactive Prototype Preview</p>
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
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Explore?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Start transforming research papers into interactive experiences today.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-lg transition-all shadow-lg"
            >
              <Compass className="w-5 h-5" />
              Discover Papers
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Atom className="w-4 h-4" />
            <span>SciProto</span>
          </div>
          <p>Built for the Gemini 3 Hackathon</p>
        </div>
      </footer>
    </main>
  );
}
