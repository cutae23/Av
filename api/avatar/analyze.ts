import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini SDK
// Note: Vercel serverless environment will load this key from Project Environment Variables
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please add GEMINI_API_KEY to your Vercel Project Environment Variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export default async function handler(req: any, res: any) {
  // Only allow POST request
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing image in request body." });
    }

    const cleanMimeType = mimeType || "image/jpeg";
    const imagePart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: image,
      },
    };

    const textPart = {
      text: "Analyze the uploaded face photo. Identify the person's features and translate them into custom, highly stylized 3D avatar parameters. Your translation must be friendly, stylish, and suitable for a cute modular 3D chibi-style mini-figure character. Choose aesthetic, coordinate colors for their hair, skin, and clothing to look like a premium 3D design piece.",
    };

    const configParameters = {
      responseMimeType: "application/json",
      systemInstruction: "You are an expert 3D character artist and character design analysis engine. Based on the uploaded face image, you identify personal physical features and extract parameters for a modular 3D character puppet. Always return accurate colors (Hex formats like '#4a3224') and categorizations that faithfully represent the visual inputs.",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          gender: {
            type: Type.STRING,
            description: "Represented/stylized gender presentation. Must be 'male', 'female', or 'neutral'.",
          },
          hairStyle: {
            type: Type.STRING,
            description: "Hair type or style. Must be one of: 'short', 'long', 'curly', 'bob', 'ponytail', 'bald', 'spiky', 'afro'.",
          },
          hairColor: {
            type: Type.STRING,
            description: "Hex color code for the hair (e.g. '#614126' or vibrant ones).",
          },
          skinColor: {
            type: Type.STRING,
            description: "Hex color code for the skin tone (e.g. '#fedcba', '#e0ac69'). Make sure it is realistic/aesthetically appealing in 3D.",
          },
          eyeColor: {
            type: Type.STRING,
            description: "Hex color code representing the eye's iris color (e.g. '#2b446a', '#342312').",
          },
          expression: {
            type: Type.STRING,
            description: "Primary detected expression. Must be one of: 'happy', 'neutral', 'wink', 'cool', 'surprised'.",
          },
          glasses: {
            type: Type.STRING,
            description: "Glasses style. Must be one of: 'none', 'classic' (wired/thick), 'round', 'sunglasses', 'cyber' (neon-futuristic visor).",
          },
          clothingType: {
            type: Type.STRING,
            description: "Clothing tier. Must be one of: 'shirt', 'hoodie', 'suit', 'sweater'.",
          },
          clothingColor: {
            type: Type.STRING,
            description: "Hex color code for the upper garment.",
          },
          hat: {
            type: Type.STRING,
            description: "Wearable hat. Must be one of: 'none', 'cap', 'beanie', 'crown', 'headband'.",
          },
          facialHair: {
            type: Type.STRING,
            description: "Type of facial hair. Must be one of: 'none', 'beard', 'mustache', 'stubble'.",
          },
          facialHairColor: {
            type: Type.STRING,
            description: "Hex color code for the facial hair if present (defaults to hair color or darker).",
          },
          summaryText: {
            type: Type.STRING,
            description: "A warm, positive 1-2 sentence summary explaining custom traits detected and the design styling choices made.",
          },
        },
        required: [
          "gender",
          "hairStyle",
          "hairColor",
          "skinColor",
          "eyeColor",
          "expression",
          "glasses",
          "clothingType",
          "clothingColor",
          "hat",
          "facialHair",
          "facialHairColor",
          "summaryText",
        ],
      },
    };

    const ai = getAiClient();
    let response;
    try {
      // Try gemini-3.5-flash as default modal
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: configParameters,
      });
    } catch (firstError: any) {
      console.warn("Primary model gemini-3.5-flash failed or was rate limited. Retrying with gemini-3.1-flash-lite as safe fallback...", firstError?.message || firstError);
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: { parts: [imagePart, textPart] },
          config: configParameters,
        });
      } catch (fallbackError: any) {
        throw firstError;
      }
    }

    const parsedData = JSON.parse(response.text || "{}");
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/avatar/analyze:", error);
    const errorMsg = error?.message || String(error);
    const isQuotaExceeded = error?.status === 429 || 
                            errorMsg.toLowerCase().includes("quota") || 
                            errorMsg.toLowerCase().includes("resource_exhausted") ||
                            errorMsg.toLowerCase().includes("limit exceeded") ||
                            errorMsg.toLowerCase().includes("rate limit");

    if (isQuotaExceeded) {
      return res.status(429).json({
        error: "Gemini API 무료 한도(Quota)가 일시적으로 가득 찼습니다. 3~5초만 대기하셨다가 'Extract & Generate' 버튼을 다시 클릭해 주시면 정상 가동됩니다.",
        details: errorMsg,
      });
    } else {
      return res.status(500).json({
        error: `얼굴 분석 중 에러가 발생했습니다: ${errorMsg}`,
        details: errorMsg,
      });
    }
  }
}
