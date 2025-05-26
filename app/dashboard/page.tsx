"use client";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { fetchFolders, deleteFolder } from "@/store/slices/folderSlice";
import {
  fetchRecentTemplates,
  fetchTemplateStats,
  deleteTemplate,
} from "@/store/slices/templateSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Upload,
  Download,
  Eye,
  FileImage,
  TrendingUp,
  Clock,
  BarChart3,
  Image as ImageIcon,
  Palette,
  Zap,
  Folder,
  FolderPlus,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";
import { CreateFolderModal } from "@/components/CreateFolderModal";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );
  const { folders, isLoading: foldersLoading } = useAppSelector(
    (state) => state.folders
  );
  const {
    recentTemplates,
    stats,
    isLoading: templatesLoading,
    deleteLoading,
  } = useAppSelector((state) => state.templates);
  const router = useRouter();
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<{
    id: string;
    name: string;
    templateCount: number;
  } | null>(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [downloadingTemplates, setDownloadingTemplates] = useState<Set<string>>(
    new Set()
  );
  const [previewingTemplates, setPreviewingTemplates] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Temporary function to update existing folder colors
  const updateFolderColors = useCallback(async () => {
    try {
      const response = await fetch("/api/folders/update-colors", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Refresh folders to see new colors
        dispatch(fetchFolders());
      }
    } catch {
      console.log("Error updating folder colors");
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch data when user is authenticated
      dispatch(fetchFolders());
      dispatch(fetchRecentTemplates(6));
      dispatch(fetchTemplateStats());

      // Update folder colors on first load (temporary)
      updateFolderColors();
    }
  }, [isAuthenticated, user, dispatch, updateFolderColors]);

  const handleEditTemplate = (templateId: string) => {
    router.push(`/create-template?edit=${templateId}`);
  };

  const handleDeleteFolder = (
    folderId: string,
    folderName: string,
    templateCount: number
  ) => {
    setFolderToDelete({ id: folderId, name: folderName, templateCount });
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    setDeletingFolderId(folderToDelete.id);
    try {
      await dispatch(deleteFolder(folderToDelete.id)).unwrap();
      toast({
        title: "Folder deleted successfully",
        description:
          folderToDelete.templateCount > 0
            ? `"${folderToDelete.name}" and ${
                folderToDelete.templateCount
              } template${
                folderToDelete.templateCount !== 1 ? "s" : ""
              } have been deleted.`
            : `"${folderToDelete.name}" has been deleted.`,
      });
      // Refresh templates to update the recent templates list
      dispatch(fetchRecentTemplates(6));
      dispatch(fetchTemplateStats());
    } catch (error) {
      toast({
        title: "Error deleting folder",
        description: error as string,
        variant: "destructive",
      });
    } finally {
      setDeletingFolderId(null);
      setFolderToDelete(null);
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

      // Create blob and download
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
        title: "Download Started",
        description: `"${templateName}" is being downloaded.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download template. Please try again.",
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

  const handleDeleteTemplate = async (
    templateId: string,
    templateName: string
  ) => {
    try {
      await dispatch(deleteTemplate(templateId)).unwrap();
      // Refresh stats after successful deletion
      dispatch(fetchTemplateStats());
      toast({
        title: "Template Deleted",
        description: `"${templateName}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description:
          (error as string) || "Failed to delete template. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 font-medium">
              Loading dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold">
                {user.name
                  .split(" ")
                  .map((word) => word.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back, {user.name.split(" ")[0]}!
              </h1>
              <p className="text-gray-600">
                Ready to create amazing templates today?
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                console.log("New Template button clicked!");
                router.push("/create-template");
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/background-images")}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Background Images
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/upload-images")}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Bg Images
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Templates
              </CardTitle>
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalTemplates}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Your created templates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Images Uploaded
              </CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalImages}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Question images uploaded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Downloads
              </CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Template downloads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalViews}</div>
              )}
              <p className="text-xs text-muted-foreground">Template views</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Get started with these common tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => router.push("/create-template")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Template
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => router.push("/background-images")}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Manage Background Images
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => router.push("/upload-images")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Palette className="w-4 h-4 mr-2" />
                    Browse Templates
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest actions and updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Template &quot;Math Quiz&quot; created
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">5 images uploaded</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Template downloaded 15 times
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 days ago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Usage</CardTitle>
                <CardDescription>Your current usage this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Templates Created</span>
                    <span>12 / 50</span>
                  </div>
                  <Progress value={24} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Images Uploaded</span>
                    <span>48 / 200</span>
                  </div>
                  <Progress value={24} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Used</span>
                    <span>2.4 GB / 10 GB</span>
                  </div>
                  <Progress value={24} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Folders Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Folders</h3>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => setCreateFolderModalOpen(true)}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Folder
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Create New Folder Card */}
                <Card
                  className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group"
                  onClick={() => setCreateFolderModalOpen(true)}
                >
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-50 rounded-lg flex items-center justify-center mb-3 transition-colors">
                      <FolderPlus className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                      Create New Folder
                    </p>
                  </CardContent>
                </Card>

                {/* Existing Folders */}
                {foldersLoading
                  ? // Loading skeleton for folders
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="aspect-video bg-gray-200 animate-pulse"></div>
                        <CardHeader className="pb-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                        </CardHeader>
                      </Card>
                    ))
                  : folders.map((folder) => (
                      <Card
                        key={folder.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push(`/folder/${folder.id}`)}
                      >
                        <div
                          className={`aspect-video bg-gradient-to-br ${folder.color} flex items-center justify-center relative`}
                        >
                          <Folder className="h-16 w-16 text-white/80" />
                          <div className="absolute top-3 right-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Rename Folder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Templates
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFolder(
                                      folder.id,
                                      folder.name,
                                      folder.templateCount
                                    );
                                  }}
                                  disabled={deletingFolderId === folder.id}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {deletingFolderId === folder.id
                                    ? "Deleting..."
                                    : "Delete Folder"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold truncate">
                              {folder.name}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            {folder.templateCount} template
                            {folder.templateCount !== 1 ? "s" : ""}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
              </div>
            </div>

            {/* Recent Templates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Templates</h3>
                <Button variant="outline">View All</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Template Cards */}
                {templatesLoading ? (
                  // Loading skeleton for templates
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-video bg-gray-200 animate-pulse"></div>
                      <CardHeader className="pb-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-200 rounded animate-pulse flex-1"></div>
                          <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : recentTemplates.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No templates yet</p>
                    <p className="text-sm text-gray-500">
                      Create your first template to get started
                    </p>
                  </div>
                ) : (
                  recentTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="aspect-video relative group">
                        <TemplateThumbnail
                          backgroundImageUrl={
                            template.backgroundImage?.imageUrl
                          }
                          questionImageUrl={template.questionUrl}
                          templateName={template.name}
                          fallbackThumbnailUrl={template.thumbnailUrl}
                          templateId={template.id}
                          className="w-full h-full"
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
                                onClick={() => handleEditTemplate(template.id)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Template
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownloadTemplate(
                                    template.id,
                                    template.name
                                  )
                                }
                                disabled={downloadingTemplates.has(template.id)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                {downloadingTemplates.has(template.id)
                                  ? "Downloading..."
                                  : "Download"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handlePreviewTemplate(template.id)
                                }
                                disabled={previewingTemplates.has(template.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {previewingTemplates.has(template.id)
                                  ? "Opening Preview..."
                                  : "Preview"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  handleDeleteTemplate(
                                    template.id,
                                    template.name
                                  )
                                }
                                disabled={deleteLoading}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deleteLoading
                                  ? "Deleting..."
                                  : "Delete Template"}
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
                          {template.folderName && (
                            <span className="text-blue-600">
                              📁 {template.folderName} •{" "}
                            </span>
                          )}
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
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Template Performance
                  </CardTitle>
                  <CardDescription>
                    Most popular templates this month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    "Math Quiz Template",
                    "Science Worksheet",
                    "History Timeline",
                    "Language Practice",
                  ].map((template, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{template}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.random() * 100}
                          className="w-20 h-2"
                        />
                        <span className="text-xs text-muted-foreground w-8">
                          {Math.floor(Math.random() * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Growth Metrics
                  </CardTitle>
                  <CardDescription>
                    Your account growth over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        +24%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Template Views
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        +18%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Downloads
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        +32%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        New Templates
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        +15%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        User Engagement
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
                <CardDescription>
                  Complete history of your account activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    action: "Created template 'Advanced Math Quiz'",
                    time: "2 hours ago",
                    type: "create",
                  },
                  {
                    action: "Uploaded 5 background images",
                    time: "4 hours ago",
                    type: "upload",
                  },
                  {
                    action: "Template 'Science Quiz' downloaded 12 times",
                    time: "1 day ago",
                    type: "download",
                  },
                  {
                    action: "Updated template 'History Timeline'",
                    time: "2 days ago",
                    type: "update",
                  },
                  {
                    action: "Created template 'Language Practice'",
                    time: "3 days ago",
                    type: "create",
                  },
                  {
                    action: "Uploaded 8 question images",
                    time: "4 days ago",
                    type: "upload",
                  },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div
                      className={`w-3 h-3 rounded-full mt-1 ${
                        activity.type === "create"
                          ? "bg-green-500"
                          : activity.type === "upload"
                          ? "bg-blue-500"
                          : activity.type === "download"
                          ? "bg-purple-500"
                          : "bg-orange-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Folder Confirmation Dialog */}
      <AlertDialog
        open={!!folderToDelete}
        onOpenChange={() => setFolderToDelete(null)}
      >
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Folder
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {folderToDelete && (
                <>
                  Are you sure you want to delete{" "}
                  <strong>&quot;{folderToDelete.name}&quot;</strong>?
                </>
              )}
            </AlertDialogDescription>

            {/* Warning section outside of AlertDialogDescription */}
            {folderToDelete && folderToDelete.templateCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  This will also delete{" "}
                  <strong>{folderToDelete.templateCount}</strong> template
                  {folderToDelete.templateCount !== 1 ? "s" : ""} inside this
                  folder.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-4">
              This action cannot be undone.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFolder}
              className="bg-red-600 hover:bg-red-700"
              disabled={!!deletingFolderId}
            >
              {deletingFolderId ? "Deleting..." : "Delete Folder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={createFolderModalOpen}
        onOpenChange={setCreateFolderModalOpen}
      />
    </div>
  );
}
