/**
 * API endpoint for translating job content
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "@/utils/openai/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobs, targetLanguage } = req.body;

  if (!jobs || !Array.isArray(jobs)) {
    return res.status(400).json({ error: "Invalid jobs array" });
  }

  // If no OpenAI or target language is Spanish, return original
  if (!openai || targetLanguage === "es") {
    return res.status(200).json({ translatedJobs: jobs });
  }

  try {
    const translatedJobs = await Promise.all(
      jobs.map(async (job) => {
        try {
          // If no OpenAI client, return original job
          if (!openai) {
            return job;
          }

          // Combine all text fields for translation in one call
          const fieldsToTranslate = [
            `TITLE: ${job.title}`,
            `DESCRIPTION: ${job.description}`,
            job.location ? `LOCATION: ${job.location}` : null,
            job.payRate ? `PAY: ${job.payRate}` : null,
            job.requirements ? `REQUIREMENTS: ${job.requirements}` : null,
          ].filter(Boolean);

          const textToTranslate = fieldsToTranslate.join("\n\n");

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are a translator. Translate the following text from Spanish to English. Maintain the same format with TITLE:, DESCRIPTION:, etc. labels. Return ONLY the translation.",
              },
              { role: "user", content: textToTranslate },
            ],
            temperature: 0.3,
            max_tokens: 800,
          });

          const translated =
            response.choices[0]?.message?.content?.trim() || textToTranslate;

          // Parse the translated response (remove /s flag for ES5 compatibility)
          const titleMatch = translated.match(/TITLE:\s*(.+?)(?=\n|$)/);
          const descMatch = translated.match(
            /DESCRIPTION:\s*([\s\S]+?)(?=\n\n|LOCATION:|PAY:|REQUIREMENTS:|$)/,
          );
          const locMatch = translated.match(/LOCATION:\s*(.+?)(?=\n|$)/);
          const payMatch = translated.match(/PAY:\s*(.+?)(?=\n|$)/);
          const reqMatch = translated.match(/REQUIREMENTS:\s*(.+?)(?=\n|$)/);

          return {
            ...job,
            title: titleMatch?.[1]?.trim() || job.title,
            description: descMatch?.[1]?.trim() || job.description,
            location: locMatch?.[1]?.trim() || job.location,
            payRate: payMatch?.[1]?.trim() || job.payRate,
            requirements: reqMatch?.[1]?.trim() || job.requirements,
          };
        } catch (error) {
          console.error("Error translating job:", error);
          // Return original job if translation fails
          return job;
        }
      }),
    );

    return res.status(200).json({ translatedJobs });
  } catch (error) {
    console.error("Translation API error:", error);
    return res
      .status(500)
      .json({ error: "Translation failed", translatedJobs: jobs });
  }
}
