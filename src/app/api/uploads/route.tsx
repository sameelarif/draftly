import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";
import { getAuth } from "@clerk/nextjs/server";

const tempDir = join(process.cwd(), "tmp");

export async function PUT(req: NextRequest) {
  const { userId } = getAuth(req);

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

  return new Response("File uploaded successfully", { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = req.json() as any;

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

  const userFiles = files.filter((file) => file.split("___")[1] === userId);

  return new Response(JSON.stringify(userFiles), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
