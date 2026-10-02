import { GoogleGenAI, ThinkingLevel } from "@google/genai"

const DEFAULT_MODEL = "gemini-3.5-flash"

export function geminiApiKey() {
  return process.env.GEMINI_API_KEY || ""
}

export async function generateWithGemini(params: {
  system: string
  user: string
  maxOutputTokens: number
  json?: boolean
}): Promise<string> {
  const apiKey = geminiApiKey()
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    contents: params.user,
    config: {
      systemInstruction: params.system,
      maxOutputTokens: params.maxOutputTokens,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      ...(params.json ? { responseMimeType: "application/json" } : {}),
    },
  })

  return response.text?.trim() ?? ""
}
