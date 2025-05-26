"use client";

import React, { useState, useCallback } from "react";
import { CropArea } from "@/lib/imageUtils";

interface CropOverlayProps {
  cropArea: CropArea;
  onCropChange: (cropArea: CropArea) => void;
  containerWidth: number;
  containerHeight: number;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({
  cropArea,
  onCropChange,
  containerWidth,
  containerHeight,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - (cropArea.x * containerWidth) / 100,
        y: e.clientY - (cropArea.y * containerHeight) / 100,
      });
    },
    [cropArea.x, cropArea.y, containerWidth, containerHeight]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = ((e.clientX - dragStart.x) / containerWidth) * 100;
        const newY = ((e.clientY - dragStart.y) / containerHeight) * 100;

        // Constrain to container bounds
        const constrainedX = Math.max(0, Math.min(100 - cropArea.width, newX));
        const constrainedY = Math.max(0, Math.min(100 - cropArea.height, newY));

        onCropChange({
          ...cropArea,
          x: constrainedX,
          y: constrainedY,
        });
      } else if (isResizing && resizeHandle) {
        const deltaX = ((e.clientX - dragStart.x) / containerWidth) * 100;
        const deltaY = ((e.clientY - dragStart.y) / containerHeight) * 100;

        let newCropArea = { ...cropArea };

        switch (resizeHandle) {
          case "nw":
            newCropArea.x = Math.max(0, cropArea.x + deltaX);
            newCropArea.y = Math.max(0, cropArea.y + deltaY);
            newCropArea.width = Math.max(10, cropArea.width - deltaX);
            newCropArea.height = Math.max(10, cropArea.height - deltaY);
            break;
          case "ne":
            newCropArea.y = Math.max(0, cropArea.y + deltaY);
            newCropArea.width = Math.max(
              10,
              Math.min(100 - cropArea.x, cropArea.width + deltaX)
            );
            newCropArea.height = Math.max(10, cropArea.height - deltaY);
            break;
          case "sw":
            newCropArea.x = Math.max(0, cropArea.x + deltaX);
            newCropArea.width = Math.max(10, cropArea.width - deltaX);
            newCropArea.height = Math.max(
              10,
              Math.min(100 - cropArea.y, cropArea.height + deltaY)
            );
            break;
          case "se":
            newCropArea.width = Math.max(
              10,
              Math.min(100 - cropArea.x, cropArea.width + deltaX)
            );
            newCropArea.height = Math.max(
              10,
              Math.min(100 - cropArea.y, cropArea.height + deltaY)
            );
            break;
        }

        // Ensure crop area stays within bounds
        if (
          newCropArea.x + newCropArea.width <= 100 &&
          newCropArea.y + newCropArea.height <= 100
        ) {
          onCropChange(newCropArea);
        }

        setDragStart({ x: e.clientX, y: e.clientY });
      }
    },
    [
      isDragging,
      isResizing,
      resizeHandle,
      dragStart,
      cropArea,
      containerWidth,
      containerHeight,
      onCropChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="absolute inset-0">
      {/* Crop selection area - transparent with dashed border */}
      <div
        className="absolute border-2 border-dashed border-blue-500 cursor-move"
        style={{
          left: `${cropArea.x}%`,
          top: `${cropArea.y}%`,
          width: `${cropArea.width}%`,
          height: `${cropArea.height}%`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Crop handles */}
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
      </div>
    </div>
  );
};
