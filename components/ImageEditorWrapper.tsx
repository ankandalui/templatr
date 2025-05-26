"use client";

import dynamic from "next/dynamic";
import { ImagePosition, CropArea } from "@/lib/imageUtils";

// Dynamically import ImageEditor with no SSR
const ImageEditor = dynamic(
  () => import("./ImageEditor").then((mod) => ({ default: mod.ImageEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="aspect-video bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading editor...</p>
          </div>
        </div>
      </div>
    ),
  }
);

interface ImageEditorWrapperProps {
  backgroundImageUrl: string;
  questionImageUrl: string;
  templateName: string;
  containerWidth?: number;
  containerHeight?: number;
  onPositionChange?: (position: ImagePosition) => void;
  onSavedChangesUpdate?: (
    hasSavedChanges: boolean,
    position: ImagePosition,
    cropArea: CropArea | null
  ) => void;
  autoStartEdit?: boolean;
}

export const ImageEditorWrapper: React.FC<ImageEditorWrapperProps> = (
  props
) => {
  return <ImageEditor {...props} />;
};
