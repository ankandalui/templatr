"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Plus,
  FileImage,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Folder,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";

interface Template {
  id: string;
  name: string;
  thumbnailUrl: string;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  isActive: boolean;
}

interface FolderData {
  id: string;
  name: string;
  color: string;
  templateCount: number;
  templates: Template[];
}

export default function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [folderId, setFolderId] = useState<string>("");
  const [folderData, setFolderData] = useState<FolderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [downloadingTemplates, setDownloadingTemplates] = useState<Set<string>>(
    new Set()
  );
  const [previewingTemplates, setPreviewingTemplates] = useState<Set<string>>(
    new Set()
  );
  const [downloadPptLoading, setDownloadPptLoading] = useState(false);
  const [downloadAllImagesLoading, setDownloadAllImagesLoading] =
    useState(false);

  // Get folder ID from params
  useEffect(() => {
    const getFolderId = async () => {
      const resolvedParams = await params;
      setFolderId(resolvedParams.id);
    };
    getFolderId();
  }, [params]);

  // Fetch folder data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (folderId) {
      fetchFolderData();
    }
  }, [isAuthenticated, folderId, router]);

  const fetchFolderData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/folders/${folderId}/templates`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Folder not found",
            description: "The folder you're looking for doesn't exist.",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch folder data");
      }

      const data = await response.json();
      setFolderData(data.folder);
    } catch (error) {
      console.error("Error fetching folder data:", error);
      toast({
        title: "Error loading folder",
        description: "Failed to load folder data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    router.push(`/create-template?folder=${folderId}`);
  };

  const handleEditTemplate = (templateId: string) => {
    router.push(`/create-template?edit=${templateId}`);
  };

  const handleDeleteTemplate = async (
    templateId: string,
    templateName: string
  ) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      setDeleteLoading(templateId);
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      toast({
        title: "Template deleted",
        description: `"${templateName}" has been deleted successfully.`,
      });

      // Refresh folder data
      fetchFolderData();
    } catch (error) {
      toast({
        title: "Error deleting template",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDownloadTemplate = async (
    templateId: string,
    templateName: string
  ) => {
    setDownloadingTemplates((prev) => new Set(prev).add(templateId));
    try {
      const response = await fetch(`/api/templates/${templateId}/download`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${templateName}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `"${templateName}" is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingTemplates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  const handlePreviewTemplate = (templateId: string) => {
    setPreviewingTemplates((prev) => new Set(prev).add(templateId));
    window.open(`/preview/${templateId}`, "_blank");
    // Reset loading state after a short delay
    setTimeout(() => {
      setPreviewingTemplates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }, 1000);
  };

  const handleDownloadFolderAsPpt = async () => {
    if (!folderData || folderData.templates.length === 0) return;

    setDownloadPptLoading(true);
    try {
      const templateIds = folderData.templates.map((t) => t.id);
      const response = await fetch("/api/templates/download-pptx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          templateIds,
          fileName: folderData.name,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${folderData.name}.pptx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download started",
          description: `"${folderData.name}" PowerPoint with editable layers is being downloaded.`,
        });
      } else {
        throw new Error("Failed to download PowerPoint");
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download PowerPoint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadPptLoading(false);
    }
  };

  const handleDownloadAllImages = async () => {
    if (!folderData || folderData.templates.length === 0) return;

    setDownloadAllImagesLoading(true);
    try {
      // Download all templates as individual images
      for (const template of folderData.templates) {
        try {
          const response = await fetch(
            `/api/templates/${template.id}/download`,
            {
              credentials: "include",
            }
          );

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

            // Small delay between downloads
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error("Error downloading template:", error);
        }
      }

      toast({
        title: "Download started",
        description: `All ${folderData.templates.length} images from "${folderData.name}" are being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadAllImagesLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 font-medium">Loading folder...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!folderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Folder not found
            </h2>
            <p className="text-gray-600 mb-4">
              The folder you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isAtLimit = folderData.templates.length >= 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${folderData.color} rounded-lg flex items-center justify-center`}
              >
                <Folder className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {folderData.name}
                </h1>
                <p className="text-gray-600">
                  {folderData.templates.length} of 50 templates
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {folderData.templates.length > 0 && (
              <>
                <Button
                  onClick={handleDownloadFolderAsPpt}
                  disabled={downloadPptLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {downloadPptLoading
                    ? "Downloading PPT..."
                    : "Download as PowerPoint"}
                </Button>
                <Button
                  onClick={handleDownloadAllImages}
                  disabled={downloadAllImagesLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {downloadAllImagesLoading
                    ? "Downloading Images..."
                    : `Download All Images (${folderData.templates.length})`}
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={isAtLimit}
                  className={`${
                    isAtLimit
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isAtLimit ? "Limit Reached (50/50)" : "Add More Templates"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {folderData.templates.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FileImage className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              This folder is empty
            </h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Get started by creating your first template in this folder. You
              can add up to 50 templates.
            </p>
            <Button
              onClick={handleCreateTemplate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          /* Templates Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folderData.templates.map((template) => (
              <Card
                key={template.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  <TemplateThumbnail
                    templateId={template.id}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleDownloadTemplate(template.id, template.name)
                          }
                          disabled={downloadingTemplates.has(template.id)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloadingTemplates.has(template.id)
                            ? "Downloading..."
                            : "Download"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePreviewTemplate(template.id)}
                          disabled={previewingTemplates.has(template.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {previewingTemplates.has(template.id)
                            ? "Opening Preview..."
                            : "Preview"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditTemplate(template.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() =>
                            handleDeleteTemplate(template.id, template.name)
                          }
                          disabled={deleteLoading === template.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deleteLoading === template.id
                            ? "Deleting..."
                            : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base truncate">
                      {template.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    Created on{" "}
                    {new Date(template.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {template.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {template.viewCount}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleEditTemplate(template.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={downloadingTemplates.has(template.id)}
                      onClick={() =>
                        handleDownloadTemplate(template.id, template.name)
                      }
                    >
                      {downloadingTemplates.has(template.id)
                        ? "Downloading..."
                        : "Download"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
