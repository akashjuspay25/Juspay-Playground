import { motion, useScroll, useTransform, useSpring, useMotionValue } from "motion/react";
import { ArrowRight, Code2, Monitor, MessageSquare, ShieldCheck, Zap, Globe, ChevronRight, Sparkles, Layers, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type AppTheme, type ThemeColors } from "@/src/App";
import { useRef } from "react";

interface LandingPageProps {
  onStart: () => void;
  activeTheme: ThemeColors;
}

// Floating particles component
function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
            opacity: 0.3,
          }}
          initial={{ y: "100vh" }}
          animate={{ y: "-100vh" }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        >
          <div
            className={`w-1 h-1 rounded-full ${color}`}
            style={{ opacity: 0.6 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Gradient orbs background
function GradientOrbs({ activeTheme }: { activeTheme: ThemeColors }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className={`gradient-orb w-96 h-96 ${activeTheme.primary} blur-[120px]`}
        style={{ top: "10%", left: "10%" }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="gradient-orb w-80 h-80 bg-purple-500/30 blur-[100px]"
        style={{ top: "40%", right: "15%" }}
        animate={{
          x: [0, -40, 60, 0],
          y: [0, 30, -40, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="gradient-orb w-72 h-72 bg-pink-500/20 blur-[90px]"
        style={{ bottom: "20%", left: "30%" }}
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.1, 0.85, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
}

export function LandingPage({ onStart, activeTheme }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Background Elements */}
      <GradientOrbs activeTheme={activeTheme} />
      <FloatingParticles color={activeTheme.text} />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Hero Section */}
      <motion.div style={{ y, opacity }} className="relative z-10">
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 px-6">
          {/* Hero Content */}
          <div className="max-w-5xl text-center space-y-10">
            {/* Floating Bar Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex"
            >
              <motion.div
                animate={{ y: [0, -6, 0, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 rounded-2xl blur-xl opacity-50" />

                {/* Main bar */}
                <div className="relative flex items-center gap-6 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200 shadow-2xl">
                  {/* AI Assistant */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Playground</span>
                      <span className="text-xs font-bold text-white dark:text-zinc-900">AI Assistant</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded">
                      BETA
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-8 bg-zinc-700 dark:bg-zinc-300" />

                  {/* App Integrator */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Playground</span>
                      <span className="text-xs font-bold text-white dark:text-zinc-900">Smart App Integrator</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded">
                      BETA
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Main Heading with Character Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
                <motion.span
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="block text-zinc-900 dark:text-white"
                >
                  Experience the
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                  className={cn("block mt-2", activeTheme.text)}
                >
                  Future of Payments
                </motion.span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              Juspay is India&apos;s leading payments orchestrator, processing millions of
              transactions daily with high reliability and deep integrations.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <div
                  className={cn(
                    "absolute inset-0 blur-xl opacity-40 group-hover:opacity-70 transition-opacity",
                    activeTheme.primary
                  )}
                />
                <Button
                  onClick={onStart}
                  size="lg"
                  className={cn(
                    "relative h-14 px-8 text-lg rounded-full border-0",
                    activeTheme.primary,
                    "text-white font-semibold shadow-xl"
                  )}
                >
                  Launch Playground
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </Button>
              </motion.div>

              <motion.a
                href="https://juspay.io/docs"
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-14 px-8 text-lg rounded-full border-2",
                  "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm",
                  "hover:bg-white dark:hover:bg-zinc-800 transition-all"
                )}
              >
                Read Docs
                <ChevronRight className="w-4 h-4 ml-1" />
              </motion.a>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl w-full px-4">
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              title="API Simulation"
              description="Simulate full Juspay API lifecycles including Orders, Sessions, and Refunds with real-time response feedback."
              delay={0.3}
              activeTheme={activeTheme}
              index={0}
            />
            <FeatureCard
              icon={<Monitor className="w-8 h-8" />}
              title="Live Interface"
              description="Visualize how checkout interfaces and customized flows will look on devices with our real-time simulator."
              delay={0.4}
              activeTheme={activeTheme}
              index={1}
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="AI Support Agent"
              description="Integrated AI agent to handle merchant queries, provide technical guidance, and suggest optimal integration plans."
              delay={0.5}
              activeTheme={activeTheme}
              index={2}
            />
          </div>

          {/* Tech Stack Marquee */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 w-full max-w-6xl overflow-hidden"
          >
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-500 mb-8 font-medium uppercase tracking-widest">
              Supports All Major Platforms
            </p>
            <div className="relative">
              <div className="flex gap-8 animate-marquee">
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex gap-8 shrink-0">
                    {["React", "Android", "iOS", "Flutter", "React Native", "Capacitor", "Cordova"].map(
                      (tech, i) => (
                        <motion.div
                          key={`${setIndex}-${i}`}
                          whileHover={{ scale: 1.1, y: -2 }}
                          className={cn(
                            "px-6 py-3 rounded-full glass text-sm font-medium",
                            "text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          {tech}
                        </motion.div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Secondary Stats/Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 pt-20 border-t border-zinc-200 dark:border-zinc-800 w-full max-w-6xl"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <Stat
                icon={<ShieldCheck className="w-5 h-5" />}
                label="PCI-DSS Level 1 Secure"
                value="Certified"
                delay={0}
                activeTheme={activeTheme}
              />
              <Stat
                icon={<Zap className="w-5 h-5" />}
                label="Processing Time"
                value="< 200ms"
                delay={0.1}
                activeTheme={activeTheme}
                isNumeric
                numericValue={200}
                suffix="ms"
              />
              <Stat
                icon={<Layers className="w-5 h-5" />}
                label="Daily Scalability"
                value="100M+"
                delay={0.2}
                activeTheme={activeTheme}
                isNumeric
                numericValue={100}
                suffix="M+"
              />
              <Stat
                icon={<Cpu className="w-5 h-5" />}
                label="Integration Time"
                value="2 Days"
                delay={0.3}
                activeTheme={activeTheme}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Add marquee styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
  activeTheme,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  activeTheme: ThemeColors;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={cn(
        "group relative p-8 rounded-3xl glass",
        "border border-zinc-200 dark:border-zinc-800",
        "shadow-lg hover:shadow-2xl transition-all duration-500"
      )}
    >
      {/* Hover glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl",
          activeTheme.bg
        )}
      />

      {/* Icon Container */}
      <motion.div
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden",
          activeTheme.bg,
          activeTheme.text
        )}
      >
        {/* Animated background */}
        <motion.div
          className={cn("absolute inset-0 opacity-50", activeTheme.primary)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="relative z-10">{icon}</div>
      </motion.div>

      {/* Content */}
      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-current group-hover:to-purple-500 transition-all">
        {title}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>

      {/* Learn more link */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="mt-6 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className={activeTheme.text}>Learn more</span>
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <ChevronRight className="w-4 h-4 ml-1" />
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2) {
  const [count, setCount] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });

  useEffect(() => {
    motionValue.set(end);
  }, [end, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setCount(Math.round(latest));
    });
    return () => unsubscribe();
  }, [springValue]);

  return count;
}

function Stat({
  icon,
  label,
  value,
  delay,
  activeTheme,
  isNumeric = false,
  numericValue,
  suffix = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
  activeTheme: ThemeColors;
  isNumeric?: boolean;
  numericValue?: number;
  suffix?: string;
}) {
  const animatedCount = isNumeric && numericValue !== undefined
    ? useAnimatedCounter(numericValue)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="text-center group cursor-default relative"
    >
      {/* Hover glow */}
      <motion.div
        className={cn("absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10", activeTheme.bg)}
      />

      <motion.div
        whileHover={{ rotate: 360, scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg",
          activeTheme.bg,
          activeTheme.text
        )}
      >
        {icon}
      </motion.div>
      <div className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-current group-hover:to-purple-500 transition-all">
        {isNumeric && animatedCount !== null ? `${animatedCount}${suffix}` : value}
      </div>
      <div className="text-sm text-zinc-500 dark:text-zinc-500 font-medium uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
}
