import { getAuth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AddSourceRequest } from "@/types/source";
import { NextRequest } from "next/server";
import groq from "@/lib/groq";

export async function PUT(req: NextRequest) {
  const { userId } = getAuth(req);
  const supabase = createClient(cookies());

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { type, content } = (await req.json()) as AddSourceRequest;

  console.log(type, content);

  if (type === "url") {
  } else if (type === "text") {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that extracts a label for a source given text content. The user will provide you with a string of text and you will need to extract a label for the source. The label should be a single, descriptive word or phrase that accurately represents the content of the source. If you are unable to extract a label, respond with 'Untitled'. An example of a label is if you are provided with a resume you could respond with 'SWE Resume'.",
        },
        { role: "user", content: `Text: ${content}` },
      ],
    });
    const label = completion.choices[0].message.content;

    const { error, data } = await supabase
      .from("source")
      .insert([{ user_id: userId, label: label ?? "Untitled", content }])
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: "Error adding source" }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data[0]), { status: 200 });
  }
}
