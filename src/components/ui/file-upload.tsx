"use client";

import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useState } from "react";

export function FileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("idle");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploads", {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        setUploadStatus("success");
      } else {
        setUploadStatus("error");
      }
    } catch (error) {
      console.error("File upload failed", error);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer",
          "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600",
          "transition-all duration-300 ease-in-out",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          ) : (
            <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
          )}
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PDF, DOCX, TXT, or Image (MAX. 10MB)
          </p>
          {uploadStatus === "success" && (
            <p className="mt-2 text-sm text-green-500">
              File uploaded successfully!
            </p>
          )}
          {uploadStatus === "error" && (
            <p className="mt-2 text-sm text-red-500">
              File upload failed. Please try again.
            </p>
          )}
        </div>
        <input
          onChange={handleFileUpload}
          id="dropzone-file"
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
          disabled={isUploading}
        />
      </label>
    </div>
  );
}
