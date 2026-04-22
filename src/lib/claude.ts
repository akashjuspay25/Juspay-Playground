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
  try {
    const response = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requirements,
        techStack,
        history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get AI suggestions");
    }

    const data = await response.json();
    return data as SuggestionResponse;
  } catch (error) {
    console.error("Error calling AI API:", error);
    if (error instanceof Error) {
      throw new Error(`AI API Call Failed: ${error.message}`);
    }
    throw new Error("Unknown error during AI API call");
  }
}
