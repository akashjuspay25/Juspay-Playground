import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface AnimatedBackgroundProps {
  theme?: string;
}

export function AnimatedBackground({ theme = "noir" }: AnimatedBackgroundProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles on client side only
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    setParticles(newParticles);
  }, []);

  // Theme-based color configurations
  const themeColors = {
    noir: {
      orb1: "from-red-500/20 to-pink-500/20",
      orb2: "from-orange-500/15 to-red-500/15",
      orb3: "from-pink-500/10 to-rose-500/10",
    },
    aurora: {
      orb1: "from-emerald-500/20 to-teal-500/20",
      orb2: "from-green-500/15 to-emerald-500/15",
      orb3: "from-teal-500/10 to-cyan-500/10",
    },
    steel: {
      orb1: "from-zinc-500/20 to-gray-500/20",
      orb2: "from-slate-500/15 to-zinc-500/15",
      orb3: "from-gray-500/10 to-slate-500/10",
    },
    sunset: {
      orb1: "from-orange-500/20 to-amber-500/20",
      orb2: "from-yellow-500/15 to-orange-500/15",
      orb3: "from-amber-500/10 to-yellow-500/10",
    },
    midnight: {
      orb1: "from-indigo-500/20 to-purple-500/20",
      orb2: "from-violet-500/15 to-indigo-500/15",
      orb3: "from-purple-500/10 to-fuchsia-500/10",
    },
  };

  const colors = themeColors[theme as keyof typeof themeColors] || themeColors.noir;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Gradient Orbs with theme-based colors */}
      <motion.div
        className={cn(
          "absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br blur-[120px] transition-all duration-1000",
          colors.orb1
        )}
        style={{ top: "-10%", left: "-10%" }}
        animate={{
          x: [0, 100, 50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cn(
          "absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br blur-[100px] transition-all duration-1000",
          colors.orb2
        )}
        style={{ top: "40%", right: "-5%" }}
        animate={{
          x: [0, -80, 40, 0],
          y: [0, 60, -40, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
      <motion.div
        className={cn(
          "absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br blur-[90px] transition-all duration-1000",
          colors.orb3
        )}
        style={{ bottom: "10%", left: "30%" }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.1, 0.8, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 10 }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-current"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Noise Texture */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
