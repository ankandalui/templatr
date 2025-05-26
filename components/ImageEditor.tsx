"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RotateCcw, Move, Crop, Square, Edit3 } from "lucide-react";
import {
  ImagePosition,
  CropArea,
  DEFAULT_POSITION,
  createMergedCanvas,
  downloadCanvasAsImage,
  loadImage,
  calculateAspectRatioDimensions,
} from "@/lib/imageUtils";
import { CropOverlay } from "./CropOverlay";

interface ImageEditorProps {
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

export const ImageEditor: React.FC<ImageEditorProps> = ({
  backgroundImageUrl,
  questionImageUrl,
  templateName,
  containerWidth = 800,
  containerHeight = 450,
  onPositionChange,
  onSavedChangesUpdate,
  autoStartEdit = false,
}) => {
  const [position, setPosition] = useState<ImagePosition>(DEFAULT_POSITION);
  const [isEditing, setIsEditing] = useState(autoStartEdit);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [savedPosition, setSavedPosition] =
    useState<ImagePosition>(DEFAULT_POSITION);
  const [savedCropArea, setSavedCropArea] = useState<CropArea | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [questionImageDimensions, setQuestionImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load question image to get dimensions and set initial size to actual image size
  useEffect(() => {
    loadImage(questionImageUrl).then((img) => {
      setQuestionImageDimensions({ width: img.width, height: img.height });

      // Set initial position to actual image size (only on first load)
      if (
        position.width === DEFAULT_POSITION.width &&
        position.height === DEFAULT_POSITION.height
      ) {
        const actualWidthPercent = (img.width / containerWidth) * 100;
        const actualHeightPercent = (img.height / containerHeight) * 100;

        const newPosition = {
          x: 20, // Keep same starting position
          y: 20,
          width: Math.min(actualWidthPercent, 90), // Cap at 90% to ensure it fits
          height: Math.min(actualHeightPercent, 80), // Cap at 80% to ensure it fits
        };

        setPosition(newPosition);
        onPositionChange?.(newPosition);
      }
    });
  }, [questionImageUrl, containerWidth, containerHeight, onPositionChange]);

  // Custom drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditing) return;

      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [isEditing, position.x, position.y]
  );

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!resizeHandle || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const relativeY = e.clientY - containerRect.top;

      // Calculate current dimensions - user has full control
      const currentWidth = (containerWidth * position.width) / 100;
      const currentHeight = (containerHeight * position.height) / 100;

      let newWidth = currentWidth;
      let newHeight = currentHeight;
      let newX = position.x;
      let newY = position.y;

      // Free resize - user controls both width and height independently
      switch (resizeHandle) {
        case "se": // Southeast
          newWidth = Math.max(
            50,
            Math.min(relativeX - position.x, containerWidth - position.x)
          );
          newHeight = Math.max(
            50,
            Math.min(relativeY - position.y, containerHeight - position.y)
          );
          break;
        case "sw": // Southwest
          newWidth = Math.max(
            50,
            Math.min(
              position.x + currentWidth - relativeX,
              containerWidth - relativeX
            )
          );
          newHeight = Math.max(
            50,
            Math.min(relativeY - position.y, containerHeight - position.y)
          );
          newX = Math.max(0, relativeX);
          break;
        case "ne": // Northeast
          newWidth = Math.max(
            50,
            Math.min(relativeX - position.x, containerWidth - position.x)
          );
          newHeight = Math.max(
            50,
            Math.min(
              position.y + currentHeight - relativeY,
              containerHeight - relativeY
            )
          );
          newY = Math.max(0, relativeY);
          break;
        case "nw": // Northwest
          newWidth = Math.max(
            50,
            Math.min(
              position.x + currentWidth - relativeX,
              containerWidth - relativeX
            )
          );
          newHeight = Math.max(
            50,
            Math.min(
              position.y + currentHeight - relativeY,
              containerHeight - relativeY
            )
          );
          newX = Math.max(0, relativeX);
          newY = Math.max(0, relativeY);
          break;
      }

      const newPosition = {
        ...position,
        x: newX,
        y: newY,
        width: (newWidth / containerWidth) * 100,
        height: (newHeight / containerHeight) * 100,
      };

      setPosition(newPosition);
      setHasUnsavedChanges(true);
      onPositionChange?.(newPosition);
    },
    [
      resizeHandle,
      containerWidth,
      containerHeight,
      position,
      questionImageDimensions,
      onPositionChange,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && !isResizing) {
        const newX = Math.max(
          0,
          Math.min(
            e.clientX - dragStart.x,
            containerWidth - (containerWidth * position.width) / 100
          )
        );
        const newY = Math.max(
          0,
          Math.min(
            e.clientY - dragStart.y,
            containerHeight - (containerHeight * position.height) / 100
          )
        );

        const newPosition = {
          ...position,
          x: newX,
          y: newY,
        };
        setPosition(newPosition);
        setHasUnsavedChanges(true);
        onPositionChange?.(newPosition);
      } else if (isResizing && resizeHandle) {
        handleResize(e);
      }
    },
    [
      isDragging,
      isResizing,
      resizeHandle,
      dragStart,
      containerWidth,
      containerHeight,
      position,
      questionImageDimensions,
      onPositionChange,
      handleResize,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle resize handle mouse down
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeHandle(handle);
    },
    []
  );

  const resetPosition = () => {
    setPosition(DEFAULT_POSITION);
    setCropArea(null);
    setIsCropping(false);
    onPositionChange?.(DEFAULT_POSITION);
  };

  const handleSave = () => {
    setSavedPosition(position);
    setSavedCropArea(cropArea);
    setHasUnsavedChanges(false);
    setIsEditing(false);
    setIsCropping(false);

    // Notify parent about saved changes
    onSavedChangesUpdate?.(true, position, cropArea);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setIsCropping(false);
  };

  const toggleCropMode = () => {
    setIsCropping(!isCropping);
    if (!isCropping) {
      // Initialize crop area to a reasonable default (center 60% of image)
      setCropArea({ x: 20, y: 20, width: 60, height: 60 });
    } else {
      setCropArea(null);
    }
  };

  // Handle crop area changes
  const handleCropChange = useCallback((newCropArea: CropArea) => {
    setCropArea(newCropArea);
    setHasUnsavedChanges(true);
  }, []);

  // Calculate dimensions - user has full control
  const currentWidth = (containerWidth * position.width) / 100;
  const currentHeight = (containerHeight * position.height) / 100;

  // Don't render interactive elements until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm" disabled>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Image
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div
              className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 mx-auto"
              style={{
                width: containerWidth,
                height: containerHeight,
                maxWidth: "100%",
              }}
            >
              <img
                src={backgroundImageUrl}
                alt="Background"
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div
                className="absolute"
                style={{
                  left: position.x,
                  top: position.y,
                  width: `${position.width}%`,
                  height: `${position.height}%`,
                }}
              >
                <img
                  src={questionImageUrl}
                  alt="Question"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls - Only show when editing */}
      {isEditing && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={isCropping ? "default" : "outline"}
            size="sm"
            onClick={toggleCropMode}
            className="flex items-center gap-2"
          >
            <Crop className="h-4 w-4" />
            {isCropping ? "Exit Crop" : "Crop"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetPosition}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            className="flex items-center gap-2"
            disabled={!hasUnsavedChanges}
          >
            <Download className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}

      {/* Preview Container */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 mx-auto"
            style={{
              width: containerWidth,
              height: containerHeight,
              maxWidth: "100%",
            }}
          >
            {/* Background Image */}
            <img
              src={backgroundImageUrl}
              alt="Background"
              className="w-full h-full object-cover"
              draggable={false}
            />

            {/* Question Image - Editable or Static */}
            {isEditing ? (
              <div
                ref={imageRef}
                className="absolute cursor-move border-2 border-blue-500 border-dashed"
                style={{
                  left: position.x,
                  top: position.y,
                  width: currentWidth,
                  height: currentHeight,
                }}
                onMouseDown={handleMouseDown}
              >
                <img
                  src={questionImageUrl}
                  alt="Question"
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Crop overlay when in crop mode */}
                {isCropping && cropArea && (
                  <CropOverlay
                    cropArea={cropArea}
                    onCropChange={handleCropChange}
                    containerWidth={currentWidth}
                    containerHeight={currentHeight}
                  />
                )}

                {/* Resize handles (only show when not cropping) */}
                {!isCropping && (
                  <>
                    <div
                      className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
                    ></div>
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
                    ></div>
                    <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
                    ></div>
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, "se")}
                    ></div>
                  </>
                )}

                {/* Move indicator */}
                <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Move className="h-3 w-3" />
                  {isCropping ? "Cropping mode" : "Drag to move"}
                </div>
              </div>
            ) : (
              /* Static preview - user controlled size */
              <div
                className="absolute"
                style={{
                  left: position.x,
                  top: position.y,
                  width: `${position.width}%`,
                  height: `${position.height}%`,
                }}
              >
                <img
                  src={questionImageUrl}
                  alt="Question"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Position Info (when editing) */}
      {isEditing && (
        <div className="text-sm text-gray-600 text-center">
          Position: ({Math.round(position.x)}, {Math.round(position.y)}) | Size:{" "}
          {Math.round(position.width)}% × {Math.round(position.height)}%
        </div>
      )}
    </div>
  );
};
