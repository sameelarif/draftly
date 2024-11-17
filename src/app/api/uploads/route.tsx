import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import openai from "@/lib/openai";
import fsSync from "fs";

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

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = join(tempDir, `${id}___${userId}___${file.name}`);

  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  // Create file stream for OpenAI upload
  const fileStream = fsSync.createReadStream(filePath);

  // Check for existing vector store
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
      model: "gpt-4o-mini",
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

  // Upload file to OpenAI and delete temporary file
  const batch = await openai.beta.vectorStores.fileBatches.uploadAndPoll(
    vectorStoreId,
    {
      files: [fileStream], // Uploading the current file only
    }
  );

  console.log(
    await openai.beta.vectorStores.fileBatches.listFiles(
      vectorStoreId,
      batch.id
    )
  );

  await fs.unlink(filePath); // Delete the temporary file after processing

  return new Response("File uploaded successfully", { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await req.json();

  if (typeof id !== "string") {
    return new Response("Invalid id", { status: 400 });
  }

  const files = await fs.readdir(tempDir);

  for (const file of files) {
    if (file.startsWith(id + "___")) {
      await fs.unlink(join(tempDir, file));
      return new Response("File deleted", { status: 200 });
    }
  }

  return new Response("File not found", { status: 404 });
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const files = await fs.readdir(tempDir);

  const userFiles = files
    .filter((file) => file.split("___")[1] === userId)
    .map((file) => file.split("___").pop()); // Return file names only

  return new Response(JSON.stringify(userFiles), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
