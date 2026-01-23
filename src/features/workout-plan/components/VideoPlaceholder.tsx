"use client";

import { Play, Youtube } from "lucide-react";
import { Card } from "@/shared/components/ui";

interface VideoPlaceholderProps {
  exerciseName: string;
  videoUrl?: string;
}

export function VideoPlaceholder({ exerciseName, videoUrl }: VideoPlaceholderProps) {
  if (videoUrl) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-accent hover:text-accent-dark transition-colors"
      >
        <Youtube className="h-4 w-4" />
        <span>Ver tecnica</span>
      </a>
    );
  }

  return (
    <Card className="p-4 bg-card-hover/50 border-dashed">
      <div className="flex flex-col items-center gap-2 text-foreground/40">
        <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
          <Play className="h-5 w-5" />
        </div>
        <span className="text-xs text-center">Video: {exerciseName}</span>
        <span className="text-[10px]">Proximamente</span>
      </div>
    </Card>
  );
}
