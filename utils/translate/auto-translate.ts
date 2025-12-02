/**
 * Automatic translation utility using OpenAI
 */

import { openai } from "@/utils/openai/client";

export async function translateText(
  text: string,
  targetLanguage: "en" | "es",
): Promise<string> {
  if (!text || !openai) return text;

  try {
    const systemPrompt =
      targetLanguage === "en"
        ? "You are a translator. Translate the following text from Spanish to English. Return ONLY the translation, nothing else."
        : "You are a translator. Translate the following text from English to Spanish. Return ONLY the translation, nothing else.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}

export async function translateJobContent(
  job: {
    title: string;
    description: string;
    location?: string | null;
    payRate?: string | null;
    requirements?: string | null;
  },
  targetLanguage: "en" | "es",
) {
  if (!openai) return job; // Return original if OpenAI not configured

  try {
    const [title, description, location, payRate, requirements] =
      await Promise.all([
        translateText(job.title, targetLanguage),
        translateText(job.description, targetLanguage),
        job.location ? translateText(job.location, targetLanguage) : null,
        job.payRate ? translateText(job.payRate, targetLanguage) : null,
        job.requirements
          ? translateText(job.requirements, targetLanguage)
          : null,
      ]);

    return {
      ...job,
      title,
      description,
      location,
      payRate,
      requirements,
    };
  } catch (error) {
    console.error("Job translation error:", error);
    return job; // Return original if translation fails
  }
}
