export interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Default position - will be replaced with actual image size
export const DEFAULT_POSITION: ImagePosition = {
  x: 20, // 20px from left
  y: 20, // 20px from top
  width: 50, // Placeholder - will be replaced with actual image size
  height: 40, // Placeholder - will be replaced with actual image size
};

// Convert percentage-based position to pixel values
export const getPixelPosition = (
  position: ImagePosition,
  containerWidth: number,
  containerHeight: number
): ImagePosition => {
  return {
    x: position.x,
    y: position.y,
    width: (position.width / 100) * containerWidth,
    height: (position.height / 100) * containerHeight,
  };
};

// Convert pixel position back to percentage
export const getPercentagePosition = (
  position: ImagePosition,
  containerWidth: number,
  containerHeight: number
): ImagePosition => {
  return {
    x: position.x,
    y: position.y,
    width: (position.width / containerWidth) * 100,
    height: (position.height / containerHeight) * 100,
  };
};

// Create a canvas with merged background and question images
export const createMergedCanvas = (
  backgroundImage: HTMLImageElement,
  questionImage: HTMLImageElement,
  position: ImagePosition,
  containerWidth: number,
  containerHeight: number,
  cropArea?: CropArea
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Use background image's original dimensions for high quality
  canvas.width = backgroundImage.width;
  canvas.height = backgroundImage.height;

  // Calculate scale factors
  const scaleX = backgroundImage.width / containerWidth;
  const scaleY = backgroundImage.height / containerHeight;

  // Draw background image at full resolution
  ctx.drawImage(backgroundImage, 0, 0);

  // Calculate question image position and size at full resolution
  const scaledPos = {
    x: position.x * scaleX,
    y: position.y * scaleY,
    width: (position.width / 100) * backgroundImage.width,
    height: (position.height / 100) * backgroundImage.height,
  };

  // If cropping, apply crop area
  if (cropArea) {
    // Calculate crop dimensions relative to original question image
    const cropX = (cropArea.x / 100) * questionImage.width;
    const cropY = (cropArea.y / 100) * questionImage.height;
    const cropWidth = (cropArea.width / 100) * questionImage.width;
    const cropHeight = (cropArea.height / 100) * questionImage.height;

    ctx.drawImage(
      questionImage,
      cropX,
      cropY,
      cropWidth,
      cropHeight, // Source crop area
      scaledPos.x,
      scaledPos.y,
      scaledPos.width,
      scaledPos.height // Destination at full resolution
    );
  } else {
    // Draw full question image at full resolution
    ctx.drawImage(
      questionImage,
      scaledPos.x,
      scaledPos.y,
      scaledPos.width,
      scaledPos.height
    );
  }

  return canvas;
};

// Download canvas as image
export const downloadCanvasAsImage = (
  canvas: HTMLCanvasElement,
  filename: string
) => {
  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
};

// Load image from URL
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Calculate aspect ratio constrained dimensions
export const calculateAspectRatioDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width, height };
};
