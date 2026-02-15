"use client";

import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  onResetLayout: () => void;
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitToView,
  onResetLayout,
}: GraphControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-background/95 border rounded-lg shadow-lg p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <div className="border-t my-0.5" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onFitToView}
        title="Fit to View"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onResetLayout}
        title="Reset Layout"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
