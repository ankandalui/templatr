"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { FileImage } from "lucide-react";

interface TemplateThumbnailProps {
  backgroundImageUrl?: string;
  questionImageUrl?: string;
  templateName: string;
  className?: string;
  fallbackThumbnailUrl?: string;
  templateId?: string; // Add template ID for server-side thumbnail generation
}

// Simple in-memory cache for generated thumbnails
const thumbnailCache = new Map<string, string>();

// Clear cache on component load to force regeneration
thumbnailCache.clear();

export function TemplateThumbnail({
  backgroundImageUrl,
  questionImageUrl,
  templateName,
  className = "",
  fallbackThumbnailUrl,
  templateId,
}: TemplateThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Create a cache key based on the image URLs
  const cacheKey = useMemo(() => {
    if (!backgroundImageUrl || !questionImageUrl) return null;
    return `${backgroundImageUrl}-${questionImageUrl}`;
  }, [backgroundImageUrl, questionImageUrl]);

  useEffect(() => {
    // If we have a pre-generated thumbnail, use it
    if (fallbackThumbnailUrl) {
      setThumbnailDataUrl(fallbackThumbnailUrl);
      setIsLoading(false);
      return;
    }

    // If we have a template ID, use server-side thumbnail generation
    if (templateId) {
      const serverThumbnailUrl = `/api/templates/${templateId}/thumbnail`;
      setThumbnailDataUrl(serverThumbnailUrl);
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (cacheKey && thumbnailCache.has(cacheKey)) {
      setThumbnailDataUrl(thumbnailCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    // If we don't have both images, show fallback
    if (!backgroundImageUrl || !questionImageUrl) {
      setIsLoading(false);
      setError(true);
      return;
    }

    generateThumbnail();
  }, [
    backgroundImageUrl,
    questionImageUrl,
    fallbackThumbnailUrl,
    cacheKey,
    templateId,
  ]);

  const generateThumbnail = async () => {
    if (!backgroundImageUrl || !questionImageUrl) return;

    try {
      setIsLoading(true);
      setError(false);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size (16:9 aspect ratio for thumbnail)
      const canvasWidth = 400;
      const canvasHeight = 225;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Load background image
      const backgroundImg = new Image();
      // backgroundImg.crossOrigin = "anonymous"; // Try without CORS first

      await new Promise((resolve, reject) => {
        backgroundImg.onload = () => resolve(null);
        backgroundImg.onerror = reject;
        backgroundImg.src = backgroundImageUrl;
      });

      // Draw background image (cover the entire canvas)
      ctx.drawImage(backgroundImg, 0, 0, canvasWidth, canvasHeight);

      // Load question image
      const questionImg = new Image();
      // questionImg.crossOrigin = "anonymous"; // Try without CORS first

      await new Promise((resolve, reject) => {
        questionImg.onload = () => resolve(null);
        questionImg.onerror = reject;
        questionImg.src = questionImageUrl;
      });

      // Calculate question image dimensions and position
      const padding = 16; // 16px padding from edges
      const maxQuestionWidth = canvasWidth * 0.7; // 70% of canvas width (much larger)
      const maxQuestionHeight = canvasHeight * 0.8; // 80% of canvas height (much larger)

      // Calculate scaled dimensions maintaining aspect ratio
      const questionAspectRatio = questionImg.width / questionImg.height;
      let questionWidth = Math.min(maxQuestionWidth, questionImg.width);
      let questionHeight = questionWidth / questionAspectRatio;

      // If height exceeds max, scale down based on height
      if (questionHeight > maxQuestionHeight) {
        questionHeight = maxQuestionHeight;
        questionWidth = questionHeight * questionAspectRatio;
      }

      // Position at top-left with padding
      const questionX = padding;
      const questionY = padding;

      // Draw question image directly without any background or shadow
      ctx.drawImage(
        questionImg,
        questionX,
        questionY,
        questionWidth,
        questionHeight
      );

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      // Cache the generated thumbnail
      if (cacheKey) {
        thumbnailCache.set(cacheKey, dataUrl);
      }

      setThumbnailDataUrl(dataUrl);
      setIsLoading(false);
    } catch (err) {
      console.error("Error generating thumbnail:", err);
      setError(true);
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center ${className}`}
      >
        <div className="animate-pulse">
          <FileImage className="h-8 w-8 text-gray-400" />
        </div>
      </div>
    );
  }

  // Show error state or fallback
  if (error || !thumbnailDataUrl) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center ${className}`}
      >
        {backgroundImageUrl ? (
          <img
            src={backgroundImageUrl}
            alt={templateName}
            className="w-full h-full object-cover"
          />
        ) : questionImageUrl ? (
          <img
            src={questionImageUrl}
            alt={templateName}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileImage className="h-12 w-12 text-gray-400" />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />

      {/* Display the generated thumbnail */}
      <div className={className}>
        <img
          src={thumbnailDataUrl}
          alt={templateName}
          className="w-full h-full object-cover"
        />
      </div>
    </>
  );
}
