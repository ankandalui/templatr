"use client";

import { useState, useEffect, useCallback } from "react";
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface BackgroundImage {
  id: string;
  name: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
}

interface DeleteError {
  error: string;
  message: string;
  templates: Array<{ id: string; name: string }>;
}

export default function BackgroundImagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingImages, setDownloadingImages] = useState<Set<string>>(
    new Set()
  );
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());
  const [imageToDelete, setImageToDelete] = useState<BackgroundImage | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<DeleteError | null>(null);

  const fetchBackgroundImages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/background-images", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch background images");
      }

      const data = await response.json();
      setBackgroundImages(data.backgroundImages);
    } catch (error) {
      console.error("Error fetching background images:", error);
      toast({
        title: "Error loading images",
        description: "Failed to load background images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchBackgroundImages();
  }, [isAuthenticated, router, fetchBackgroundImages]);

  const handleDownloadImage = async (imageId: string, imageName: string) => {
    setDownloadingImages((prev) => new Set(prev).add(imageId));
    try {
      const response = await fetch(`/api/background-images/${imageId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${imageName}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `"${imageName}" is being downloaded.`,
      });
    } catch {
      toast({
        title: "Download failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const handleDeleteImage = (image: BackgroundImage) => {
    setImageToDelete(image);
    setDeleteError(null);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    setDeletingImages((prev) => new Set(prev).add(imageToDelete.id));
    try {
      const response = await fetch(
        `/api/background-images/${imageToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          setDeleteError(errorData);
          return;
        }
        throw new Error("Failed to delete image");
      }

      toast({
        title: "Image deleted",
        description: `"${imageToDelete.name}" has been deleted successfully.`,
      });

      // Refresh the images list
      fetchBackgroundImages();
      setImageToDelete(null);
    } catch {
      toast({
        title: "Delete failed",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageToDelete.id);
        return newSet;
      });
    }
  };

  if (!user) {
    return null;
  }

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
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Background Images
              </h1>
              <p className="text-gray-600">
                Manage your background images for templates
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/upload-images")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-gray-200 animate-pulse"></div>
                <CardHeader className="pb-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : backgroundImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No background images yet
            </h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Upload your first background image to start creating amazing
              templates.
            </p>
            <Button
              onClick={() => router.push("/upload-images")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {backgroundImages.map((image) => (
              <Card
                key={image.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative group">
                  <img
                    src={image.imageUrl}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            handleDownloadImage(image.id, image.name)
                          }
                          disabled={downloadingImages.has(image.id)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloadingImages.has(image.id)
                            ? "Downloading..."
                            : "Download"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteImage(image)}
                          disabled={deletingImages.has(image.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingImages.has(image.id)
                            ? "Deleting..."
                            : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base truncate">
                    {image.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Uploaded on {new Date(image.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={downloadingImages.has(image.id)}
                      onClick={() => handleDownloadImage(image.id, image.name)}
                    >
                      {downloadingImages.has(image.id)
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!imageToDelete}
        onOpenChange={() => {
          setImageToDelete(null);
          setDeleteError(null);
        }}
      >
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Background Image
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {imageToDelete && (
                <>
                  Are you sure you want to delete{" "}
                  <strong>&quot;{imageToDelete.name}&quot;</strong>?
                </>
              )}
            </AlertDialogDescription>

            {/* Error section for templates using this image */}
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Cannot Delete</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  {deleteError.message}
                </p>
                {deleteError.templates.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-700 text-sm font-medium">
                      Templates using this image:
                    </p>
                    <ul className="text-red-700 text-sm mt-1 space-y-1">
                      {deleteError.templates.map((template) => (
                        <li
                          key={template.id}
                          className="flex items-center gap-2"
                        >
                          • {template.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-4">
              This action cannot be undone.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              className="bg-red-600 hover:bg-red-700"
              disabled={
                !!deleteError || deletingImages.has(imageToDelete?.id || "")
              }
            >
              {deletingImages.has(imageToDelete?.id || "")
                ? "Deleting..."
                : "Delete Image"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
