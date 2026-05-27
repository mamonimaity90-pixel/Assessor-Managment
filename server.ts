/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy initializer for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please configure it in your Secrets / Settings menu.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST Api health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Gemini AI Assistant query endpoint
app.post("/api/gemini/query", async (req, res) => {
  try {
    const { question, assessors } = req.body;

    if (!question) {
      res.status(400).json({ error: "Context or question is missing." });
      return;
    }

    const ai = getGeminiClient();

    // Map the database down slightly to reduce token clutter while retaining all core details
    const simplifiedData = (assessors || []).map((a: any) => ({
      ID: a.assessorId,
      Name: a.name,
      Email: a.email,
      Phone: a.contactNumber,
      Location: `${a.city}, ${a.state}`,
      Designation: a.designation,
      Status: a.status,
      ActivePrograms: (a.programs || []).map((p: any) => `${p.scheme}:${p.program} (${p.capacity})`),
      Qualifications: a.qualification,
      EmpanelmentYear: a.empaneledYear,
      BanReason: a.banReason || "",
      CoursesAttended: (a.courses || []).map((c: any) => `${c.courseName} (${c.date})`).join(", ")
    }));

    const systemPrompt = `You are the NABH Assessor Registry AI Assistant, an elite healthcare quality consultant specialized in managing and analyzing the National Accreditation Board for Hospitals & Healthcare Providers (NABH) assessor registry.

The user is an administrator of the registry. Below is the serialized current database of registered assessors (containing their IDs, Names, Locations, Active Programs with Schemes and assessment capacities, Empanelment details, Statuses, Restrictions, and Courses attended).

Analyze this roster and answer the administrator's inquiry with professional precision. 
Guidelines:
1. Directly ground your response in the provided JSON data. If no matches exist for a state, course, or program, state that clearly rather than hallucinating records.
2. Structure your response cleanly using Markdown lists, bold key terms, or small tables where useful.
3. Be helpful, professional, and clear. Avoid listing raw JSON structures in answers. Speak directly with concrete numbers or names.
4. Keep the output focused, answering precisely what was asked.

Assessor Roster Data:
${JSON.stringify(simplifiedData, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Keep temperature low to prevent hallucination of assessor details
      }
    });

    const text = response.text || "No analysis could be completed.";
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini query failed:", error);
    res.status(500).json({ 
      error: error.message || "An internal error occurred during processing."
    });
  }
});

async function main() {
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
    console.log(`NABH Registry Master server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});
