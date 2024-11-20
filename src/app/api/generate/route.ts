import groq from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";
import { GenerationRequest } from "@/types/prompt";
import { Source } from "@/types/source";
import { getAuth } from "@clerk/nextjs/server";
import { ChatCompletionSystemMessageParam } from "groq-sdk/resources/chat/completions.mjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  const supabase = createClient(cookies());

  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("source")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return new Response(JSON.stringify({ error: "Error fetching sources" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sources = data as Source[];

  const { text } = (await req.json()) as GenerationRequest;

  const stream = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that helps users write better. The user will provide you with text and you will generate auto-completions of the thought or sentence using the provided sources. Limit responses to one sentence. For example, if the user provides 'The sky looks', you should respond with something like 'cloudy today, but it's still beautiful.' If you are unable to generate a response for some reason, respond with a blank string. If there is no need for an auto-completion, respond with a blank string.",
      },
      ...sources.map(
        (source, i) =>
          ({
            role: "system",
            content: `Source ${i + 1}:
        File Name: ${source.label}
        File Content: \`\`\`${source.content}\`\`\``,
          } as ChatCompletionSystemMessageParam)
      ),
      { role: "user", content: text },
    ],
    stream: true,
  });

  const readable = stream.toReadableStream();

  return new Response(readable);
}
