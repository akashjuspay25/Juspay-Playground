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
  const PORT = process.env.PORT || 3000;

  // Global JSON parser - before any other middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // DEBUG: Log all incoming requests to /api
  app.use('/api/*', (req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.path}`);
    console.log(`[DEBUG] Content-Type:`, req.headers['content-type']);
    console.log(`[DEBUG] Has body:`, !!req.body);
    next();
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

  // Dedicated endpoint for creating Juspay Session (HyperCheckout)
  app.post("/api/juspay/session", async (req, res) => {
    console.log("[Session] Received request");
    console.log("[Session] Content-Type:", req.headers["content-type"]);
    console.log("[Session] Body:", JSON.stringify(req.body));

    const { merchantId, apiKey, clientId, environment, amount, customerEmail, customerPhone, customerId, firstName, lastName, description, returnUrl } = req.body;

    if (!apiKey || !merchantId) {
      console.log("[Session] Missing credentials");
      return res.status(400).json({ error: "API Key and Merchant ID are required" });
    }

    const baseUrl = environment === "sandbox" ? "https://sandbox.juspay.in" : "https://api.juspay.in";
    // Generate unique order ID every time
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`[Session] Creating order ${orderId} for merchant ${merchantId}`);
    console.log(`[Session] Forwarding to: ${baseUrl}/session`);

    // Encode API key with trailing colon for Basic auth
    const encodedAuth = Buffer.from(apiKey.trim() + ":").toString("base64");

    // Build form-encoded request body (Juspay Session API expects form data)
    const formData = new URLSearchParams();
    formData.append("order_id", orderId);
    formData.append("amount", amount || "1.0");
    formData.append("customer_id", customerId || `cust_${Date.now()}`);
    formData.append("customer_email", customerEmail || "test@example.com");
    formData.append("customer_phone", customerPhone || "9876543210");
    formData.append("payment_page_client_id", clientId || merchantId);
    formData.append("action", "paymentPage");
    formData.append("service", "in.juspay.ec");
    formData.append("return_url", returnUrl || "https://shop.merchant.com");
    formData.append("description", description || "Complete your payment");

    console.log(`[Session] JUSPAY REQUEST: ${baseUrl}/session`);
    console.log(`[Session] Headers:`, {
      "x-merchantid": merchantId,
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${encodedAuth.substring(0, 30)}...`
    });
    console.log(`[Session] Form data:`, formData.toString());

    try {
      const response = await axios({
        method: "POST",
        url: `${baseUrl}/session`,
        headers: {
          "x-merchantid": merchantId,
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${encodedAuth}`,
        },
        data: formData.toString(),
      });

      console.log(`[Session] RESPONSE STATUS: ${response.status}`);
      console.log(`[Session] ORDER ID FROM JUSPAY:`, response.data.order_id || response.data.id);
      console.log(`[Session] RESPONSE BODY:`, JSON.stringify(response.data, null, 2));

      res.json({
        success: true,
        orderId: orderId,
        ...response.data,
      });
    } catch (error: any) {
      console.error("[Session] ERROR STATUS:", error.response?.status);
      console.error("[Session] ERROR BODY:", error.response?.data);
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.error_message || error.message,
        details: error.response?.data,
      });
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

    // IMPORTANT: Mount API routes BEFORE Vite middleware
    // to ensure they are handled by Express, not Vite
    app.use('/api', (req, res, next) => {
      // Skip Vite for /api routes
      next('route');
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
