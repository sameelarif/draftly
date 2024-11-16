import openai from "@/lib/openai";
import { AutoCompleteSchema } from "@/types/prompt";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

export async function POST(req: Request) {
  const { text, userId } = await req.json();

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a writing expert. Complete the following text:",
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: zodResponseFormat(
      AutoCompleteSchema,
      "autocomplete_response"
    ),
  });

  const { refusal, parsed } = completion.choices[0].message;

  if (refusal) {
    return new Error(refusal);
  } else if (!parsed) {
    return new Error("No completion generated.");
  }

  console.log("Completion:", parsed);

  return Response.json(parsed);
}
