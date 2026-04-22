import { useState, useRef, useEffect, Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, CheckCircle2, Copy, Loader2, ArrowRight, Code2, GitMerge, User, Building, ShieldCheck, Send, MessageSquare, Rocket, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIntegrationSuggestions, SuggestionResponse, ChatMessage } from "@/src/lib/claude";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "motion/react";

import { ThemeColors } from "@/src/App";

export function Consultant({ 
  activeTheme,
  requirements,
  setRequirements,
  techStack,
  setTechStack,
  suggestion,
  setSuggestion,
  history,
  setHistory,
  activeFlowStep,
  setActiveFlowStep
}: { 
  activeTheme: ThemeColors,
  requirements: string,
  setRequirements: Dispatch<SetStateAction<string>>,
  techStack: string,
  setTechStack: Dispatch<SetStateAction<string>>,
  suggestion: SuggestionResponse | null,
  setSuggestion: Dispatch<SetStateAction<SuggestionResponse | null>>,
  history: ChatMessage[],
  setHistory: Dispatch<SetStateAction<ChatMessage[]>>,
  activeFlowStep: number,
  setActiveFlowStep: Dispatch<SetStateAction<number>>
}) {
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSimulatingFlow, setIsSimulatingFlow] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  // Handle flow simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulatingFlow && suggestion?.flowSteps) {
      if (activeFlowStep < suggestion.flowSteps.length - 1) {
        timer = setTimeout(() => {
          setActiveFlowStep(prev => prev + 1);
        }, 1500);
      } else {
        timer = setTimeout(() => {
          setIsSimulatingFlow(false);
        }, 2000);
      }
    }
    return () => clearTimeout(timer);
  }, [isSimulatingFlow, activeFlowStep, suggestion]);

  const startFlowSimulation = () => {
    if (!suggestion?.flowSteps || suggestion.flowSteps.length === 0) {
      toast.error("Interactive flow data is not available for this suggestion.");
      return;
    }
    setActiveFlowStep(0);
    setIsSimulatingFlow(true);
  };

  const handleConsult = async (followUpText?: string) => {
    const isInitial = !followUpText && history.length === 0;
    
    if (isInitial && (!requirements || !techStack)) {
      toast.error("Please fill in both requirements and tech stack.");
      return;
    }

    const userText = followUpText || `Analyze for requirements: ${requirements} with stack: ${techStack}`;
    const newHistory: ChatMessage[] = [...history, { role: "user", parts: [{ text: userText }] }];
    
    setHistory(newHistory);
    setLoading(true);
    setChatInput("");

    try {
      const res = await getIntegrationSuggestions(requirements, techStack, newHistory);
      
      if (!res) {
        throw new Error("No response from AI agent");
      }

      // Sanitize response to prevent crashes from missing fields
      const sanitizedRes: SuggestionResponse = {
        sdkName: res.sdkName || "Juspay SDK",
        description: res.description || "Consultation generated based on your requirements.",
        consultantNote: res.consultantNote,
        benefits: Array.isArray(res.benefits) ? res.benefits : [],
        integrationSteps: Array.isArray(res.integrationSteps) ? res.integrationSteps : [],
        detailedFlow: Array.isArray(res.detailedFlow) ? res.detailedFlow : undefined,
        flowSteps: Array.isArray(res.flowSteps) ? res.flowSteps : undefined
      };

      const sdkName = sanitizedRes.sdkName.toLowerCase();
      const description = sanitizedRes.description.toLowerCase();

      // FAIL-SAFE: If HyperCheckout is suggested but flow is missing, inject it manually
      if (sdkName.includes("hypercheckout") || description.includes("hypercheckout")) {
        if (!sanitizedRes.detailedFlow || sanitizedRes.detailedFlow.length === 0) {
          sanitizedRes.detailedFlow = [
            { stepNumber: 1, isStep: true, merchantWebsite: "Calls 'Initiate' Payments Page SDK API", note: "Initiate is a fire & forget asynchronous call. It does not affect loading time of the website. Make sure to call initiate where Hypercheckout page is going to be shown.", juspaySDK: "SDK Initiated" },
            { merchantWebsite: "The website forwards the order related details to the Merchant Server" },
            { stepNumber: 2, isStep: true, merchantServer: "Calls 'Session API' with related parameters", juspayServer: "Order Created" },
            { juspayServer: "Responds with sdk_payload", merchantServer: "Fetches the sdk_payload from the response and forwards it to the merchant website" },
            { stepNumber: 3, isStep: true, merchantWebsite: "Calls 'Process' Payments Page SDK API", juspaySDK: "Displays Hypercheckout Screen (Hypercheckout SDK communicates with Juspay Server to perform different operations which aids users payment journey.)" },
            { juspayServer: "Transaction Creation, Displaying Payment Methods, Linking Cards / Wallets, Offers Discovery / Application, Unlinking Cards / Wallets" },
            { juspaySDK: "After payment completion, the SDK forwards the Process Response to the Merchant website", merchantWebsite: "Calls Merchant Server to fetch order status via S2S Call" },
            { stepNumber: 4, isStep: true, merchantServer: "Calls the 'Order Status API' to check order status", juspayServer: "Request Received" },
            { juspayServer: "Responds with Order Status", merchantServer: "Forwards the Order Status response to the Merchant website" },
            { stepNumber: 5, isStep: true, merchantWebsite: "Finally the Merchant website displays the order status to the user" }
          ];
        }
      }

      setSuggestion(sanitizedRes);
      setHistory([...newHistory, { role: "model", parts: [{ text: sanitizedRes.consultantNote || sanitizedRes.description }] }]);
      
      if (isInitial) {
        toast.success("AI Consultant has analyzed your requirements!");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Undefined error";
      toast.error(`Failed to get suggestions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;
    handleConsult(chatInput);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code snippet copied to clipboard!");
  };

  const getActorIcon = (actor: string) => {
    switch (actor) {
      case "Customer": return <User className="w-4 h-4" />;
      case "Merchant": return <Building className="w-4 h-4" />;
      case "Juspay": return <ShieldCheck className="w-4 h-4" />;
      default: return <GitMerge className="w-4 h-4" />;
    }
  };

  const getActorColor = (actor: string) => {
    switch (actor) {
      case "Customer": return "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50";
      case "Merchant": return "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50";
      case "Juspay": return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      default: return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Interaction Panel */}
      <div className="lg:col-span-4 lg:sticky lg:top-28 h-[500px] sm:h-[600px] lg:h-[calc(100vh-260px)] flex flex-col">
        <Card className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl flex flex-col h-full overflow-hidden card-glow">
          <CardHeader className="bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-zinc-900/80 dark:to-transparent border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={!loading && history.length === 0 ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  activeTheme.bg,
                  activeTheme.text
                )}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </motion.div>
              <div>
                <CardTitle className={`text-lg ${history.length === 0 ? activeTheme.text : "text-zinc-900 dark:text-white"}`}>
                  {history.length > 0 ? "Integration Session" : "PlayGround AI"}
                </CardTitle>
                <CardDescription className={history.length === 0 ? `${activeTheme.text} opacity-80 text-xs` : "text-zinc-500 dark:text-zinc-400 text-xs"}>
                  {history.length > 0 ? "Discuss your integration requirements." : "Start by sharing what you're building."}
                </CardDescription>
              </div>
            </motion.div>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
            {history.length === 0 ? (
              <motion.div 
                className="p-6 pb-0 space-y-6 overflow-y-auto"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-zinc-700 dark:text-zinc-300">Product Requirements</Label>
                  <Textarea
                    id="requirements"
                    placeholder="e.g., I need HyperCheckout for my Android app. I want a blended UI experience."
                    className={`min-h-[120px] resize-none ${activeTheme.ring} border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600`}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="techStack" className="text-zinc-700 dark:text-zinc-300">Tech Stack</Label>
                  <Input
                    id="techStack"
                    placeholder="e.g. Web, Android, React Native, Cordova"
                    className={`${activeTheme.ring} border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600`}
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                  />
                </div>

                <AnimatePresence>
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 48, marginBottom: 24 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="relative flex items-center bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 overflow-hidden"
                    >
                      <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: "110%", opacity: 1 }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5, 
                          ease: "linear" 
                        }}
                        className="flex items-center gap-3"
                      >
                        <div className={`h-[2px] w-24 bg-gradient-to-r from-transparent via-${activeTheme.accent}-500/50 to-${activeTheme.accent}-500 rounded-full blur-[1px]`} />
                        <Rocket className={`w-6 h-6 ${activeTheme.text} rotate-90 fill-current opacity-80`} />
                      </motion.div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 animate-pulse">Analyzing Requirements</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div 
                  className="ai-button-container" 
                  style={{ "--theme-primary": `var(--color-${activeTheme.accent}-600)` } as React.CSSProperties}
                >
                  <div className="ai-button-wrapper">
                    <input 
                      type="checkbox" 
                      id="ai-suggestion-toggle" 
                      className="ai-checkbox"
                      checked={loading}
                      readOnly
                    />
                    <label 
                      htmlFor="ai-suggestion-toggle" 
                      className="ai-button-inner"
                      onClick={() => !loading && handleConsult()}
                    >
                      <span className="t">
                        {loading ? "Ignition Start..." : "Get AI Suggestion"}
                      </span>
                      <i className="l"><Rocket className="w-6 h-6" /></i>
                      
                      {/* Animation Spots */}
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="button_spots" />
                      ))}
                    </label>
                    <div className="ai-tick">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-6">
                  {history.filter((msg, idx) => {
                    if (msg.role === 'user' && msg.parts?.[0]?.text?.startsWith('Analyze for requirements')) {
                      // Only show the "Refining" message if there's no model response yet for this specific prompt
                      const hasNextModelResponse = history.slice(idx + 1).some(m => m.role === 'model');
                      return !hasNextModelResponse;
                    }
                    return true;
                  }).map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user' 
                        ? `${activeTheme.primary} text-white shadow-sm` 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm'
                      }`}>
                        {msg.parts?.[0]?.text?.startsWith('Analyze for requirements') ? 'Refining solution...' : (msg.parts?.[0]?.text || "")}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-zinc-200 dark:border-zinc-700">
                      <Loader2 className="w-3 h-3 animate-spin text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Assistant is thinking...</span>
                    </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </CardContent>

          {history.length > 0 && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input 
                  placeholder="Ask me Anything ..."
                  className={`flex-1 ${activeTheme.ring} border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={loading}
                />
                <motion.div 
                  className={`${activeTheme.primary} hover:opacity-90 shrink-0 rounded-md`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button type="submit" size="icon" variant="ghost" className="text-white hover:bg-transparent" disabled={loading || !chatInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </motion.div>
              </form>
            </div>
          )}
        </Card>
      </div>

      {/* Suggestion Section */}
      <div className="lg:col-span-8 space-y-6">
        {suggestion ? (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-2xl relative overflow-hidden card-glow">
                {/* Animated background gradient */}
                <motion.div
                  className={cn("absolute top-0 right-0 w-64 h-64 opacity-20 blur-3xl", activeTheme.primary)}
                  animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 20, 0],
                    y: [0, -20, 0],
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-zinc-50/80 to-transparent dark:from-zinc-900/80 dark:to-transparent rounded-bl-full -mr-10 -mt-10" />

                <CardHeader className="pb-4 relative z-10 border-b border-zinc-100 dark:border-zinc-800">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-3"
                  >
                    <Badge variant="outline" className={`${activeTheme.text} ${activeTheme.border} ${activeTheme.bg} px-3 py-1 border-opacity-30`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Recommended Integration
                    </Badge>
                    <motion.div
                      className="flex -space-x-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {suggestion.benefits.slice(0, 3).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                          className={`w-7 h-7 rounded-full ${activeTheme.primary} border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-lg`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      {suggestion.sdkName}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400 mt-3">
                      {suggestion.description}
                    </CardDescription>
                  </motion.div>
                </CardHeader>
              <CardContent className="space-y-8 p-6 relative z-10">
                <div className="flex flex-wrap gap-2">
                  {suggestion.benefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Badge variant="secondary" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <CheckCircle2 className="w-3 h-3 mr-1.5 text-blue-600" />
                        {benefit}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                <Tabs defaultValue="guide" className="w-full">
                  <TabsList className={`grid w-full mb-6 p-1 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-inner ${suggestion.detailedFlow ? "grid-cols-3" : "grid-cols-2"}`}>
                    <TabsTrigger value="guide" className="rounded-lg data-active:bg-white dark:data-active:bg-zinc-800 data-active:text-zinc-900 dark:data-active:text-white shadow-none data-active:shadow-sm">Integration Guide</TabsTrigger>
                    {suggestion.detailedFlow && (
                      <TabsTrigger value="diagram" className="rounded-lg data-active:bg-white dark:data-active:bg-zinc-800 data-active:text-zinc-900 dark:data-active:text-white shadow-none data-active:shadow-sm">General Flow</TabsTrigger>
                    )}
                    <TabsTrigger value="flow" className="rounded-lg data-active:bg-white dark:data-active:bg-zinc-800 data-active:text-zinc-900 dark:data-active:text-white shadow-none data-active:shadow-sm">Interactive Flow</TabsTrigger>
                  </TabsList>

                  {suggestion.detailedFlow && (
                    <TabsContent value="diagram" className="space-y-6">
                      <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                              <GitMerge className="w-4 h-4 text-purple-500" />
                              Detailed Integration Sequence
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                              <thead>
                                <tr className="bg-zinc-50/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
                                  <th className="p-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-16">Step</th>
                                  <th className="p-3 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Merchant Website</th>
                                  <th className="p-3 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Merchant Server</th>
                                  <th className="p-3 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Juspay SDK</th>
                                  <th className="p-3 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Juspay Server</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {suggestion.detailedFlow.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                    <td className="p-3 align-top">
                                      {row.isStep && (
                                        <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] font-mono shadow-sm">
                                          {row.stepNumber}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="p-3 align-top max-w-[200px]">
                                      {row.merchantWebsite && (
                                        <div className="space-y-1.5">
                                          <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-normal">{row.merchantWebsite}</div>
                                          {row.note && (
                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/50 p-2 rounded border border-zinc-100 dark:border-zinc-800/50">
                                              {row.note}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 align-top max-w-[200px]">
                                      {row.merchantServer && <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-normal">{row.merchantServer}</div>}
                                    </td>
                                    <td className="p-3 align-top max-w-[200px]">
                                      {row.juspaySDK && <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-normal">{row.juspaySDK}</div>}
                                    </td>
                                    <td className="p-3 align-top max-w-[200px]">
                                      {row.juspayServer && <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal font-mono bg-zinc-50 dark:bg-zinc-950 p-1 px-1.5 rounded w-fit border border-zinc-100 dark:border-zinc-800">{row.juspayServer}</div>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 text-center uppercase tracking-widest">
                            End of Lifecycle Flow
                          </div>
                        </div>
                    </TabsContent>
                  )}

                  <TabsContent value="guide" className="space-y-4">
                    <Accordion className="w-full">
                      {suggestion.integrationSteps.map((step, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-zinc-200 dark:border-zinc-800">
                          <AccordionTrigger className="hover:no-underline py-4 text-zinc-700 dark:text-zinc-300 font-semibold group hover:text-zinc-900 dark:hover:text-white">
                            <span className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-500 dark:text-zinc-400 group-data-[state=active]:bg-blue-600 group-data-[state=active]:text-white transition-colors">
                                {index + 1}
                              </span>
                              {step.title}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 mt-2 shadow-sm">
                              <div className="absolute right-4 top-4 z-20 flex gap-2">
                                <Badge variant="outline" className="bg-white/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 backdrop-blur-sm shadow-sm">
                                  {step.language}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                  onClick={() => copyToClipboard(step.code)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <SyntaxHighlighter
                                language={step.language}
                                style={vscDarkPlus}
                                customStyle={{
                                  margin: 0,
                                  padding: '1.5rem',
                                  paddingTop: '3.5rem',
                                  fontSize: '0.875rem',
                                  lineHeight: '1.6',
                                  borderRadius: '0.75rem',
                                  background: '#1e293b'
                                }}
                              >
                                {step.code}
                              </SyntaxHighlighter>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>

                  <TabsContent value="flow" className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <Badge className={`${activeTheme.primary} font-bold px-4`}>Interactive</Badge>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Click to visualize the sequence</span>
                      </div>
                      <motion.div
                        className={`${activeTheme.primary} hover:opacity-90 text-white h-8 rounded-lg transition-all shadow-sm flex items-center justify-center`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-full gap-2 text-white hover:bg-transparent hover:text-white font-bold"
                          onClick={startFlowSimulation}
                          disabled={isSimulatingFlow}
                        >
                          {isSimulatingFlow ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Simulating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              Simulate Flow
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>

                    <div className="relative pl-8 space-y-8 py-4 before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800 before:dashed">
                      <AnimatePresence mode="popLayout">
                        {suggestion.flowSteps?.map((step, index) => {
                          const isActive = activeFlowStep === index;
                          const isCompleted = activeFlowStep > index;
                          const isUpcoming = activeFlowStep !== -1 && activeFlowStep < index;

                          return (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ 
                                opacity: isUpcoming ? 0.3 : 1, 
                                x: 0,
                                scale: isActive ? 1.02 : 1,
                              }}
                              transition={{ 
                                duration: 0.4,
                                ease: "easeOut" 
                              }}
                              className={`relative transition-all duration-500 ${
                                isActive ? "z-20 scale-[1.02]" : "z-10"
                              }`}
                            >
                              <motion.div 
                                className={`absolute -left-[31px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center z-10 transition-all duration-500 ${
                                  isActive 
                                  ? "ring-4 ring-blue-500/10 scale-110 shadow-lg " + getActorColor(step.actor).replace("bg-", "bg-")
                                  : isCompleted 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : getActorColor(step.actor).replace("bg-", "bg-")
                                }`}
                                animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                              >
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : getActorIcon(step.actor)}
                              </motion.div>
                              <div className={`bg-white dark:bg-zinc-900 border transition-all duration-500 rounded-2xl p-5 shadow-sm group ${
                                isActive 
                                ? "border-blue-500 shadow-blue-500/10 dark:shadow-blue-500/5 shadow-xl ring-1 ring-blue-500/10" 
                                : isCompleted
                                  ? "border-zinc-200 dark:border-zinc-800 opacity-60"
                                  : "border-zinc-200 dark:border-zinc-800"
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className={`font-bold tracking-tight transition-colors ${isActive ? "text-blue-600" : "text-zinc-900 dark:text-white"}`}>
                                    {step.label}
                                  </h4>
                                  <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${getActorColor(step.actor).replace("bg-", "bg-")} ${isCompleted ? "opacity-50" : ""}`}>
                                    {isActive ? "Executing..." : step.actor}
                                  </Badge>
                                </div>
                                <p className={`text-sm leading-relaxed transition-colors ${isActive ? "text-zinc-700 dark:text-zinc-300 font-medium" : "text-zinc-500 dark:text-zinc-400 font-medium"}`}>
                                  {step.description}
                                </p>
                                
                                {isActive && (
                                  <motion.div 
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 1.5, ease: "linear" }}
                                    className="h-0.5 bg-blue-400 mt-4 rounded-full origin-left"
                                  />
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50 shadow-sm relative overflow-hidden"
          >
            {/* Animated background decoration */}
            <motion.div
              className={cn("absolute top-10 right-10 w-32 h-32 opacity-10 blur-3xl rounded-full", activeTheme.primary)}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-10 left-10 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 relative",
                activeTheme.bg,
                activeTheme.text
              )}
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Brain className="w-10 h-10" />
              </motion.div>
              {/* Pulse rings */}
              <motion.div
                className={cn("absolute inset-0 rounded-3xl", activeTheme.primary)}
                animate={{
                  scale: [1, 1.3, 1.5],
                  opacity: [0.3, 0.1, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-zinc-900 dark:text-white"
            >
              AI Integration Architect
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-3 leading-relaxed"
            >
              Share your business requirements and tech stack to generate a technical implementation blueprint.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex gap-3"
            >
              {["Secure", "Real-time", "Scalable"].map((tag, i) => (
                <motion.div
                  key={tag}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      "px-4 py-1.5 border font-medium",
                      i === 0 && "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
                      i === 1 && "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
                      i === 2 && "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400",
                    )}
                  >
                    <Zap className="w-3 h-3 mr-1.5" />
                    {tag}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}




