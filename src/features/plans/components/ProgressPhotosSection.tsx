"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Share2, X } from "lucide-react";
import { track } from "@/features/shared/analytics/track";
import {
  PHOTO_CHECKPOINTS,
  dueCheckpoints,
  planDayNumber,
  progressPhotosService,
  type CheckpointDef,
  type PhotoCheckpoint,
} from "../services/progress-photos";
import { generateShareCard, shareOrDownload } from "../utils/share-card";

interface ProgressPhotosSectionProps {
  /** Plan start date (used to compute the current plan day). */
  planStartDate: Date;
  /** Owner of the photos; Storage paths are {userId}/{checkpoint}.jpg. */
  userId: string;
}

/**
 * Progress photos + share card (idea #11), rendered in the calendario tab.
 *
 * - Guided moments: a prompt card per checkpoint (day 1 / 20 / 40) that is
 *   dismissible but reappears on the next visit until a photo exists.
 * - Photos are PRIVATE (owner-only Storage RLS); display uses signed URLs.
 * - "Mi transformacion": side-by-side day 1 vs latest once 2+ photos exist,
 *   plus a canvas share card via navigator.share (download fallback).
 */
export function ProgressPhotosSection({ planStartDate, userId }: ProgressPhotosSectionProps) {
  const [existing, setExisting] = useState<PhotoCheckpoint[]>([]);
  const [urls, setUrls] = useState<Partial<Record<PhotoCheckpoint, string>>>({});
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState<PhotoCheckpoint[]>([]);
  const [uploading, setUploading] = useState<PhotoCheckpoint | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingCheckpointRef = useRef<PhotoCheckpoint | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const startDate = useMemo(
    () => planStartDate.toISOString().split("T")[0],
    [planStartDate]
  );
  const dayNumber = planDayNumber(startDate, today);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const checkpoints = await progressPhotosService.listCheckpoints(userId);
      setExisting(checkpoints);
      const entries = await Promise.all(
        checkpoints.map(async (cp) => [cp, await progressPhotosService.getPhotoUrl(userId, cp)] as const)
      );
      const next: Partial<Record<PhotoCheckpoint, string>> = {};
      for (const [cp, url] of entries) {
        if (url) next[cp] = url;
      }
      setUrls(next);
    } catch (err) {
      console.error("[ProgressPhotos] Error loading photos:", err);
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Prompts: due checkpoints without a photo, minus session dismissals.
  const prompts: CheckpointDef[] = useMemo(() => {
    if (!loaded) return [];
    return dueCheckpoints(dayNumber).filter(
      (cp) => !existing.includes(cp.key) && !dismissed.includes(cp.key)
    );
  }, [loaded, dayNumber, existing, dismissed]);

  const openCapture = (checkpoint: PhotoCheckpoint) => {
    pendingCheckpointRef.current = checkpoint;
    fileInputRef.current?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const checkpoint = pendingCheckpointRef.current;
    event.target.value = ""; // allow re-selecting the same file
    if (!file || !checkpoint || !userId) return;

    setError(null);
    setUploading(checkpoint);
    try {
      const ok = await progressPhotosService.uploadPhoto(userId, checkpoint, file);
      if (!ok) {
        setError("No se pudo subir la foto. Intenta de nuevo.");
        return;
      }
      await refresh();
    } finally {
      setUploading(null);
    }
  };

  // Compare pair: day 1 vs the latest existing checkpoint.
  const comparePair = useMemo(() => {
    if (existing.length < 2 || !urls.dia1) return null;
    const withPhotos = PHOTO_CHECKPOINTS.filter((cp) => existing.includes(cp.key));
    const latest = withPhotos[withPhotos.length - 1];
    if (latest.key === "dia1" || !urls[latest.key]) return null;
    return { day1Url: urls.dia1, latest, latestUrl: urls[latest.key]! };
  }, [existing, urls]);

  const handleShare = async () => {
    if (!comparePair || !userId || sharing) return;
    setSharing(true);
    setError(null);
    try {
      const blob = await generateShareCard({
        day1Url: comparePair.day1Url,
        latestUrl: comparePair.latestUrl,
        latestLabel: `DIA ${comparePair.latest.day}`,
        title: `${comparePair.latest.day} DIAS`,
        userId,
      });
      await shareOrDownload(blob);
      track("share_card_generated");
    } catch (err) {
      console.error("[ProgressPhotos] Share card failed:", err);
      setError("No se pudo generar la tarjeta. Intenta de nuevo.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="progress-photos-section">
      {/* Hidden capture input shared by all prompt cards */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Guided moment prompt cards */}
      {prompts.map((cp) => (
        <div
          key={cp.key}
          data-testid={`photo-prompt-${cp.key}`}
          className="flex items-center justify-between gap-4 bg-gradient-to-r from-accent-cyan/15 to-transparent border border-accent-cyan/40 rounded-2xl p-5"
        >
          <div className="flex items-center gap-4 min-w-0">
            <Camera className="w-8 h-8 text-accent-cyan shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="font-display text-3xl tracking-widest text-accent-cyan leading-none">
                {cp.label}
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Captura tu progreso. Solo tu puedes ver estas fotos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openCapture(cp.key)}
              disabled={uploading !== null}
              className="min-h-11 px-4 rounded-xl bg-accent-cyan text-black font-bold text-sm hover:shadow-lg hover:shadow-accent-cyan/40 transition-all disabled:opacity-60"
            >
              {uploading === cp.key ? "Subiendo..." : "Tomar foto"}
            </button>
            <button
              type="button"
              onClick={() => setDismissed((prev) => [...prev, cp.key])}
              aria-label={`Descartar ${cp.label}`}
              className="text-gray-500 hover:text-white transition-colors p-2"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Mi transformacion: side-by-side compare + share card */}
      {comparePair && (
        <div
          data-testid="transformation-compare"
          className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-3xl tracking-widest text-white leading-none">
              MI TRANSFORMACION
            </h3>
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="min-h-11 inline-flex items-center gap-2 px-4 rounded-xl bg-accent-cyan text-black font-bold text-sm hover:shadow-lg hover:shadow-accent-cyan/40 transition-all disabled:opacity-60"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              {sharing ? "Generando..." : "Compartir"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <figure>
              {/* Static export: plain <img> with signed URL (private bucket) */}
              <img
                src={comparePair.day1Url}
                alt="Foto de progreso dia 1"
                className="w-full aspect-[2/3] object-cover rounded-xl ring-1 ring-white/10"
              />
              <figcaption className="text-center font-display text-xl tracking-widest text-gray-400 mt-2">
                DIA 1
              </figcaption>
            </figure>
            <figure>
              <img
                src={comparePair.latestUrl}
                alt={`Foto de progreso dia ${comparePair.latest.day}`}
                className="w-full aspect-[2/3] object-cover rounded-xl ring-1 ring-accent-cyan/40"
              />
              <figcaption className="text-center font-display text-xl tracking-widest text-accent-cyan mt-2">
                DIA {comparePair.latest.day}
              </figcaption>
            </figure>
          </div>
        </div>
      )}
    </div>
  );
}
