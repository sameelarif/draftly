"use client";

import { cn } from "@/utils/cn";
import { useState, useEffect } from "react";

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
        {/* Background textarea showing the suggestion */}
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
        {/* Actual textarea field */}
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
      <div className="border border-gray-200 rounded-lg col-span-2"></div>
    </div>
  );
}
