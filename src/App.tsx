/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Consultant } from "@/src/components/Consultant";
import { Playground } from "@/src/components/Playground";
import { LandingPage } from "@/src/components/LandingPage";
import { AppIntegrator } from "@/src/components/AppIntegrator";
import { AnimatedBackground } from "@/src/components/AnimatedBackground";
import { Toaster } from "@/components/ui/sonner";
import { Code2, Terminal, BookOpen, Moon, Sun, Menu, Home, Bug, Puzzle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { SuggestionResponse, ChatMessage } from "@/src/lib/claude";

export type AppTheme = "noir" | "aurora" | "ocean" | "sunset" | "midnight";

export interface ThemeColors {
  primary: string;
  secondary: string;
  text: string;
  border: string;
  ring: string;
  bg: string;
  pageBg: string;
  accent: string;
}

export const APP_THEMES: Record<AppTheme, ThemeColors> = {
  ocean: { primary: "bg-[#1b85ff]", secondary: "bg-blue-100", text: "text-[#1b85ff]", border: "border-blue-200", ring: "focus-visible:ring-[#1b85ff]", bg: "bg-blue-50 dark:bg-blue-950/20", pageBg: "bg-zinc-100 dark:bg-zinc-950", accent: "blue" },
  noir: { primary: "bg-red-600", secondary: "bg-zinc-200", text: "text-red-600", border: "border-red-200", ring: "focus-visible:ring-red-600", bg: "bg-red-50 dark:bg-red-950/20", pageBg: "bg-zinc-100 dark:bg-zinc-950", accent: "red" },
  aurora: { primary: "bg-emerald-600", secondary: "bg-zinc-200", text: "text-emerald-600", border: "border-emerald-200", ring: "focus-visible:ring-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", pageBg: "bg-zinc-100 dark:bg-zinc-950", accent: "emerald" },
  sunset: { primary: "bg-orange-600", secondary: "bg-zinc-200", text: "text-orange-600", border: "border-orange-200", ring: "focus-visible:ring-orange-600", bg: "bg-orange-50 dark:bg-orange-950/20", pageBg: "bg-zinc-100 dark:bg-zinc-950", accent: "orange" },
  midnight: { primary: "bg-indigo-600", secondary: "bg-zinc-200", text: "text-indigo-600", border: "border-indigo-200", ring: "focus-visible:ring-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/20", pageBg: "bg-zinc-100 dark:bg-zinc-950", accent: "indigo" },
};

export default function App() {
  const [view, setView] = useState<"landing" | "playground" | "app-integrator" | "debugger">("landing");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("consultant");
  const [theme, setTheme] = useState<AppTheme>("ocean");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply theme CSS variables for smooth transitions
  useEffect(() => {
    const root = document.documentElement;
    const colors = APP_THEMES[theme];

    // Map Tailwind classes to CSS variable values
    const getColorValue = (cls: string) => {
      const colorMap: Record<string, string> = {
        'bg-red-600': '#dc2626',
        'bg-emerald-600': '#059669',
        'bg-zinc-600': '#52525b',
        'bg-orange-600': '#ea580c',
        'bg-indigo-600': '#4f46e5',
        'text-red-600': '#dc2626',
        'text-emerald-600': '#059669',
        'text-zinc-600': '#52525b',
        'text-orange-600': '#ea580c',
        'text-indigo-600': '#4f46e5',
      };
      return colorMap[cls] || cls;
    };

    root.style.setProperty('--theme-primary', getColorValue(colors.primary));
    root.style.setProperty('--theme-text', getColorValue(colors.text));
    root.style.setProperty('--theme-bg', colors.bg.includes('red') ? 'rgba(239, 68, 68, 0.1)' :
      colors.bg.includes('emerald') ? 'rgba(16, 185, 129, 0.1)' :
      colors.bg.includes('zinc') ? 'rgba(113, 113, 122, 0.1)' :
      colors.bg.includes('orange') ? 'rgba(249, 115, 22, 0.1)' :
      'rgba(99, 102, 241, 0.1)');
  }, [theme]);

  // Apply dark mode to html element for proper CSS cascade
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add("dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    }
  }, [isDarkMode]);

  const toggleTheme = (event: React.MouseEvent | boolean) => {
    const isNewDark = typeof event === 'boolean' ? event : !isDarkMode;

    // Fallback if browser doesn't support View Transition API
    if (!document.startViewTransition) {
      setIsDarkMode(isNewDark);
      return;
    }

    // Get click coordinates or use center of screen as fallback
    const clientX = typeof event === 'boolean' ? window.innerWidth / 2 : (event as React.MouseEvent).clientX;
    const clientY = typeof event === 'boolean' ? window.innerHeight / 2 : (event as React.MouseEvent).clientY;

    // Calculate the distance to the farthest corner
    const endRadius = Math.hypot(
      Math.max(clientX, window.innerWidth - clientX),
      Math.max(clientY, window.innerHeight - clientY)
    );

    // Start the view transition
    const transition = document.startViewTransition(() => {
      setIsDarkMode(isNewDark);
    });

    // Animate the reveal from the click point
    transition.ready.then(() => {
      // Animate the clip-path on the new root to reveal the new theme
      // This works for both dark->light and light->dark transitions
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${clientX}px ${clientY}px)`,
            `circle(${endRadius}px at ${clientX}px ${clientY}px)`,
          ],
        },
        {
          duration: 800,
          easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  // Lifted state for Consultant Session Persistence
  const [requirements, setRequirements] = useState("");
  const [techStack, setTechStack] = useState("");
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [activeFlowStep, setActiveFlowStep] = useState<number>(-1);

  const suggestedIntegration = suggestion?.sdkName || null;
  const activeTheme = APP_THEMES[theme];

  return (
    <div className={`min-h-screen font-sans relative ${isDarkMode ? 'dark' : ''}`}>
      {/* Animated Background */}
      <AnimatedBackground theme={theme} />

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-3 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors"
      >
        <motion.div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setView("landing")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="w-10 h-10 overflow-hidden rounded-xl bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center relative"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Animated gradient background */}
            <motion.div
              className={cn("absolute inset-0 opacity-30", activeTheme.primary)}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Juspay Playground Logo SVG */}
            <svg
              viewBox="0 0 40 40"
              className="w-7 h-7 relative z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer hexagon shape */}
              <motion.path
                d="M20 4L34 12V28L20 36L6 28V12L20 4Z"
                className={activeTheme.text}
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />

              {/* Inner J letter stylized */}
              <motion.path
                d="M15 14V22C15 24.5 17 26 20 26C23 26 25 24.5 25 22V20"
                className={activeTheme.text}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />

              {/* Dot for J */}
              <motion.circle
                cx="25"
                cy="14"
                r="2"
                className={activeTheme.text}
                fill="currentColor"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              />

              {/* Circuit/play lines */}
              <motion.path
                d="M8 20L12 20M28 20L32 20"
                className={activeTheme.text}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 1 }}
              />
            </svg>
          </motion.div>
          <div>
            <motion.h1
              className="font-bold text-xl tracking-tight leading-tight text-zinc-900 dark:text-white flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Juspay <span className={cn(activeTheme.text, "relative")}>
                Playground
                <motion.span
                  className={cn("absolute -bottom-1 left-0 h-0.5", activeTheme.primary)}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                />
              </span>

              {/* Boy Coding Animation */}
              <motion.div
                className="flex items-center ml-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                <motion.svg
                  viewBox="0 0 60 40"
                  className="w-10 h-8"
                  whileHover={{ scale: 1.1 }}
                >
                  {/* Ground */}
                  <rect x="0" y="35" width="40" height="2" rx="1" className="fill-zinc-400" />

                  {/* Boy Head */}
                  <circle cx="15" cy="12" r="5" className="fill-zinc-700 dark:fill-zinc-600" />

                  {/* Hair */}
                  <path
                    d="M10 11c0-3 2.5-5 5-5s5 2 5 5"
                    className="fill-zinc-800 dark:fill-zinc-500"
                  />

                  {/* Eyes */}
                  <circle cx="13" cy="12" r="0.8" className="fill-zinc-950" />
                  <circle cx="17" cy="12" r="0.8" className="fill-zinc-950" />

                  {/* Smile */}
                  <path
                    d="M13 14.5c0.5 0.5 1.5 0.5 2 0"
                    stroke="currentColor"
                    className="stroke-zinc-950"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Body */}
                  <path
                    d="M10 18c0-2 2-4 5-4s5 2 5 4v10h-10z"
                    className="fill-zinc-600 dark:fill-zinc-500"
                  />

                  {/* Left Arm - Balancing */}
                  <path
                    d="M10 20 L5 16"
                    className="stroke-zinc-600 dark:stroke-zinc-500"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Right Arm - Raised for kick */}
                  <motion.path
                    d="M20 20 L25 14"
                    className="stroke-zinc-600 dark:stroke-zinc-500"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ d: ["M20 20 L25 14", "M20 20 L26 12", "M20 20 L25 14"] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
                  />

                  {/* Left Leg - Standing */}
                  <path
                    d="M12 28 L12 35"
                    className="stroke-zinc-600 dark:stroke-zinc-500"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Right Leg - Kicking */}
                  <motion.path
                    d="M18 28 L22 32 L28 30"
                    className="stroke-zinc-600 dark:stroke-zinc-500"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ d: ["M18 28 L22 32 L28 30", "M18 28 L24 30 L32 28", "M18 28 L22 32 L28 30"] }}
                    transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1.7 }}
                  />

                  {/* Football */}
                  <motion.circle
                    cx="30"
                    cy="33"
                    r="3"
                    className="fill-zinc-800 dark:fill-zinc-300"
                    animate={{
                      cx: [30, 45, 55, 30],
                      cy: [33, 25, 30, 33],
                      scale: [1, 0.9, 0.8, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5, ease: "easeOut" }}
                  />

                  {/* Motion trail */}
                  <motion.circle
                    cx="35"
                    cy="30"
                    r="1"
                    className={activeTheme.text}
                    fill="currentColor"
                    opacity="0"
                    animate={{
                      cx: [35, 50, 58],
                      cy: [30, 22, 28],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5, delay: 0.1 }}
                  />
                </motion.svg>
              </motion.div>
            </motion.h1>
            <motion.p
              className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono uppercase tracking-widest leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Merchant Integration Suite
            </motion.p>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          {/* Navigation Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              animate={view === "landing" && !menuOpen ? {
                y: [0, -6, 0, -4, 0],
              } : {}}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {/* Animated Hamburger Icon */}
              <div className="relative w-5 h-5 flex flex-col items-center justify-center">
                {/* Glow effect during highlight */}
                {view === "landing" && !menuOpen && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)",
                      filter: "blur(8px)",
                    }}
                    animate={{
                      opacity: [0, 0.8, 0],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                      times: [0, 0.5, 1],
                    }}
                  />
                )}
                {/* Top line */}
                <motion.span
                  className="absolute w-5 h-0.5 rounded-full"
                  animate={view === "landing" && !menuOpen ? {
                    rotate: 0,
                    y: -4,
                    backgroundColor: ["#71717a", "#fbbf24", "#f59e0b", "#fbbf24", "#71717a"],
                    boxShadow: [
                      "0 0 0px rgba(245,158,11,0)",
                      "0 0 8px rgba(245,158,11,0.6)",
                      "0 0 12px rgba(245,158,11,0.8)",
                      "0 0 8px rgba(245,158,11,0.6)",
                      "0 0 0px rgba(245,158,11,0)",
                    ],
                  } : {
                    rotate: menuOpen ? 45 : 0,
                    y: menuOpen ? 0 : -4,
                    backgroundColor: isDarkMode ? "#ffffff" : "#18181b",
                    boxShadow: "0 0 0px rgba(245,158,11,0)",
                  }}
                  initial={{ backgroundColor: "#71717a" }}
                  transition={{
                    duration: view === "landing" && !menuOpen ? 1.8 : 0.25,
                    repeat: view === "landing" && !menuOpen ? Infinity : 0,
                    repeatDelay: view === "landing" && !menuOpen ? 3 : 0,
                    ease: view === "landing" && !menuOpen ? "easeInOut" : [0.25, 0.46, 0.45, 0.94],
                    times: view === "landing" && !menuOpen ? [0, 0.25, 0.5, 0.75, 1] : undefined,
                  }}
                />
                {/* Middle line */}
                <motion.span
                  className="absolute w-5 h-0.5 rounded-full"
                  animate={view === "landing" && !menuOpen ? {
                    opacity: 1,
                    scaleX: [1, 1.3, 1.5, 1.3, 1],
                    backgroundColor: ["#71717a", "#fbbf24", "#f59e0b", "#fbbf24", "#71717a"],
                    boxShadow: [
                      "0 0 0px rgba(245,158,11,0)",
                      "0 0 8px rgba(245,158,11,0.6)",
                      "0 0 12px rgba(245,158,11,0.8)",
                      "0 0 8px rgba(245,158,11,0.6)",
                      "0 0 0px rgba(245,158,11,0)",
                    ],
                  } : {
                    opacity: menuOpen ? 0 : 1,
                    scaleX: menuOpen ? 0 : 1,
                    backgroundColor: isDarkMode ? "#ffffff" : "#18181b",
                    boxShadow: "0 0 0px rgba(245,158,11,0)",
                  }}
                  initial={{ backgroundColor: "#71717a" }}
                  transition={{
                    duration: view === "landing" && !menuOpen ? 1.8 : 0.2,
                    repeat: view === "landing" && !menuOpen ? Infinity : 0,
                    repeatDelay: view === "landing" && !menuOpen ? 3 : 0,
                    ease: "easeInOut",
                    times: view === "landing" && !menuOpen ? [0, 0.25, 0.5, 0.75, 1] : undefined,
                  }}
                />
                {/* Bottom line */}
                <motion.span
                  className="absolute w-5 h-0.5 rounded-full"
                  animate={view === "landing" && !menuOpen ? {
                    rotate: 0,
                    y: 4,
                    backgroundColor: ["#71717a", "#fbbf24", "#f59e0b", "#fbbf24", "#71717a"],
                    boxShadow: [
                      "0 0 0px rgba(245,158,11,0)",
                      "0 0 8px rgba(245,158,11,0.6)",
                      "0 0 12px rgba(245,158,11,0.8)",
                      "0 0 8px rgba(245,158,11,0.6)",
                      "0 0 0px rgba(245,158,11,0)",
                    ],
                  } : {
                    rotate: menuOpen ? -45 : 0,
                    y: menuOpen ? 0 : 4,
                    backgroundColor: isDarkMode ? "#ffffff" : "#18181b",
                    boxShadow: "0 0 0px rgba(245,158,11,0)",
                  }}
                  initial={{ backgroundColor: "#71717a" }}
                  transition={{
                    duration: view === "landing" && !menuOpen ? 1.8 : 0.25,
                    repeat: view === "landing" && !menuOpen ? Infinity : 0,
                    repeatDelay: view === "landing" && !menuOpen ? 3 : 0,
                    ease: view === "landing" && !menuOpen ? "easeInOut" : [0.25, 0.46, 0.45, 0.94],
                    times: view === "landing" && !menuOpen ? [0, 0.25, 0.5, 0.75, 1] : undefined,
                  }}
                />
                {/* Ripple effect on click */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.span
                      className={cn("absolute inset-0 rounded-full", activeTheme.bg)}
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  {/* Menu Items */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                    {/* Menu options */}
                    <div className="flex items-end gap-2 pt-8">
                      {/* Home */}
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1.6, 0.8, 1.15, 0.95, 1],
                          opacity: [0, 1, 1, 1, 1, 1]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.18,
                          times: [0, 0.15, 0.3, 0.5, 0.75, 1],
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        onClick={() => {
                          setView("landing");
                          setMenuOpen(false);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl group relative",
                          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
                          "shadow-lg hover:shadow-xl transition-all",
                          view === "landing" && activeTheme.border
                        )}
                      >
                        {/* Thunder shockwave ring */}
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-xl border-2",
                            activeTheme.border
                          )}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{
                            scale: [0.5, 1.5, 2],
                            opacity: [0, 0.8, 0]
                          }}
                          transition={{ delay: 0.18, duration: 0.4 }}
                        />
                        {/* Electric flash background */}
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-xl",
                            activeTheme.primary
                          )}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.9, 0.4, 0] }}
                          transition={{ delay: 0.18, duration: 0.35 }}
                        />
                        <motion.div
                          whileHover={{ scale: 1.3, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center relative z-10",
                            "transition-all duration-300",
                            "group-hover:shadow-lg group-hover:shadow-current/30",
                            view === "landing" ? activeTheme.bg : "bg-zinc-100 dark:bg-zinc-800",
                            view === "landing" ? activeTheme.text : "text-zinc-500 dark:text-zinc-400",
                            "group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-white dark:group-hover:ring-offset-zinc-900",
                            view === "landing" ? "group-hover:ring-current" : "group-hover:ring-zinc-400 dark:group-hover:ring-zinc-500"
                          )}
                        >
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Home className="w-5 h-5" />
                          </motion.div>
                        </motion.div>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors relative z-10">Home</span>
                      </motion.button>

                      {/* App Integrator */}
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1.6, 0.8, 1.15, 0.95, 1],
                          opacity: [0, 1, 1, 1, 1, 1]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.26,
                          times: [0, 0.15, 0.3, 0.5, 0.75, 1],
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        onClick={() => {
                          setView("app-integrator");
                          setMenuOpen(false);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl group relative",
                          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
                          "shadow-lg hover:shadow-xl transition-all",
                          view === "app-integrator" && activeTheme.border
                        )}
                      >
                        {/* Thunder shockwave ring */}
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-xl border-2",
                            activeTheme.border
                          )}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{
                            scale: [0.5, 1.5, 2],
                            opacity: [0, 0.8, 0]
                          }}
                          transition={{ delay: 0.26, duration: 0.4 }}
                        />
                        {/* Electric flash background */}
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-xl",
                            activeTheme.primary
                          )}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.9, 0.4, 0] }}
                          transition={{ delay: 0.26, duration: 0.35 }}
                        />
                        <motion.div
                          whileHover={{ scale: 1.3, rotate: -5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center relative z-10",
                            "transition-all duration-300",
                            "group-hover:shadow-lg group-hover:shadow-current/30",
                            view === "app-integrator" ? activeTheme.bg : "bg-zinc-100 dark:bg-zinc-800",
                            view === "app-integrator" ? activeTheme.text : "text-zinc-500 dark:text-zinc-400",
                            "group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-white dark:group-hover:ring-offset-zinc-900",
                            view === "app-integrator" ? "group-hover:ring-current" : "group-hover:ring-zinc-400 dark:group-hover:ring-zinc-500"
                          )}
                        >
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Puzzle className="w-5 h-5" />
                          </motion.div>
                        </motion.div>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors relative z-10">App Integrator</span>
                      </motion.button>

                      {/* Debugger */}
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1.6, 0.8, 1.15, 0.95, 1],
                          opacity: [0, 1, 1, 1, 1, 1]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.34,
                          times: [0, 0.15, 0.3, 0.5, 0.75, 1],
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        disabled
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 opacity-60 cursor-not-allowed group relative"
                      >
                        {/* Thunder shockwave ring */}
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-zinc-300 dark:border-zinc-600"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{
                            scale: [0.5, 1.5, 2],
                            opacity: [0, 0.8, 0]
                          }}
                          transition={{ delay: 0.34, duration: 0.4 }}
                        />
                        {/* Electric flash background */}
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-zinc-400 dark:bg-zinc-600"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.9, 0.4, 0] }}
                          transition={{ delay: 0.34, duration: 0.35 }}
                        />
                        <motion.div
                          className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 relative z-10"
                        >
                          <Bug className="w-5 h-5" />
                        </motion.div>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 relative z-10">Debugger</span>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 relative z-10">Coming Soon</span>
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Global Theme Switcher */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50"
          >
            <div className="flex items-center gap-1 sm:gap-1.5 px-1">
              {(Object.keys(APP_THEMES) as AppTheme[]).map((t, index) => (
                <motion.button
                  key={t}
                  onClick={() => {
                    // Animate the theme change with a ripple effect
                    if (document.startViewTransition) {
                      const transition = document.startViewTransition(() => {
                        setTheme(t);
                      });
                      transition.ready.then(() => {
                        document.documentElement.animate(
                          {
                            opacity: [0.95, 1],
                          },
                          {
                            duration: 300,
                            easing: "ease-out",
                          }
                        );
                      });
                    } else {
                      setTheme(t);
                    }
                  }}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-500 relative overflow-hidden shadow-inner border",
                    theme === t
                      ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-600 scale-110 shadow-md"
                      : "opacity-60 hover:opacity-100 border-transparent"
                  )}
                  title={t.charAt(0).toUpperCase() + t.slice(1)}
                >
                  <motion.div
                    className="absolute inset-0 flex"
                    animate={theme === t ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={cn("w-1/2 h-full transition-colors duration-500", APP_THEMES[t].primary)} />
                    <div className={cn("w-1/2 h-full transition-colors duration-500", APP_THEMES[t].secondary)} />
                  </motion.div>
                  {theme === t && (
                    <motion.div
                      layoutId="active-theme-indicator"
                      className="absolute inset-0 rounded-full ring-2 ring-white dark:ring-zinc-900"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Dark Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-1 sm:gap-2 bg-zinc-100/50 dark:bg-zinc-900/50 px-2 sm:px-3 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 cursor-pointer shrink-0"
            onClick={(e) => toggleTheme(e)}
          >
            <motion.div
              animate={isDarkMode ? { scale: 0.8, opacity: 0.5 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="hidden sm:block"
            >
              <Sun className={cn("w-3.5 h-3.5", isDarkMode ? "text-zinc-500" : "text-amber-500")} />
            </motion.div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={() => {}}
              className="data-[state=checked]:bg-indigo-600 pointer-events-none scale-90 sm:scale-100"
            />
            <motion.div
              animate={isDarkMode ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.5 }}
              transition={{ duration: 0.2 }}
              className="hidden sm:block"
            >
              <Moon className={cn("w-3.5 h-3.5", isDarkMode ? "text-indigo-400" : "text-zinc-500")} />
            </motion.div>
          </motion.div>

          <nav className="hidden sm:flex items-center gap-6 border-l border-zinc-200 dark:border-zinc-800 pl-6 h-8">
            <motion.a
              href="https://juspay.io/in/docs/"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 transition-colors relative group"
              whileHover={{ y: -2 }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Docs</span>
              <motion.span
                className="absolute -bottom-1 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300"
              />
            </motion.a>
          </nav>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <LandingPage
                onStart={() => setView("playground")}
                onAIAssistant={() => setView("playground")}
                onAppIntegrator={() => setView("app-integrator")}
                activeTheme={activeTheme}
              />
            </motion.div>
          )}

          {view === "app-integrator" && (
            <motion.div
              key="app-integrator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <AppIntegrator activeTheme={activeTheme} />
            </motion.div>
          )}

          {view === "playground" && (
            <motion.div
              key="playground"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <div className="flex justify-center">
                  <TabsList className={`relative flex items-center justify-center h-auto p-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-xl transition-all duration-500 border border-zinc-200 dark:border-zinc-800 shadow-sm ${suggestedIntegration ? "w-full max-w-md" : "w-full max-w-[240px]"}`}>
                    <TabsTrigger 
                      value="consultant" 
                      className="relative flex-1 px-4 py-2.5 rounded-lg transition-all duration-300 z-10 data-active:!text-white dark:data-active:!text-white data-inactive:text-zinc-950 dark:data-inactive:text-zinc-300 border-none shadow-none bg-transparent data-active:bg-transparent"
                    >
                      <div className="flex items-center justify-center gap-2 relative z-20">
                        <Code2 className="w-4 h-4" />
                        PlayGround AI
                      </div>
                      {activeTab === "consultant" && (
                        <motion.div
                          layoutId="main-active-pill"
                          className={cn(
                            "absolute inset-0 rounded-lg shadow-md z-10",
                            activeTheme.primary
                          )}
                          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                        />
                      )}
                    </TabsTrigger>
                    {suggestedIntegration && (
                      <TabsTrigger 
                        value="playground" 
                        className="relative flex-1 px-4 py-2.5 rounded-lg transition-all duration-300 z-10 data-active:!text-white dark:data-active:!text-white data-inactive:text-zinc-950 dark:data-inactive:text-zinc-300 border-none shadow-none bg-transparent data-active:bg-transparent"
                      >
                        <div className="flex items-center justify-center gap-2 relative z-20">
                          <Terminal className="w-4 h-4" />
                          API Playground
                        </div>
                        {activeTab === "playground" && (
                          <motion.div
                            layoutId="main-active-pill"
                            className={cn(
                              "absolute inset-0 rounded-lg shadow-md z-10",
                              activeTheme.primary
                            )}
                            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                          />
                        )}
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <div className="mt-8">
                  <AnimatePresence mode="wait">
                    <TabsContent value="consultant" key="consultant">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Consultant 
                          activeTheme={activeTheme}
                          requirements={requirements}
                          setRequirements={setRequirements}
                          techStack={techStack}
                          setTechStack={setTechStack}
                          suggestion={suggestion}
                          setSuggestion={setSuggestion}
                          history={history}
                          setHistory={setHistory}
                          activeFlowStep={activeFlowStep}
                          setActiveFlowStep={setActiveFlowStep}
                        />
                      </motion.div>
                    </TabsContent>

                    {suggestedIntegration && (
                      <TabsContent value="playground" key="playground">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Playground 
                            suggestedIntegration={suggestedIntegration} 
                            activeTheme={activeTheme}
                            onResetFilter={() => {
                              setActiveTab("consultant");
                              // Delay clearing suggestion slightly to allow tab animation/switch to start
                              setTimeout(() => {
                                setSuggestion(null);
                              }, 100);
                            }}
                          />
                        </motion.div>
                      </TabsContent>
                    )}
                  </AnimatePresence>
                </div>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}

