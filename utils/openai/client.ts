import OpenAI from "openai";

// Make OpenAI optional - only initialize if API key is provided
export const openai = process.env.OPENAI_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_KEY,
    })
  : null;
