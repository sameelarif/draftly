"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  FilePlus,
  Link,
  Sparkles,
  SparklesIcon,
  Type,
  Upload,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    setSuggestion("");

    if (!text) {
      return;
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(async () => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const { suggestion } = await response.json();
        setSuggestion(suggestion);
      }
    }, 1000);

    setTypingTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <div className="grid grid-cols-6 gap-4 grid-flow-row p-12">
      <header className="flex col-span-6 rounded-lg justify-between items-center p-4 bg-gray-800 text-white">
        <div className="text-2xl font-bold">Draftly</div>
        <button className="px-4 py-2 bg-blue-500 rounded-lg">Login</button>
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
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              setText(text + suggestion);
              setSuggestion("");
            }
          }}
          placeholder="Start typing..."
        />
      </div>
      <div className="border border-gray-200 rounded-lg col-span-2 p-4">
        <h2 className="text-lg font-semibold">Sources</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">
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
                    <Link />
                    Add
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF, DOCX, TXT, or Image (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                    />
                  </label>
                </div>
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                <Textarea
                  placeholder="Write in the tone of Commander Levi..."
                  className="min-h-[100px]"
                />
                <Button className="mt-2 w-full">
                  <Type />
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
