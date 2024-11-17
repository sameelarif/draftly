import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import openai from "@/lib/openai";
import fsSync from "fs";
import { UploadDeleteRequest } from "@/types/upload";
import type { File as FileData } from "@/types/file";

const tempDir = join(process.cwd(), "tmp");

export async function PUT(req: NextRequest) {
  const { userId } = getAuth(req);
  const supabase = createClient(cookies());

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response("No file uploaded", { status: 400 });
  }

  const id = crypto.randomUUID();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = join(tempDir, `${id}___${userId}___${file.name}`);

  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  const fileStream = fsSync.createReadStream(filePath);

  const savedVectorStore = await supabase
    .from("vectors")
    .select("id")
    .eq("user_id", userId)
    .single();

  let vectorStoreId = "";

  if (savedVectorStore.data) {
    vectorStoreId = savedVectorStore.data.id;
  } else {
    const assistant = await openai.beta.assistants.create({
      name: "Writing Completion Assistant",
      model: "gpt-3.5-turbo",
      tools: [
        {
          type: "file_search",
        },
      ],
    });

    const vectorStore = await openai.beta.vectorStores.create({
      name: "User Files",
    });

    await supabase.from("vectors").insert({
      id: vectorStore.id,
      user_id: userId,
      assistant_id: assistant.id,
    });

    vectorStoreId = vectorStore.id;
  }

  const uploadedFiles = await openai.beta.vectorStores.files.uploadAndPoll(
    vectorStoreId,
    fileStream
  );

  const fileData = {
    id: uploadedFiles.id,
    vector_id: vectorStoreId,
    user_id: userId,
    name: file.name.split(".")[0],
    type: file.type,
  } as FileData;

  const res = await supabase.from("files").insert(fileData);

  await fs.unlink(filePath);

  if (res.error) {
    return new Response(res.error.message, { status: 500 });
  }

  return new Response(JSON.stringify(fileData), { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);
  const { id } = (await req.json()) as UploadDeleteRequest;
  const supabase = createClient(cookies());

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  } else if (typeof id !== "string") {
    return new Response("Invalid id", { status: 400 });
  }

  const file = await supabase
    .from("files")
    .select()
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!file.data) {
    return new Response("File not found", { status: 404 });
  }

  await supabase.from("files").delete().eq("id", id);

  await openai.beta.vectorStores.files.del(file.data.vector_id, file.data.id);

  return new Response("File deleted successfully", { status: 200 });
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  const supabase = createClient(cookies());

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const files = await supabase.from("files").select().eq("user_id", userId);

  return new Response(JSON.stringify(files.data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
