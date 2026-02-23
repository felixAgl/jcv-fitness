import { generateAssessmentBuffer } from "./generate-spreadsheet";

const FILENAME = "JCV-Fitness-Evaluacion-Fisica.xlsx";
const MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Generates the assessment spreadsheet and triggers a browser download.
 *
 * This runs entirely client-side -- no API route required.
 * Safe to call from onClick handlers in static-exported Next.js apps.
 */
export async function downloadAssessmentSpreadsheet(): Promise<void> {
  const buffer = await generateAssessmentBuffer();
  const blob = new Blob([buffer], { type: MIME_TYPE });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = FILENAME;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
