import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from environment");
    }
    ai = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return ai;
}

export interface SuggestionResponse {
  sdkName: string;
  description: string;
  consultantNote?: string;
  benefits: string[];
  detailedFlow?: {
    merchantWebsite?: string;
    merchantServer?: string;
    juspaySDK?: string;
    juspayServer?: string;
    note?: string;
    isStep?: boolean;
    stepNumber?: number;
  }[];
  integrationSteps: {
    title: string;
    code: string;
    language: string;
  }[];
  flowSteps?: {
    label: string;
    actor: "Merchant" | "Juspay" | "Customer";
    description: string;
  }[];
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function getIntegrationSuggestions(
  requirements: string, 
  techStack: string, 
  history: ChatMessage[] = []
): Promise<SuggestionResponse> {
  const genAI = getAI();
  
  // Slice inputs to prevent excessive token usage
  const safeReq = (requirements || "").slice(0, 1000);
  const safeStack = (techStack || "").slice(0, 1000);

  const systemInstruction = `
    You are PlayGround AI, a Juspay Integration Expert. 
    User Context:
    - Base Requirements: ${safeReq}
    - Tech Stack: ${safeStack}

    Your goal is to provide a structured integration plan. 
    If this is a follow-up question, adapt the existing plan or answer the user's specific query within the structured format. 
    Use the 'consultantNote' field to provide conversational context or direct answers to questions.
    Always return the 'sdkName', 'description', 'benefits', and 'integrationSteps' even if they haven't changed much.

    Knowledge Base (Juspay Products):
    - HyperCheckout: All-in-one payment SDK (Blended UI, 1-click checkout). Use: https://juspay.io/in/docs/hyper-checkout/overview
    - Express Checkout: Modular SDK for custom UI (Headless). Use: https://juspay.io/in/docs/ec-headless/android/overview/integration-architecture
    - UPI Stack: UPI solution (HyperUPI, Issuing, TPAP).
    - Web Integration: Merchant-Only Web Flow (S2S API). Use: https://juspay.io/in/docs/ec-api/docs/overview/integration-architecture
    - Other: Payouts, SmartConvert, Mandates, Offers.

    Rules:
    0. If HyperCheckout is mentioned, provide a 'detailedFlow' array representing the order creation and SDK process. (Merchant Website -> Merchant Server -> Juspay Server/SDK).
    1. Prioritize HyperCheckout for blended UI/high conversion needs.
    2. Web tech stacks MUST use the Direct S2S API integration flow.
    IMPORTANT: Be concise. Only provide necessary code snippets and benefits.
  `;

  const lastMessageText = history.length > 0 ? history[history.length - 1].parts[0].text : `Provide an initial integration plan based on: ${requirements} and ${techStack}`;

  try {
    const contents = history.length > 0 
      ? history.slice(-5).map(msg => ({
          role: msg.role === "model" ? "model" as const : "user" as const,
          parts: msg.parts.map(p => ({ text: p.text }))
        }))
      : [{ role: "user" as const, parts: [{ text: lastMessageText }] }];

    const resultPromise = genAI.models.generateContent({
      model: "gemini-flash-latest",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sdkName: { type: Type.STRING },
            description: { type: Type.STRING },
            consultantNote: { type: Type.STRING },
            benefits: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            detailedFlow: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  merchantWebsite: { type: Type.STRING },
                  merchantServer: { type: Type.STRING },
                  juspaySDK: { type: Type.STRING },
                  juspayServer: { type: Type.STRING },
                  note: { type: Type.STRING },
                  isStep: { type: Type.BOOLEAN },
                  stepNumber: { type: Type.NUMBER }
                }
              }
            },
            integrationSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  code: { type: Type.STRING },
                  language: { type: Type.STRING }
                },
                required: ["title", "code", "language"]
              }
            },
            flowSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  actor: { 
                    type: Type.STRING
                  },
                  description: { type: Type.STRING }
                },
                required: ["label", "actor", "description"]
              }
            }
          },
          required: ["sdkName", "description", "benefits", "integrationSteps"]
        }
      } as any
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request timed out after 90s")), 90000)
    );

    const result = await Promise.race([resultPromise, timeoutPromise]) as any;

    let textResponse = "";
    if (result.text) {
      textResponse = result.text;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      textResponse = result.candidates[0].content.parts[0].text;
    }
    
    if (!textResponse) {
      console.error("Gemini returned empty response text", result);
      throw new Error("Empty response from AI (likely safety filter or thinking limit)");
    }

    // Strip markdown code blocks if present
    textResponse = textResponse.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

    try {
      return JSON.parse(textResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", textResponse);
      throw new Error("Invalid response format from AI (JSON parse failed)");
    }
  } catch (error) {
    console.error("Detailed Gemini API Error:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Call Failed: ${error.message}`);
    }
    throw new Error("Unknown error during Gemini API call");
  }
}


