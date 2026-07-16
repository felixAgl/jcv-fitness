// Types
export * from "./types";

// Services
export { planService } from "./services/plan-service";
export { progressService } from "./services/progress-service";
export { generatePhase2Preview, PHASE2_DURATION_DAYS } from "./services/phase2";
export type { Phase2Preview, Phase2Input } from "./services/phase2";
export { computeStreak } from "./services/streak";
export type { StreakOptions, StreakResult } from "./services/streak";
export {
  workoutLogService,
  upsertSet,
  getLogsForExercise,
  getLastSessionFor,
  detectPR,
  epley1RM,
  getSessionMaxes,
  buildSparklinePoints,
} from "./services/workout-log";
export type { PRResult, LastSession, SessionMax } from "./services/workout-log";
export {
  progressPhotosService,
  PHOTO_CHECKPOINTS,
  planDayNumber,
  dueCheckpoints,
} from "./services/progress-photos";
export type { PhotoCheckpoint, CheckpointDef } from "./services/progress-photos";
export type {
  CreatePlanResult,
  GetActivePlanResult,
  CanCreatePlanResponse,
} from "./services/plan-service";

// Hooks
export { usePlan } from "./hooks/usePlan";
export { useWorkoutLog } from "./hooks/useWorkoutLog";

// Components
export { PlanViewer } from "./components/PlanViewer";
export { ExerciseMediaThumb } from "./components/ExerciseMediaThumb";
export { ExerciseDetailModal } from "./components/ExerciseDetailModal";
export { PlanExpiredOverlay } from "./components/PlanExpiredOverlay";
export { PlanStatusCard } from "./components/PlanStatusCard";
export { Phase2Card } from "./components/Phase2Card";
export { TrackingCalendar } from "./components/TrackingCalendar";
export { ExerciseLogSection } from "./components/ExerciseLogSection";
export { ProgressPhotosSection } from "./components/ProgressPhotosSection";

// Utils
export {
  generateShareCard,
  shareOrDownload,
  drawShareCard,
  computeShareCardLayout,
  coverCrop,
  referralCodeFrom,
} from "./utils/share-card";
export type { ShareCardLayout, ShareCardOptions } from "./utils/share-card";
