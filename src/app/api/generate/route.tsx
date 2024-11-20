import groq from "@/lib/groq";
import { GenerationRequest } from "@/types/prompt";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text } = (await req.json()) as GenerationRequest;

  const stream = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that helps users write better. The user will provide you with text and you will generate auto-completions of the thought or sentence. Limit responses to one sentence. For example, if the user provides 'The sky looks', you should respond with something like 'cloudy today, but it's still beautiful.' If you are unable to generate a response for some reason, respond with a blank string. If there is no need for an auto-completion, respond with a blank string.",
      },
      { role: "user", content: text },
    ],
    stream: true,
  });

  const readable = stream.toReadableStream();

  return new Response(readable);
}
