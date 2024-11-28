"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSourcesStore } from "@/store/sources";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AnimatePresence, motion } from "framer-motion";
import { ChatCompletionChunk } from "groq-sdk/resources/chat/completions.mjs";
import {
  Bold,
  FilePlus,
  FileText,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Redo,
  UnderlineIcon,
  Undo,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function TextEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Underline,
    ],
    content: "",
  });

  const { sources, addSource, setSources, removeSource } = useSourcesStore();
  const [suggestion, setSuggestion] = useState("");
  const [textSource, setTextSource] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasCompletedSuggestions, setHasCompletedSuggestions] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      const response = await fetch("/api/uploads");
      if (response.ok) {
        const sources = await response.json();
        setSources(sources);
      }
    };

    fetchSources();
  }, [setSources]);

  useEffect(() => {
    if (!editor || !isTyping) {
      return;
    }

    const text = editor.getText();
    setSuggestion("");

    if (!text || text.trim().length === 0) {
      return;
    }

    if (abortController) {
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
  }, [editor, isTyping, editor?.getText()]);

  if (!editor) {
    return null;
  }

  const fontSizes = [
    "8",
    "10",
    "12",
    "14",
    "16",
    "18",
    "20",
    "24",
    "30",
    "36",
    "48",
    "60",
    "72",
  ];

  return (
    <div className="flex flex-row w-full h-screen">
      <div className="flex items-start gap-2 justify-center mb-4 border-r border-gray-200 p-4">
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4 hidden md:block" />
          <FilePlus className="h-4 w-4 md:hidden" />
          <span className="hidden md:block">New Document</span>
        </Button>
      </div>

      <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
        <div className="bg-gray-100 rounded-lg p-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <Select defaultValue="normal">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Normal Text" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal Text</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="12">
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="12" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "bg-gray-200" : ""}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "bg-gray-200" : ""}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive("underline") ? "bg-gray-200" : ""}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const url = window.prompt("Enter URL");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={editor.isActive("link") ? "bg-gray-200" : ""}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-4 h-full">
          <div className="prose prose-sm max-w-none flex-1 h-full">
            <div className="relative h-full">
              <EditorContent
                editor={editor}
                style={{
                  outline: "none",
                }}
                className="h-full rounded-lg p-4 z-20 text-black"
                placeholder="Start writing..."
                onKeyDown={(e) => {
                  if (e.key === "Tab" && suggestion) {
                    e.preventDefault();
                    editor.commands.insertContent(suggestion);
                    setSuggestion("");
                    setIsTyping(false);
                    setHasCompletedSuggestions(true);
                  }
                }}
                onInput={() => {
                  setIsTyping(true);
                  setSuggestion("");
                }}
              />
              {!editor.getText() && (
                <div className="absolute top-0 left-0 text-gray-400 pointer-events-none p-4">
                  Start writing...
                </div>
              )}
              {suggestion && (
                <div className="absolute top-0 left-0 text-gray-400 pointer-events-none p-4 z-10">
                  <span className="text-transparent">{editor.getText()}</span>
                  {suggestion}
                </div>
              )}
            </div>
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
                  <div className="mt-2 p-2 bg-white rounded-lg shadow-md">
                    <span className="text-sm text-gray-500">
                      Press <kbd>Tab</kbd> to accept suggestion
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg flex-1 p-4">
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
                Add a source <FilePlus className="h-5 w-5 text-yellow-400" />
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
                    <LinkIcon className="mr-2 h-4 w-4" />
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
                  value={textSource}
                  onChange={(e) => setTextSource(e.target.value)}
                />
                <Button
                  onClick={async () => {
                    const res = await fetch(`/api/sources`, {
                      method: "PUT",
                      body: JSON.stringify({
                        type: "text",
                        content: textSource,
                      }),
                    });

                    if (!res.ok) {
                      console.error("Failed to delete upload:", res.statusText);
                      return;
                    }

                    const source = await res.json();
                    addSource(source);
                  }}
                  className="mt-2 w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
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
