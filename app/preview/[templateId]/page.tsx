"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  description?: string;
  backgroundImage?: {
    id: string;
    name: string;
    imageUrl: string;
  };
  questionUrl?: string;
  thumbnailUrl?: string;
  downloadCount: number;
  viewCount: number;
  isActive: boolean;
  userId: string;
  folderId?: string;
  folderName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/templates/${templateId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Template not found");
      }

      const data = await response.json();
      setTemplate(data.template);
    } catch (error) {
      console.error("Error fetching template:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load template"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!template) return;

    setDownloadLoading(true);
    try {
      const response = await fetch(`/api/templates/${template.id}/download`, {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${template.name}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template");
    } finally {
      setDownloadLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Template Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The template you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
              Template Preview
            </h1>
            <p className="text-gray-600">Preview and download your template</p>
          </div>
        </div>

        {/* Template Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <Button
                onClick={handleDownload}
                disabled={downloadLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadLoading ? "Downloading..." : "Download Template"}
              </Button>
            </div>
            {template.folderName && (
              <p className="text-sm text-gray-600">📁 {template.folderName}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 mb-4">
              {template.backgroundImage ? (
                <div className="relative w-full h-full">
                  {/* Background Image */}
                  <img
                    src={template.backgroundImage.imageUrl}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />

                  {/* Question Image Overlay - Top Left Corner */}
                  {template.questionUrl && (
                    <div
                      className="absolute top-4 left-4"
                      style={{ width: "70%", maxHeight: "80%" }}
                    >
                      <img
                        src={template.questionUrl}
                        alt="Question"
                        className="w-full h-auto object-contain"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600">No preview available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Template Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex gap-4">
                <span>Downloads: {template.downloadCount}</span>
                <span>Views: {template.viewCount}</span>
              </div>
              <span>
                Created: {new Date(template.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
