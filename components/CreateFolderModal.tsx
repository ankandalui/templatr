"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createFolder } from "@/store/slices/folderSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, FolderPlus, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Array of gradient color combinations for folders
const folderColors = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-green-500 to-green-600",
  "from-red-500 to-red-600",
  "from-yellow-500 to-yellow-600",
  "from-pink-500 to-pink-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
  "from-orange-500 to-orange-600",
  "from-cyan-500 to-cyan-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600",
  "from-lime-500 to-lime-600",
  "from-sky-500 to-sky-600",
];

// Function to get a random color
const getRandomFolderColor = () => {
  return folderColors[Math.floor(Math.random() * folderColors.length)];
};

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFolderModal({
  open,
  onOpenChange,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [createdFolderId, setCreatedFolderId] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();

  const { folders, createLoading } = useAppSelector((state) => state.folders);
  const { recentTemplates } = useAppSelector((state) => state.templates);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFolderName("");
      setValidationError("");
      setCreatedFolderId(null);
    }
  }, [open]);

  // Validate folder name in real-time using API
  useEffect(() => {
    if (!folderName.trim()) {
      setValidationError("");
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      validateFolderName(folderName.trim());
    }, 500); // Increased debounce time for API calls

    return () => clearTimeout(timeoutId);
  }, [folderName]);

  const validateFolderName = async (name: string) => {
    try {
      const response = await fetch(
        `/api/check-name?name=${encodeURIComponent(name)}&type=both`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setValidationError(data.message);
        } else {
          setValidationError("");
        }
      } else {
        // Fallback to client-side validation if API fails
        const existingFolder = folders.find(
          (folder) => folder.name.toLowerCase() === name.toLowerCase()
        );
        const existingTemplate = recentTemplates.find(
          (template) => template.name.toLowerCase() === name.toLowerCase()
        );

        if (existingFolder) {
          setValidationError("A folder with this name already exists");
        } else if (existingTemplate) {
          setValidationError("A template with this name already exists");
        } else {
          setValidationError("");
        }
      }
    } catch (error) {
      console.error("Error validating name:", error);
      // Fallback to client-side validation
      const existingFolder = folders.find(
        (folder) => folder.name.toLowerCase() === name.toLowerCase()
      );
      const existingTemplate = recentTemplates.find(
        (template) => template.name.toLowerCase() === name.toLowerCase()
      );

      if (existingFolder) {
        setValidationError("A folder with this name already exists");
      } else if (existingTemplate) {
        setValidationError("A template with this name already exists");
      } else {
        setValidationError("");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setValidationError("Folder name is required");
      return;
    }

    if (validationError) {
      return;
    }

    try {
      const result = await dispatch(
        createFolder({
          name: folderName.trim(),
          color: getRandomFolderColor(), // Random color
        })
      ).unwrap();

      setCreatedFolderId(result.id);

      toast({
        title: "Folder created successfully",
        description: `"${folderName}" has been created.`,
      });
    } catch (error) {
      toast({
        title: "Error creating folder",
        description: error as string,
        variant: "destructive",
      });
    }
  };

  const handleCreateTemplate = () => {
    if (createdFolderId) {
      // Navigate to create-template page with folder pre-selected
      router.push(`/create-template?folder=${createdFolderId}`);
      onOpenChange(false);
    }
  };

  const isFormValid = folderName.trim() && !validationError && !isValidating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-blue-600" />
              Create New Folder
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!createdFolderId ? (
            // Step 1: Create Folder
            <>
              <div className="space-y-2">
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  placeholder="Enter folder name..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className={validationError ? "border-red-500" : ""}
                />
                {isValidating && (
                  <p className="text-sm text-gray-500">
                    Checking availability...
                  </p>
                )}
                {validationError && (
                  <p className="text-sm text-red-600">{validationError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={!isFormValid || createLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {createLoading ? "Creating..." : "Create Folder"}
                </Button>
              </div>
            </>
          ) : (
            // Step 2: Folder Created - Show Create Template Option
            <>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FolderPlus className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Folder Created Successfully!
                  </h3>
                  <p className="text-gray-600">
                    "{folderName}" is ready for templates.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Done
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
