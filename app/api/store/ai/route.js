import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { openai } from "@/configs/openai";

async function main(base64Image, mimeType) {
  const messages = [
    {
      role: "system",
      content: `
You are an AI product listing assistant for an e-commerce platform.

Your task is to analyze a product image and generate structured product data
that can be directly used to create a product listing.

IMPORTANT RULES:
- Respond ONLY with raw JSON.
- Do NOT include markdown, code blocks, explanations, or extra text.
- Output must be valid JSON.
- If something is unclear, make the best reasonable assumption.
- Keep product names short and clear.
- Descriptions should be marketing-friendly but concise.

The JSON MUST strictly follow this schema:

{
  "name": string,
  "description": string,
  "category": string,
  "brand": string,
  "color": string,
  "material": string,
  "condition": "New",
  "tags": [string]
}

Make sure the JSON is properly formatted.
Return ONLY the JSON object.
`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze this product image and generate the name + description.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
          },
        },
      ],
    },
  ];

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const response = await openai.chat.completions.create({
    model,
    messages,
  });

  const raw = response.choices[0]?.message?.content || "";

  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error("AI did not return valid JSON");
  }
  return parsed;
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { base64Image, mimeType } = await request.json();

    if (!base64Image || !mimeType) {
      return NextResponse.json(
        { error: "Missing image data for AI analysis" },
        { status: 400 }
      );
    }

    const result = await main(base64Image, mimeType);
    return NextResponse.json({ ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}