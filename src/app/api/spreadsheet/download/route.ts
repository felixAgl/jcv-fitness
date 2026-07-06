/**
 * API Route: GET /api/spreadsheet/download
 *
 * Pre-generates the JCV Fitness physical assessment spreadsheet at build time
 * and serves it as a static .xlsx file.
 *
 * With `output: "export"`, this route runs ONLY during `next build`.
 * The result is cached as a static asset. For on-demand generation in the
 * browser, use `downloadAssessmentSpreadsheet()` from `@/features/spreadsheet`.
 */
import { generateAssessmentBuffer } from "@/features/spreadsheet/utils/generate-spreadsheet";

export const dynamic = "force-static";

const FILENAME = "JCV-Fitness-Evaluacion-Fisica.xlsx";
const MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(): Promise<Response> {
  const bytes = await generateAssessmentBuffer();
  const blob = new Blob([bytes], { type: MIME_TYPE });

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": MIME_TYPE,
      "Content-Disposition": `attachment; filename="${FILENAME}"`,
    },
  });
}
