"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, X, Check, Image as ImageIcon } from "lucide-react";

interface UploadFile {
  file: File;
  name: string;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
}

export default function UploadImagesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const newFiles: UploadFile[] = files.map((file) => ({
      file,
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      preview: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateFileName = (index: number, newName: string) => {
    setUploadFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index].name = newName;
      return newFiles;
    });
  };

  const uploadFile = async (fileData: UploadFile, index: number) => {
    const formData = new FormData();
    formData.append("file", fileData.file);
    formData.append("name", fileData.name);

    try {
      setUploadFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index].status = "uploading";
        return newFiles;
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadFiles((prev) => {
          const newFiles = [...prev];
          if (newFiles[index].progress < 90) {
            newFiles[index].progress += 10;
          }
          return newFiles;
        });
      }, 100);

      const response = await fetch("/api/background-images", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        setUploadFiles((prev) => {
          const newFiles = [...prev];
          newFiles[index].status = "success";
          newFiles[index].progress = 100;
          return newFiles;
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch {
      setUploadFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index].status = "error";
        newFiles[index].progress = 0;
        return newFiles;
      });
    }
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);

    const pendingFiles = uploadFiles
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.status === "pending");

    for (const { file, index } of pendingFiles) {
      await uploadFile(file, index);
    }

    setIsUploading(false);
  };

  const allUploaded =
    uploadFiles.length > 0 && uploadFiles.every((f) => f.status === "success");
  const hasFiles = uploadFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Upload Background Images
            </h1>
            <p className="text-gray-600">
              Upload images to use as backgrounds in your templates
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Background Images</CardTitle>
            <CardDescription>
              Select multiple images to upload. Supported formats: JPG, PNG, GIF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Input */}
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
                disabled={isUploading}
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium">Click to select images</p>
                  <p className="text-xs text-gray-500">
                    or drag and drop files here
                  </p>
                </div>
              </Button>
            </div>

            {/* File List */}
            {hasFiles && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    Selected Images ({uploadFiles.length})
                  </h3>
                  <div className="flex gap-2">
                    {allUploaded && (
                      <Button
                        onClick={() => router.push("/create-template")}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Create Template
                      </Button>
                    )}
                    <Button
                      onClick={uploadAllFiles}
                      disabled={isUploading || allUploaded}
                    >
                      {isUploading ? "Uploading..." : "Upload All"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadFiles.map((fileData, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="aspect-video bg-gray-100 relative">
                        <img
                          src={fileData.preview}
                          alt={fileData.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Status Overlay */}
                        {fileData.status === "uploading" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <p className="text-sm">Uploading...</p>
                            </div>
                          </div>
                        )}

                        {fileData.status === "success" && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}

                        {fileData.status === "error" && (
                          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                            <p className="text-red-600 font-medium">
                              Upload Failed
                            </p>
                          </div>
                        )}

                        {/* Remove Button */}
                        {fileData.status !== "uploading" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 left-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Image Name</Label>
                          <Input
                            id={`name-${index}`}
                            value={fileData.name}
                            onChange={(e) =>
                              updateFileName(index, e.target.value)
                            }
                            disabled={
                              fileData.status === "uploading" ||
                              fileData.status === "success"
                            }
                          />
                        </div>

                        {fileData.status === "uploading" && (
                          <div className="mt-2">
                            <Progress
                              value={fileData.progress}
                              className="h-2"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!hasFiles && (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No images selected</p>
                <p className="text-sm text-gray-500">
                  Click the upload area to select images
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
