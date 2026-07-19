import { createClient } from "@/lib/supabase/client";

/**
 * Progress photos (idea #11).
 *
 * Photos live in the PRIVATE Supabase Storage bucket "progress-photos" under
 * `{userId}/{checkpoint}.jpg` with owner-only RLS (see the bucket SQL in the
 * feature docs/PR). The client only ever reads its own photos via short-lived
 * signed URLs; sharing happens purely client-side on explicit user action.
 */

export const PROGRESS_PHOTOS_BUCKET = "progress-photos";

export type PhotoCheckpoint = "dia1" | "dia20" | "dia40";

export interface CheckpointDef {
  key: PhotoCheckpoint;
  /** 1-based plan day at which the guided prompt appears. */
  day: number;
  label: string;
}

export const PHOTO_CHECKPOINTS: CheckpointDef[] = [
  { key: "dia1", day: 1, label: "FOTO DIA 1" },
  { key: "dia20", day: 20, label: "FOTO DIA 20" },
  { key: "dia40", day: 40, label: "FOTO DIA 40" },
];

/** 1-based day number of `today` within a plan started on `startDate`. */
export function planDayNumber(startDate: string, today: string): number {
  const start = new Date(startDate + "T12:00:00").getTime();
  const now = new Date(today + "T12:00:00").getTime();
  return Math.floor((now - start) / 86_400_000) + 1;
}

/** Checkpoints whose guided moment has been reached by `dayNumber`. */
export function dueCheckpoints(dayNumber: number): CheckpointDef[] {
  return PHOTO_CHECKPOINTS.filter((cp) => dayNumber >= cp.day);
}

function photoPath(userId: string, checkpoint: PhotoCheckpoint): string {
  return `${userId}/${checkpoint}.jpg`;
}

export class ProgressPhotosService {
  private getSupabase() {
    const client = createClient();
    if (!client) throw new Error("Supabase client not available");
    return client;
  }

  /** Upload (or replace) the photo for a checkpoint. */
  async uploadPhoto(
    userId: string,
    checkpoint: PhotoCheckpoint,
    file: File
  ): Promise<boolean> {
    const { error } = await this.getSupabase()
      .storage.from(PROGRESS_PHOTOS_BUCKET)
      .upload(photoPath(userId, checkpoint), file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });
    if (error) {
      console.error("[ProgressPhotos] Upload failed:", error);
      return false;
    }
    return true;
  }

  /** Which checkpoints already have a photo. */
  async listCheckpoints(userId: string): Promise<PhotoCheckpoint[]> {
    const { data, error } = await this.getSupabase()
      .storage.from(PROGRESS_PHOTOS_BUCKET)
      .list(userId);
    if (error || !data) {
      if (error) console.error("[ProgressPhotos] List failed:", error);
      return [];
    }
    const names = new Set(data.map((entry) => entry.name));
    return PHOTO_CHECKPOINTS.filter((cp) => names.has(`${cp.key}.jpg`)).map(
      (cp) => cp.key
    );
  }

  /** Short-lived signed URL for displaying the user's own (private) photo. */
  async getPhotoUrl(
    userId: string,
    checkpoint: PhotoCheckpoint,
    expiresInSeconds = 3600
  ): Promise<string | null> {
    const { data, error } = await this.getSupabase()
      .storage.from(PROGRESS_PHOTOS_BUCKET)
      .createSignedUrl(photoPath(userId, checkpoint), expiresInSeconds);
    if (error || !data) {
      if (error) console.error("[ProgressPhotos] Signed URL failed:", error);
      return null;
    }
    return data.signedUrl;
  }
}

export const progressPhotosService = new ProgressPhotosService();
