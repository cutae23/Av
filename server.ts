import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit to support base64 image uploads safely
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize Gemini SDK with custom User-Agent for AI Studio Build telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Primary API route for face analysis
app.post("/api/avatar/analyze", async (req, res) => {
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

    let response;
    try {
      // Try gemini-3.5-flash as the primary recommended multimodal model
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: configParameters,
      });
    } catch (firstError: any) {
      console.warn("Primary model gemini-3.5-flash failed or was rate limited. Retrying with gemini-3.1-flash-lite as safe fallback...", firstError?.message || firstError);
      try {
        // Fallback to gemini-3.1-flash-lite which shares a separate daily quota limit
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: { parts: [imagePart, textPart] },
          config: configParameters,
        });
        console.log("Automatic fallback to gemini-3.1-flash-lite succeeded!");
      } catch (fallbackError: any) {
        console.error("Both primary and fallback models failed.");
        throw firstError; // Throw the original rate-limit/quota error which is more helpful
      }
    }

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/avatar/analyze:", error);
    const errorMsg = error?.message || String(error);
    const isQuotaExceeded = error?.status === 429 || 
                            errorMsg.toLowerCase().includes("quota") || 
                            errorMsg.toLowerCase().includes("resource_exhausted") ||
                            errorMsg.toLowerCase().includes("limit exceeded") ||
                            errorMsg.toLowerCase().includes("rate limit");

    if (isQuotaExceeded) {
      res.status(429).json({
        error: "Gemini API 무료 한도(Quota)가 일시적으로 가득 찼습니다. 3~5초만 대기하셨다가 'Extract & Generate' 버튼을 다시 클릭해 주시면 정상 가동됩니다. (The free tier is limited to 20 calls/day or 15 calls/min. Retrying in a few seconds will solve this.)",
        details: errorMsg,
      });
    } else {
      res.status(500).json({
        error: `얼굴 분석 중 서버 에러가 발생했습니다: ${errorMsg}. 사진 화질을 확인하거나 잠시 후 다시 시도해주세요.`,
        details: errorMsg,
      });
    }
  }
});

// Setup development server (Vite) vs production static serving
async function startServer() {
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
    console.log(`AI 3D Avatar Server running on port ${PORT}`);
  });
}

startServer();
