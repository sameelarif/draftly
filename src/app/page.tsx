"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSourcesStore } from "@/store/sources";
import { Source } from "@/types/source";
import { AnimatePresence, motion } from "framer-motion";
import { ChatCompletionChunk } from "groq-sdk/resources/chat/completions.mjs";
import { FilePlus, FileText, Link, Sparkles, Type } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { sources, setSources, removeSource } = useSourcesStore();
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasCompletedSuggestions, setHasCompletedSuggestions] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  useEffect(() => {
    setSuggestion("");

    if (!text || text.trim().length === 0 || !isTyping) {
      return;
    }

    if (abortController) {
      // Abort previous fetch request if user starts typing
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
          signal: controller.signal,
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

          while (!done) {
            const { done: isDone, value } = await reader.read();

            done = isDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });

              for (const line of chunk.split("\n")) {
                if (line.trim() === "") {
                  continue;
                }

                const data = JSON.parse(line.trim()) as ChatCompletionChunk;
                const content = data.choices[0].delta.content;

                if (content) {
                  setSuggestion((prev) => prev + content);
                }
              }

              await new Promise((resolve) => setTimeout(resolve, 200));
            }
          }
        } else {
          console.error("Failed to fetch suggestion:", response.statusText);
        }
      } catch (error: unknown) {
        if ((error as Error).name === "AbortError") {
          console.log("Fetch aborted due to new input.");
        } else {
          console.error("Error streaming suggestion:", error);
        }
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [text, isTyping]);

  useEffect(() => {
    const fetchSources = async () => {
      const response = await fetch("/api/uploads");
      if (response.ok) {
        const sources = (await response.json()) as Source[];
        setSources(sources);
      }
    };

    fetchSources();
  }, [setSources]);

  const renderTextWithSuggestion = () => {
    const textSpans = text
      .split("")
      .map((char, index) => <span key={`text-${index}`}>{char}</span>);

    const suggestionSpans = suggestion.split("").map((char, index) => (
      <motion.span
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        key={`suggestion-${index}`}
        style={{
          color: "rgb(156 163 175)",
        }}
      >
        {char}
      </motion.span>
    ));

    return (
      <>
        {textSpans}
        {suggestionSpans}
      </>
    );
  };

  return (
    <div className="grid grid-cols-6 gap-4 grid-flow-row p-12 max-w-screen-2xl w-full">
      <Header />
      <div className="relative col-span-4">
        <div className="relative w-full h-full">
          <div
            className={cn(
              "absolute inset-0 px-4 text-white py-2 text-lg rounded-lg border border-gray-200",
              "bg-transparent font-medium pointer-events-none whitespace-pre-wrap"
            )}
            aria-hidden="true"
          >
            {renderTextWithSuggestion()}
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
              setSuggestion("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                setHasCompletedSuggestions(true);
                e.preventDefault();
                setText(text + suggestion);
                setSuggestion("");
                setIsTyping(false);
              }
            }}
            placeholder="Start typing..."
          />
          <AnimatePresence>
            {suggestion && !hasCompletedSuggestions && (
              <motion.div
                initial={{
                  y: 20,
                  opacity: 0,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                transition={{
                  delay: 0.45,
                  duration: 0.4,
                  ease: "easeInOut",
                }}
                exit={{
                  y: 20,
                  opacity: 0,
                }}
              >
                <div className="absolute bottom-3 left-3 p-4 bg-white rounded-lg shadow-md">
                  <span className="text-sm text-gray-500">
                    Press <kbd>Tab</kbd> to accept suggestion
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg col-span-2 p-4">
        <h2 className="text-lg font-semibold">Sources</h2>
        <div className="flex flex-col items-start gap-4">
          {sources.map((source, idx) => (
            <motion.div
              initial={{
                x: 10,
                opacity: 0,
              }}
              animate={{
                x: 0,
                opacity: 1,
              }}
              transition={{
                delay: 0.1 * idx,
                duration: 0.4,
                ease: "easeInOut",
              }}
              key={idx}
              className="flex items-center gap-2"
            >
              <FileText />
              <span>{source.label}</span>
              <Button
                onClick={async () => {
                  const res = await fetch(`/api/uploads`, {
                    method: "DELETE",
                    body: JSON.stringify({ id: source.id }),
                  });

                  if (!res.ok) {
                    console.error("Failed to delete upload:", res.statusText);
                    return;
                  }

                  removeSource(source.id);
                }}
                size="sm"
                className="ml-auto"
              >
                Remove
              </Button>
            </motion.div>
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
