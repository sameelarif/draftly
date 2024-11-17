import openai from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { GenerationRequest } from "@/types/prompt";
import { getAuth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { Assistant } from "openai/resources/beta/assistants.mjs";
import { TextDeltaBlock } from "openai/resources/beta/threads/messages.mjs";

const userAssistants = new Map<string, Assistant>();

export async function POST(req: NextRequest) {
  console.time("Authentication");
  const { userId } = getAuth(req);
  console.timeEnd("Authentication");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.time("Request Parsing");
  const { text } = (await req.json()) as GenerationRequest;
  console.timeEnd("Request Parsing");

  console.time("Supabase Client Creation");
  const supabase = createClient(cookies());
  console.timeEnd("Supabase Client Creation");

  console.time("Retrieve Saved Vector Store");
  const savedVectorStore = await supabase
    .from("vectors")
    .select("*")
    .eq("user_id", userId)
    .single();
  console.timeEnd("Retrieve Saved Vector Store");

  if (savedVectorStore.status !== 200) {
    return new Response(
      JSON.stringify({ error: "No vector store found for user" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!userAssistants.has(userId)) {
    console.time("Retrieve Assistant");
    const assistant = await openai.beta.assistants.retrieve(
      savedVectorStore.data.assistant_id
    );
    console.timeEnd("Retrieve Assistant");

    console.time("Update Assistant with Vector Store");
    await openai.beta.assistants.update(assistant.id, {
      tool_resources: {
        file_search: {
          vector_store_ids: [savedVectorStore.data.id],
        },
      },
    });
    console.timeEnd("Update Assistant with Vector Store");

    userAssistants.set(userId, assistant);
  }

  const assistant = userAssistants.get(userId);

  if (!assistant) {
    return new Response(
      JSON.stringify({ error: "No assistant found for user" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  console.time("Create Thread");
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: "user",
        content:
          "Given the following text, generate a completion of the thought or sentence. Make sure you continue writing in the same style as the given text. Do not include the original text in the response. For example, if the text is 'The sky', you could respond with 'is blue'. Here is the text:\n\n" +
          text,
      },
    ],
  });
  console.timeEnd("Create Thread");

  const encoder = new TextEncoder();

  console.time("Stream Creation");
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.time("Stream Response");
        const streamResponse = await openai.beta.threads.runs.stream(
          thread.id,
          {
            assistant_id: assistant.id,
          }
        );
        console.timeEnd("Stream Response");

        console.time("Streaming Data");
        for await (const chunk of streamResponse) {
          if (chunk.event === "thread.message.delta") {
            const message = chunk.data.delta.content;

            if (!message) {
              continue;
            }

            for (const content of message) {
              controller.enqueue(
                encoder.encode((content as TextDeltaBlock).text?.value)
              );
            }
          }
        }
        console.timeEnd("Streaming Data");
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });
  console.timeEnd("Stream Creation");

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
