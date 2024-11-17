import openai from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Assistant } from "openai/resources/beta/assistants.mjs";
import { TextContentBlock } from "openai/resources/beta/threads/messages.mjs";
import { join } from "path";

const userAssistants = new Map<string, Assistant>();

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const { userId } = getAuth(req);
  console.log(`getAuth: ${Date.now() - startTime}ms`);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { text } = await req.json();
  console.log(`req.json: ${Date.now() - startTime}ms`);

  const supabase = createClient(cookies());
  console.log(`createClient: ${Date.now() - startTime}ms`);

  const savedVectorStore = await supabase
    .from("vectors")
    .select("*")
    .eq("user_id", userId)
    .single();
  console.log(`supabase.from.select: ${Date.now() - startTime}ms`);

  console.log(savedVectorStore);

  if (savedVectorStore.status !== 200) {
    return NextResponse.json(
      { error: "No vector store found for user" },
      { status: 400 }
    );
  }

  if (userAssistants.get(userId) === undefined) {
    const assistant = await openai.beta.assistants.retrieve(
      savedVectorStore.data.assistant_id
    );

    userAssistants.set(userId, assistant);
  }

  const assistant = userAssistants.get(userId);

  if (!assistant) {
    return NextResponse.json(
      { error: "No assistant found for user" },
      { status: 400 }
    );
  }

  console.log(`openai.beta.assistants.retrieve: ${Date.now() - startTime}ms`);

  await openai.beta.assistants.update(assistant.id, {
    tool_resources: {
      file_search: {
        vector_store_ids: [savedVectorStore.data.id],
      },
    },
  });
  console.log(`openai.beta.assistants.update: ${Date.now() - startTime}ms`);

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: "user",
        content:
          "Given the following text, generate a completion of the thought or sentence. Do not include the original text in the response. For example, if the text is 'The sky', you could respond with ' is blue' (note the added space was needed). Here is the text:\n\n" +
          text,
      },
    ],
  });
  console.log(`openai.beta.threads.create: ${Date.now() - startTime}ms`);

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistant.id,
  });
  console.log(
    `openai.beta.threads.runs.createAndPoll: ${Date.now() - startTime}ms`
  );

  const messages = await openai.beta.threads.messages.list(thread.id, {
    run_id: run.id,
  });
  console.log(`openai.beta.threads.messages.list: ${Date.now() - startTime}ms`);

  return NextResponse.json({
    suggestion: (messages.data[0].content[0] as TextContentBlock).text.value,
  });
}
