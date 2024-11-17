"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FilePlus, FileText, Link, Sparkles, Type, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { FileUpload } from "@/components/ui/file-upload";
import { FlipWords } from "@/components/ui/flip-words";

export default function Home() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isTyping, setIsTyping] = useState(false); // New state to track typing

  useEffect(() => {
    setSuggestion("");

    if (!text || text.trim().length === 0 || !isTyping) {
      return;
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          if (text[text.length - 1] !== " ") {
            setSuggestion(" ");
          }

          const reader = response.body?.getReader();
          if (!reader) {
            console.error("Failed to get response reader");
            return;
          }

          const decoder = new TextDecoder();
          let done = false;
          let streamSuggestion = "";
          let i = 0;

          while (!done) {
            const { value, done: isDone } = await reader.read();
            done = isDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              streamSuggestion += chunk;

              if (i === 0 && chunk[0] === " ") {
                streamSuggestion = streamSuggestion.slice(1);
              }

              setSuggestion((prev) => prev + chunk);

              await new Promise((resolve) => setTimeout(resolve, 200));

              i++;
            }
          }
        } else {
          console.error("Failed to fetch suggestion:", response.statusText);
        }
      } catch (error) {
        console.error("Error streaming suggestion:", error);
      }
    }, 1000);

    setTypingTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [text, isTyping]);

  useEffect(() => {
    const fetchUploads = async () => {
      const response = await fetch("/api/uploads");
      if (response.ok) {
        const uploads = await response.json();
        setUploads(uploads);
      }
    };

    fetchUploads();
  }, []);

  return (
    <div className="grid grid-cols-6 gap-4 grid-flow-row p-12">
      <header className="flex col-span-6 rounded-lg justify-between items-center p-4 bg-gray-800 text-white">
        <div className="text-2xl font-bold">
          Draftly&nbsp;
          <span className="text-gray-200 text-sm font-normal">
            for
            <FlipWords
              className="text-gray-200 font-normal"
              duration={2000}
              words={[
                "students",
                "researchers",
                "content creators",
                "marketers",
                "copywriters",
              ]}
            />
          </span>
        </div>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <div className="relative col-span-4">
        <div className="absolute inset-0 pointer-events-none">
          <textarea
            className={cn(
              "w-full h-full px-4 py-2 text-lg opacity-40 rounded-lg border border-gray-200",
              "bg-transparent text-muted-foreground font-medium"
            )}
            value={text + suggestion}
            readOnly
          />
        </div>
        <textarea
          className={cn(
            "w-full h-full px-4 py-2 text-lg rounded-lg border border-gray-200",
            "bg-transparent font-medium relative"
          )}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setIsTyping(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              setText(text + suggestion);
              setSuggestion("");
              setIsTyping(false);
            }
          }}
          placeholder="Start typing..."
        />
      </div>
      <div className="border border-gray-200 rounded-lg col-span-2 p-4">
        <h2 className="text-lg font-semibold">Sources</h2>
        <div className="flex flex-col items-start gap-4">
          {uploads.map((upload) => (
            <div key={upload} className="flex items-center gap-2">
              <FileText />
              <span>{upload.name}</span>
              <Button size="sm" className="ml-auto">
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full mt-4">
              <FilePlus className="mr-2 h-4 w-4" /> Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Add a source <Sparkles className="h-5 w-5 text-yellow-400" />
              </DialogTitle>
              <DialogDescription>
                Add a source from the web, upload a document, or type your own
                text.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="url" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-4">
                <div className="flex items-center space-x-2">
                  <Input type="url" placeholder="https://example.com" />
                  <Button type="submit" size="sm">
                    <Link className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                <FileUpload />
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                <Textarea
                  placeholder="Write in the tone of Commander Levi..."
                  className="min-h-[100px]"
                />
                <Button className="mt-2 w-full">
                  <Type className="mr-2 h-4 w-4" />
                  Add Text
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
