import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for Claude AI API
  app.post("/api/ai/suggest", async (req, res) => {
    const { requirements, techStack, history } = req.body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
    }

    const anthropic = new Anthropic({ apiKey });

    const safeReq = (requirements || "").slice(0, 1000);
    const safeStack = (techStack || "").slice(0, 1000);

    const systemPrompt = `
You are PlayGround AI, a Juspay Integration Expert.

User Context:
- Base Requirements: ${safeReq}
- Tech Stack: ${safeStack}

Your goal is to provide a structured integration plan.
If this is a follow-up question, adapt the existing plan or answer the user's specific query within the structured format.
Use the 'consultantNote' field to provide conversational context or direct answers to questions.
Always return the 'sdkName', 'description', 'benefits', and 'integrationSteps' even if they haven't changed much.

Knowledge Base (Juspay Products):
- HyperCheckout Web: All-in-one payment SDK for web (Blended UI, 1-click checkout). Documentation: https://juspay.io/in/docs/hyper-checkout/web/overview/integration-architecture
- HyperCheckout Android: All-in-one payment SDK for Android. Documentation: https://juspay.io/in/docs/hyper-checkout/android/overview/integration-architecture
- HyperCheckout iOS: All-in-one payment SDK for iOS. Documentation: https://juspay.io/in/docs/hyper-checkout/ios/overview/integration-architecture
- Express Checkout: Modular SDK for custom UI (Headless). Use: https://juspay.io/in/docs/ec-headless/android/overview/integration-architecture
- UPI Stack: UPI solution (HyperUPI, Issuing, TPAP).
- Web Integration: Merchant-Only Web Flow (S2S API). Use: https://juspay.io/in/docs/ec-api/docs/overview/integration-architecture
- Other: Payouts, SmartConvert, Mandates, Offers.

Rules:
0. If HyperCheckout is mentioned:
   - For WEB tech stacks (React, Angular, Vue, JavaScript, HTML/CSS): Provide HyperCheckout Web integration steps using the JavaScript SDK
   - For MOBILE tech stacks (Android, iOS, React Native, Flutter): Provide HyperCheckout Mobile SDK integration
   - Provide a 'detailedFlow' array representing the order creation and SDK process (Merchant Website -> Merchant Server -> Juspay Server/SDK)
1. Prioritize HyperCheckout for blended UI/high conversion needs.
2. If tech stack is web-based and user wants HyperCheckout, use HyperCheckout Web SDK NOT S2S API.
3. Only suggest Direct S2S API integration when user explicitly wants a pure server-to-server flow without any SDK.
IMPORTANT: Be concise. Only provide necessary code snippets and benefits.

Respond ONLY with a valid JSON object matching this schema. Do not include any markdown formatting, code blocks, or explanatory text outside the JSON.

Required JSON structure:
{
  "sdkName": "string",
  "description": "string",
  "consultantNote": "string (optional)",
  "benefits": ["string"],
  "detailedFlow": [
    {
      "merchantWebsite": "string (optional)",
      "merchantServer": "string (optional)",
      "juspaySDK": "string (optional)",
      "juspayServer": "string (optional)",
      "note": "string (optional)",
      "isStep": boolean,
      "stepNumber": number
    }
  ],
  "integrationSteps": [
    {
      "title": "string",
      "code": "string",
      "language": "string"
    }
  ],
  "flowSteps": [
    {
      "label": "string",
      "actor": "Merchant" | "Juspay" | "Customer",
      "description": "string"
    }
  ]
}
`;

    try {
      const messages: Anthropic.MessageParam[] = [];

      if (history && history.length > 0) {
        const recentHistory = history.slice(-5);
        for (const msg of recentHistory) {
          messages.push({
            role: msg.role === "model" ? "assistant" : "user",
            content: msg.parts[0].text
          });
        }
      } else {
        messages.push({
          role: "user",
          content: `Provide an initial integration plan based on: ${requirements} and ${techStack}`
        });
      }

      const result = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      });

      let textResponse = "";
      if (result.content && result.content.length > 0) {
        const firstContent = result.content[0];
        if (firstContent.type === "text") {
          textResponse = firstContent.text;
        }
      }

      if (!textResponse) {
        return res.status(500).json({ error: "Empty response from AI" });
      }

      // Strip markdown code blocks if present
      textResponse = textResponse.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

      try {
        const parsed = JSON.parse(textResponse);
        res.json(parsed);
      } catch (parseError) {
        console.error("Failed to parse Claude response as JSON:", textResponse);
        res.status(500).json({ error: "Invalid response format from AI" });
      }
    } catch (error) {
      console.error("Claude API Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Proxy for Juspay API
  app.post("/api/juspay/proxy", async (req, res) => {
    const { method, endpoint, body, apiKey, environment } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: "API Key is required" });
    }

    const baseUrl = environment === "sandbox" ? "https://sandbox.juspay.in" : "https://api.juspay.in";
    const merchantId = (req.headers["x-merchantid"] as string || "").trim();

    console.log(`[Proxy] ${method} ${baseUrl}${endpoint}`);
    console.log(`[Proxy] Merchant ID: ${merchantId}`);
    console.log(`[Proxy] Environment: ${environment}`);
    if (body) {
      console.log(`[Proxy] Body: ${JSON.stringify(body, null, 2)}`);
    }

    try {
      const response = await axios({
        method: method || "POST",
        url: `${baseUrl}${endpoint}`,
        headers: {
          "Authorization": `Basic ${Buffer.from(apiKey.trim() + ":").toString("base64")}`,
          "Content-Type": "application/json",
          "x-merchantid": merchantId,
        },
        data: body,
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Juspay API Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
