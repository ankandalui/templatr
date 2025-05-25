"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchFolders, createFolder } from "@/store/slices/folderSlice";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  FileImage,
  Download,
  Eye,
} from "lucide-react";

interface BackgroundImage {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { folders, isLoading: foldersLoading } = useAppSelector(
    (state) => state.folders
  );

  const [step, setStep] = useState<
    "choice" | "details" | "processing" | "preview"
  >("choice");
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [templateType, setTemplateType] = useState<
    "folder" | "standalone" | ""
  >("");
  const [templateName, setTemplateName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("no-folder");
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>(
    []
  );
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>("");
  const [questionImages, setQuestionImages] = useState<File[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createdTemplates, setCreatedTemplates] = useState<any[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Loading states for buttons
  const [downloadPptLoading, setDownloadPptLoading] = useState(false);
  const [downloadSingleLoading, setDownloadSingleLoading] = useState(false);
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Check for edit mode or folder parameter on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const editId = searchParams.get("edit");
      const folderId = searchParams.get("folder");

      if (editId) {
        setEditTemplateId(editId);
        setIsEditMode(true);
        setStep("details"); // Skip choice step for edit mode
      } else if (folderId) {
        // Pre-select folder and skip choice step
        setTemplateType("folder");
        setSelectedFolderId(folderId);
        setStep("details"); // Skip choice step for folder creation
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Fetch folders when component mounts (needed for choice step)
    dispatch(fetchFolders());

    // Fetch background images when we reach the details step
    if (step === "details") {
      fetchBackgroundImages();
    }
  }, [isAuthenticated, dispatch, router, step]);

  // Fetch template data when in edit mode
  useEffect(() => {
    if (isEditMode && editTemplateId && isAuthenticated) {
      const fetchTemplateData = async () => {
        try {
          const response = await fetch(`/api/templates/${editTemplateId}`, {
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Failed to fetch template");
          }

          const data = await response.json();
          const template = data.template;

          setEditingTemplate(template);
          setTemplateName(template.name);
          setSelectedFolderId(template.folderId || "no-folder");
          setTemplateType(template.folderId ? "folder" : "standalone");

          // Set background image if available
          if (template.backgroundImage) {
            setSelectedBackgroundId(template.backgroundImage.id);
          }
        } catch (error) {
          console.error("Error fetching template:", error);
          alert("Failed to load template data");
          router.push("/dashboard");
        }
      };

      fetchTemplateData();
    }
  }, [isEditMode, editTemplateId, isAuthenticated, router]);

  const fetchBackgroundImages = async () => {
    try {
      setIsLoadingImages(true);
      const response = await fetch("/api/background-images", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setBackgroundImages(data.backgroundImages);
      }
    } catch (error) {
      console.error("Error fetching background images:", error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleQuestionImagesUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // For standalone templates, replace existing images
    if (templateType === "standalone") {
      if (files.length > 1) {
        alert("Standalone templates can only have one question image");
        return;
      }

      // Validate all files are images
      const invalidFiles = files.filter(
        (file) => !file.type.startsWith("image/")
      );
      if (invalidFiles.length > 0) {
        alert("Please select only image files");
        return;
      }

      setQuestionImages(files);
      return;
    }

    // For folder templates, add to existing images
    if (templateType === "folder") {
      // Validate all files are images
      const invalidFiles = files.filter(
        (file) => !file.type.startsWith("image/")
      );
      if (invalidFiles.length > 0) {
        alert("Please select only image files");
        return;
      }

      setQuestionImages((prevImages) => {
        const newImages = [...prevImages, ...files];

        // Check total count after adding new images
        if (newImages.length > 50) {
          alert(
            `Maximum 50 question images allowed. You currently have ${
              prevImages.length
            } images. You can add ${50 - prevImages.length} more.`
          );
          return prevImages; // Don't add if it exceeds limit
        }

        return newImages;
      });
    }

    // Reset the file input so the same files can be selected again if needed
    event.target.value = "";
  };

  const removeQuestionImage = (index: number) => {
    setQuestionImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    // For edit mode, we don't require new question images
    if (!isEditMode && questionImages.length === 0) {
      alert("Please upload at least one question image");
      return;
    }

    try {
      setStep("processing");
      setProcessingProgress(0);

      // Simulate processing progress
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      let response;

      if (isEditMode && editTemplateId) {
        // Update existing template
        response = await fetch(`/api/templates/${editTemplateId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: templateName.trim(),
            folderId:
              templateType === "folder"
                ? selectedFolderId === "no-folder"
                  ? null
                  : selectedFolderId
                : null,
          }),
        });
      } else {
        // Create new template
        const formData = new FormData();
        formData.append("name", templateName.trim());
        formData.append("templateType", templateType);
        formData.append("backgroundImageId", selectedBackgroundId || "");

        if (templateType === "folder") {
          formData.append(
            "folderId",
            selectedFolderId === "no-folder" ? "" : selectedFolderId || ""
          );
        }

        // Add question images
        questionImages.forEach((file, index) => {
          formData.append(`questionImage_${index}`, file);
        });

        response = await fetch("/api/templates", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      }

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditMode ? "update" : "create"} template`
        );
      }

      const data = await response.json();

      if (isEditMode) {
        // For edit mode, redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        // For create mode, show preview
        setCreatedTemplates(data.templates || [data.template]);
        setTimeout(() => {
          setStep("preview");
        }, 1000);
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} template:`,
        error
      );
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? "update" : "create"} template`
      );
      setStep("details");
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === backgroundImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? backgroundImages.length - 1 : prev - 1
    );
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name.replace(/\.[^/.]+$/, ""));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 100);

      const response = await fetch("/api/background-images", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();

        // Add the new image to the list
        setBackgroundImages((prev) => [data.backgroundImage, ...prev]);

        // Auto-select the newly uploaded image
        setSelectedBackgroundId(data.backgroundImage.id);
        setCurrentImageIndex(0);

        // Reset file input
        event.target.value = "";

        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return null;
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
            onClick={() => {
              if (step === "preview" || (step === "details" && isEditMode)) {
                router.push("/dashboard");
              } else if (step === "details") {
                setStep("choice");
              } else {
                router.back();
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {step === "choice"
                ? "Choose Template Type"
                : step === "processing"
                ? `${isEditMode ? "Updating" : "Processing"} Template`
                : step === "preview"
                ? "Template Created Successfully"
                : `${isEditMode ? "Edit" : "Create New"} Template`}
            </h1>
            <p className="text-gray-600">
              {step === "choice"
                ? "Select how you want to organize your template"
                : step === "processing"
                ? `${
                    isEditMode ? "Updating" : "Creating"
                  } your template with overlay processing...`
                : step === "preview"
                ? "Your template has been created and is ready to use"
                : `${
                    isEditMode ? "Update" : "Design"
                  } your template with background and question images`}
            </p>
          </div>
        </div>

        {step === "choice" ? (
          /* Template Type Choice */
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Folder Template */}
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  templateType === "folder"
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => setTemplateType("folder")}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-xl">Folder Template</CardTitle>
                  <CardDescription className="text-sm">
                    Create a template with multiple question images (up to 50)
                    organized in a folder
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Multiple question images</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Organized in folders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Up to 50 images per template</span>
                      </div>
                    </div>

                    {/* Folder Selection - Only show when folder template is selected */}
                    {templateType === "folder" && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <Label className="text-sm font-medium">
                          Choose Folder
                        </Label>
                        <Select
                          value={selectedFolderId}
                          onValueChange={setSelectedFolderId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new-folder">
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create New Folder
                              </div>
                            </SelectItem>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                📁 {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* New Folder Input - Show when "Create New Folder" is selected */}
                        {selectedFolderId === "new-folder" && (
                          <div className="space-y-2">
                            <Label
                              htmlFor="new-folder-name"
                              className="text-sm"
                            >
                              New Folder Name
                            </Label>
                            <Input
                              id="new-folder-name"
                              placeholder="Enter folder name"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Standalone Template */}
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  templateType === "standalone"
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => setTemplateType("standalone")}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-xl">Standalone Template</CardTitle>
                  <CardDescription className="text-sm">
                    Create a simple template with one question image
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>One question image</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>No folder organization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Quick and simple</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-8">
              <Button
                onClick={async () => {
                  if (!templateType) {
                    alert("Please select a template type");
                    return;
                  }

                  // If folder template and creating new folder, create it first
                  if (
                    templateType === "folder" &&
                    selectedFolderId === "new-folder"
                  ) {
                    if (!newFolderName.trim()) {
                      alert("Please enter a folder name");
                      return;
                    }

                    try {
                      const response = await fetch("/api/folders", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({
                          name: newFolderName.trim(),
                        }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        alert(errorData.error || "Failed to create folder");
                        return;
                      }

                      const data = await response.json();
                      // Update the selected folder to the newly created one
                      setSelectedFolderId(data.folder.id);
                      // Refresh folders list
                      dispatch(fetchFolders());
                    } catch (error) {
                      console.error("Error creating folder:", error);
                      alert("Failed to create folder");
                      return;
                    }
                  }

                  // Validate folder selection for folder templates
                  if (templateType === "folder" && !selectedFolderId) {
                    alert("Please select a folder");
                    return;
                  }

                  setStep("details");
                }}
                disabled={
                  !templateType ||
                  (templateType === "folder" &&
                    selectedFolderId === "new-folder" &&
                    !newFolderName.trim())
                }
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Continue
              </Button>
            </div>
          </div>
        ) : step === "processing" ? (
          /* Processing Step */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">
                  Creating Your Template
                </CardTitle>
                <CardDescription>
                  Processing overlay and generating final templates...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Processing Template
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    Overlaying question images on background...
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Template Processing
                      </p>
                      <p className="text-sm text-blue-700">
                        Your question images are being positioned at the
                        top-left corner of the background image with proper
                        padding and sizing.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : step === "preview" ? (
          /* Preview Step */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {createdTemplates.length > 1
                  ? `${createdTemplates.length} Templates Created Successfully!`
                  : "Template Created Successfully!"}
              </h2>
              <p className="text-gray-600">
                Your {templateType} template
                {createdTemplates.length > 1 ? "s" : ""} "{templateName}"
                {createdTemplates.length > 1 ? " have" : " has"} been processed
                and {createdTemplates.length > 1 ? "are" : "is"} ready to use.
              </p>
              {createdTemplates.length > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Badge variant="secondary" className="text-sm">
                    {createdTemplates.length} Templates Generated
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                  >
                    View All in Dashboard
                  </Button>
                </div>
              )}
            </div>

            {/* Template Preview with Slider for Multiple Templates */}
            {createdTemplates.length > 1 ? (
              /* Multiple Templates - Slider View */
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileImage className="h-5 w-5" />
                        {createdTemplates[currentPreviewIndex]?.name}
                      </CardTitle>
                      <CardDescription>
                        Template {currentPreviewIndex + 1} of{" "}
                        {createdTemplates.length} - Final template with question
                        image overlaid on background
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {currentPreviewIndex + 1} / {createdTemplates.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Template Preview */}
                    <div className="relative">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                        {createdTemplates[currentPreviewIndex]
                          ?.backgroundImage &&
                        createdTemplates[currentPreviewIndex]?.questionUrl ? (
                          <div className="relative w-full h-full">
                            {/* Background Image */}
                            <img
                              src={
                                createdTemplates[currentPreviewIndex]
                                  .backgroundImage.imageUrl
                              }
                              alt="Background"
                              className="w-full h-full object-cover"
                            />

                            {/* Question Image Overlay - Top Left Corner */}
                            <div
                              className="absolute top-4 left-4"
                              style={{ width: "70%", maxHeight: "80%" }}
                            >
                              <img
                                src={
                                  createdTemplates[currentPreviewIndex]
                                    .questionUrl
                                }
                                alt="Question"
                                className="w-full h-auto object-contain"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Template processed successfully
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Navigation Arrows */}
                      {createdTemplates.length > 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={() =>
                              setCurrentPreviewIndex((prev) =>
                                prev === 0
                                  ? createdTemplates.length - 1
                                  : prev - 1
                              )
                            }
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={() =>
                              setCurrentPreviewIndex((prev) =>
                                prev === createdTemplates.length - 1
                                  ? 0
                                  : prev + 1
                              )
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Template Dots Navigation */}
                    {createdTemplates.length > 1 && (
                      <div className="flex justify-center gap-2">
                        {createdTemplates.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentPreviewIndex
                                ? "bg-blue-600"
                                : "bg-gray-300"
                            }`}
                            onClick={() => setCurrentPreviewIndex(index)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        disabled={downloadPptLoading || downloadSingleLoading}
                        onClick={async () => {
                          // For folder templates, download as PPTX
                          if (templateType === "folder") {
                            setDownloadPptLoading(true);
                            try {
                              const templateIds = createdTemplates.map(
                                (t) => t.id
                              );
                              const response = await fetch(
                                "/api/templates/download-pptx",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  credentials: "include",
                                  body: JSON.stringify({
                                    templateIds,
                                    fileName: templateName,
                                  }),
                                }
                              );

                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${templateName}.pptx`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              } else {
                                alert("Failed to download PowerPoint");
                              }
                            } catch (error) {
                              console.error(
                                "Error downloading PowerPoint:",
                                error
                              );
                              alert("Failed to download PowerPoint");
                            } finally {
                              setDownloadPptLoading(false);
                            }
                          } else {
                            // For standalone templates, download individual image
                            setDownloadSingleLoading(true);
                            const template =
                              createdTemplates[currentPreviewIndex];
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
                              } else {
                                alert("Failed to download template");
                              }
                            } catch (error) {
                              console.error(
                                "Error downloading template:",
                                error
                              );
                              alert("Failed to download template");
                            } finally {
                              setDownloadSingleLoading(false);
                            }
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {templateType === "folder"
                          ? downloadPptLoading
                            ? "Downloading PowerPoint..."
                            : "Download as PowerPoint"
                          : downloadSingleLoading
                          ? "Downloading..."
                          : "Download This Template"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={previewLoading}
                        onClick={() => {
                          setPreviewLoading(true);
                          const template =
                            createdTemplates[currentPreviewIndex];
                          window.open(`/preview/${template.id}`, "_blank");
                          // Reset loading state after a short delay
                          setTimeout(() => setPreviewLoading(false), 1000);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {previewLoading ? "Opening Preview..." : "Preview"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={downloadAllLoading}
                        onClick={async () => {
                          setDownloadAllLoading(true);
                          try {
                            // Download all templates as individual images
                            for (const template of createdTemplates) {
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
                                  await new Promise((resolve) =>
                                    setTimeout(resolve, 500)
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error downloading template:",
                                  error
                                );
                              }
                            }
                          } finally {
                            setDownloadAllLoading(false);
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloadAllLoading
                          ? "Downloading All..."
                          : `Download All Images (${createdTemplates.length})`}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Single Template - Standard View */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    {createdTemplates[0]?.name}
                  </CardTitle>
                  <CardDescription>
                    Final template with question image overlaid on background
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                    {createdTemplates[0]?.backgroundImage &&
                    createdTemplates[0]?.questionUrl ? (
                      <div className="relative w-full h-full">
                        {/* Background Image */}
                        <img
                          src={createdTemplates[0].backgroundImage.imageUrl}
                          alt="Background"
                          className="w-full h-full object-cover"
                        />

                        {/* Question Image Overlay - Top Left Corner */}
                        <div
                          className="absolute top-4 left-4"
                          style={{ width: "70%", maxHeight: "80%" }}
                        >
                          <img
                            src={createdTemplates[0].questionUrl}
                            alt="Question"
                            className="w-full h-auto object-contain"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Template processed successfully
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button
                      className="flex-1"
                      disabled={downloadSingleLoading}
                      onClick={async () => {
                        setDownloadSingleLoading(true);
                        const template = createdTemplates[0];
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
                          } else {
                            alert("Failed to download template");
                          }
                        } catch (error) {
                          console.error("Error downloading template:", error);
                          alert("Failed to download template");
                        } finally {
                          setDownloadSingleLoading(false);
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadSingleLoading
                        ? "Downloading..."
                        : "Download Template"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={previewLoading}
                      onClick={() => {
                        setPreviewLoading(true);
                        const template = createdTemplates[0];
                        window.open(`/preview/${template.id}`, "_blank");
                        // Reset loading state after a short delay
                        setTimeout(() => setPreviewLoading(false), 1000);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {previewLoading ? "Opening Preview..." : "Preview"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center mt-8">
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Template Details */}
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>
                  {templateType === "folder"
                    ? "Create a folder template with multiple question images"
                    : "Create a standalone template with one question image"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                {templateType === "folder" && (
                  <div className="space-y-2">
                    <Label htmlFor="folder">Folder</Label>
                    <Select
                      value={selectedFolderId}
                      onValueChange={setSelectedFolderId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-folder">No Folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Question Images Upload */}
                <div className="space-y-2">
                  <Label>
                    Question Images *
                    <span className="text-sm text-gray-500 ml-2">
                      {templateType === "folder"
                        ? "(Up to 50 images)"
                        : "(1 image only)"}
                    </span>
                  </Label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple={templateType === "folder"}
                      onChange={handleQuestionImagesUpload}
                      className="hidden"
                      id="question-images"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("question-images")?.click()
                      }
                      className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-blue-400"
                    >
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium">
                          {templateType === "folder"
                            ? questionImages.length > 0
                              ? "Add More Question Images"
                              : "Upload Question Images (Multiple)"
                            : "Upload Question Image (Single)"}
                        </p>
                        {templateType === "folder" &&
                          questionImages.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {questionImages.length}/50 images selected
                            </p>
                          )}
                      </div>
                    </Button>

                    {/* Question Images Preview */}
                    {questionImages.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Selected Images ({questionImages.length})
                          </p>
                          {templateType === "folder" &&
                            questionImages.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQuestionImages([])}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Clear All
                              </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {questionImages.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-16 object-cover rounded border"
                              />
                              <button
                                onClick={() => removeQuestionImage(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                              <p className="text-xs text-gray-600 truncate mt-1">
                                {file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={
                      isLoading ||
                      !templateName.trim() ||
                      (!isEditMode && questionImages.length === 0)
                    }
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading
                      ? `${isEditMode ? "Updating" : "Creating"}...`
                      : `${isEditMode ? "Update" : "Create"} Template`}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Background Image Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Background Image</CardTitle>
                    <CardDescription>
                      {backgroundImages.length === 0
                        ? "Upload your first background image"
                        : "Select from your uploaded background images"}
                    </CardDescription>
                  </div>
                  {backgroundImages.length > 0 && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="upload-more"
                        disabled={isUploading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("upload-more")?.click()
                        }
                        disabled={isUploading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload More
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingImages ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading images...</p>
                    </div>
                  </div>
                ) : backgroundImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      No background images yet
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload your first background image to get started
                    </p>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="upload-first"
                        disabled={isUploading}
                      />
                      <Button
                        onClick={() =>
                          document.getElementById("upload-first")?.click()
                        }
                        disabled={isUploading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading
                          ? "Uploading..."
                          : "Upload Background Image"}
                      </Button>
                    </div>
                    {isUploading && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {uploadProgress}% uploaded
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upload Progress Overlay */}
                    {isUploading && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">
                              Uploading new background image...
                            </p>
                            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-blue-900">
                            {uploadProgress}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Image Carousel */}
                    <div className="relative">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={backgroundImages[currentImageIndex]?.imageUrl}
                          alt={backgroundImages[currentImageIndex]?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {backgroundImages.length > 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={prevImage}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={nextImage}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Image Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {backgroundImages[currentImageIndex]?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {currentImageIndex + 1} of {backgroundImages.length}
                        </p>
                      </div>
                      <Button
                        variant={
                          selectedBackgroundId ===
                          backgroundImages[currentImageIndex]?.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setSelectedBackgroundId(
                            backgroundImages[currentImageIndex]?.id
                          )
                        }
                      >
                        {selectedBackgroundId ===
                        backgroundImages[currentImageIndex]?.id ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Selected
                          </>
                        ) : (
                          "Select This"
                        )}
                      </Button>
                    </div>

                    {/* Image Dots */}
                    {backgroundImages.length > 1 && (
                      <div className="flex justify-center gap-2">
                        {backgroundImages.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? "bg-blue-600"
                                : "bg-gray-300"
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
