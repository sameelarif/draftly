import { createClient } from "@/lib/supabase/server";
import { UploadDeleteRequest } from "@/types/upload";
import { getAuth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import pdf from "pdf-parse";

export async function PUT(req: NextRequest) {
  const { userId } = getAuth(req);
  const supabase = createClient(cookies());

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  const fileBuffer = await getFileBuffer(file);

  const data = await pdf(fileBuffer);

  // Replace null characters with an empty string to prevent conversion issues
  const sanitizedContent = data.text.replace(/\u0000/g, "");

  const { error, data: source } = await supabase
    .from("source")
    .insert([{ user_id: userId, label: file.name, content: sanitizedContent }])
    .select();

  if (error) {
    console.log(error);

    return new Response(
      JSON.stringify({ error: "Error uploading to Supabase" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify(source[0]), { status: 200 });
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  const supabase = createClient(cookies());

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

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);
  const supabase = createClient(cookies());

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = (await req.json()) as UploadDeleteRequest;

  const { error } = await supabase.from("source").delete().eq("id", id);

  if (error) {
    return new Response(JSON.stringify({ error: "Error deleting source" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

function getFileBuffer(file: File): Promise<Buffer> {
  return file.arrayBuffer().then((buffer) => Buffer.from(buffer));
}
