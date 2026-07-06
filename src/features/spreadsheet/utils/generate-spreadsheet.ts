import ExcelJS from "exceljs";

// ---------------------------------------------------------------------------
// Brand colours
// ---------------------------------------------------------------------------
const BRAND_DARK = "1a1a2e";
const BRAND_CYAN = "00d4ff";
const BRAND_LIGHT_BG = "f0f9ff";
const WHITE = "ffffff";

// ---------------------------------------------------------------------------
// Reusable style helpers
// ---------------------------------------------------------------------------
type WS = ExcelJS.Worksheet;

function headerFont(): Partial<ExcelJS.Font> {
  return { bold: true, color: { argb: WHITE }, size: 12, name: "Calibri" };
}

function subHeaderFont(): Partial<ExcelJS.Font> {
  return { bold: true, color: { argb: BRAND_DARK }, size: 11, name: "Calibri" };
}

function bodyFont(): Partial<ExcelJS.Font> {
  return { size: 11, name: "Calibri", color: { argb: "333333" } };
}

function headerFill(): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
}

function accentFill(): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_CYAN } };
}

function lightFill(): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_LIGHT_BG } };
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "cccccc" } };
  return { top: side, left: side, bottom: side, right: side };
}

/** Apply header row styling to a specific row number. */
function styleHeaderRow(ws: WS, rowNum: number, colCount: number): void {
  const row = ws.getRow(rowNum);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = headerFont();
    cell.fill = headerFill();
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder();
  }
  row.height = 28;
}

/** Apply a label + input pair style (label in col A, input in col B). */
function addLabelRow(
  ws: WS,
  rowNum: number,
  label: string,
  defaultValue: string | number | null = null,
  options?: {
    numFmt?: string;
    formula?: string;
    validation?: ExcelJS.DataValidation;
  },
): void {
  const labelCell = ws.getCell(`A${rowNum}`);
  labelCell.value = label;
  labelCell.font = subHeaderFont();
  labelCell.fill = lightFill();
  labelCell.border = thinBorder();
  labelCell.alignment = { vertical: "middle" };

  const valueCell = ws.getCell(`B${rowNum}`);
  if (options?.formula) {
    valueCell.value = { formula: options.formula } as ExcelJS.CellFormulaValue;
  } else if (defaultValue !== null) {
    valueCell.value = defaultValue;
  }
  valueCell.font = bodyFont();
  valueCell.border = thinBorder();
  valueCell.alignment = { vertical: "middle", horizontal: "center" };

  if (options?.numFmt) {
    valueCell.numFmt = options.numFmt;
  }
  if (options?.validation) {
    valueCell.dataValidation = options.validation;
  }
}

function addSectionTitle(ws: WS, rowNum: number, title: string, colSpan: number): void {
  ws.mergeCells(rowNum, 1, rowNum, colSpan);
  const cell = ws.getCell(`A${rowNum}`);
  cell.value = title;
  cell.font = { bold: true, color: { argb: WHITE }, size: 13, name: "Calibri" };
  cell.fill = accentFill();
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.border = thinBorder();
  ws.getRow(rowNum).height = 30;
}

function addBrandHeader(ws: WS, colSpan: number): void {
  ws.mergeCells(1, 1, 1, colSpan);
  const cell = ws.getCell("A1");
  cell.value = "JCV 24 FITNESS - Evaluacion Fisica";
  cell.font = { bold: true, color: { argb: WHITE }, size: 16, name: "Calibri" };
  cell.fill = headerFill();
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.border = thinBorder();
  ws.getRow(1).height = 40;
}

// ---------------------------------------------------------------------------
// Data validation presets
// ---------------------------------------------------------------------------
function dropdownValidation(options: string[]): ExcelJS.DataValidation {
  return {
    type: "list",
    allowBlank: true,
    formulae: [`"${options.join(",")}"`],
    showErrorMessage: true,
    errorTitle: "Valor invalido",
    error: `Seleccione una opcion: ${options.join(", ")}`,
  };
}

function numberValidation(min: number, max: number, errorMsg: string): ExcelJS.DataValidation {
  return {
    type: "decimal",
    operator: "between",
    allowBlank: true,
    formulae: [min, max],
    showErrorMessage: true,
    errorTitle: "Valor fuera de rango",
    error: errorMsg,
  };
}

// ===========================================================================
// SHEET 1 - Datos del Cliente
// ===========================================================================
function buildClientDataSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet("Datos del Cliente", {
    properties: { tabColor: { argb: BRAND_DARK } },
  });

  ws.columns = [{ width: 32 }, { width: 40 }];

  addBrandHeader(ws, 2);

  const fields: [string, string | null, ReturnType<typeof dropdownValidation> | undefined][] = [
    ["Nombre completo", null, undefined],
    ["Edad", null, numberValidation(10, 120, "Ingrese una edad entre 10 y 120")],
    ["Sexo", null, dropdownValidation(["M", "F"])],
    ["Telefono", null, undefined],
    ["Email", null, undefined],
    [
      "Objetivo",
      null,
      dropdownValidation([
        "Perder grasa",
        "Ganar musculo",
        "Mantenimiento",
        "Rendimiento deportivo",
      ]),
    ],
    ["Fecha de evaluacion", null, undefined],
  ];

  let row = 3;
  for (const [label, defaultVal, validation] of fields) {
    addLabelRow(ws, row, label, defaultVal, { validation });
    row++;
  }

  // Date format for "Fecha de evaluacion"
  ws.getCell(`B9`).numFmt = "dd/mm/yyyy";

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2" }];
}

// ===========================================================================
// SHEET 2 - Anamnesis
// ===========================================================================
function buildAnamnesisSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet("Anamnesis", {
    properties: { tabColor: { argb: BRAND_CYAN } },
  });

  ws.columns = [{ width: 38 }, { width: 40 }];

  addBrandHeader(ws, 2);

  const fields: [
    string,
    string | number | null,
    { validation?: ExcelJS.DataValidation; numFmt?: string } | undefined,
  ][] = [
    ["Antecedentes medicos", null, undefined],
    ["Lesiones previas", null, undefined],
    ["Medicamentos actuales", null, undefined],
    ["Alergias alimentarias", null, undefined],
    [
      "Nivel de actividad fisica actual",
      null,
      { validation: dropdownValidation(["Sedentario", "Leve", "Moderado", "Intenso"]) },
    ],
    [
      "Horas de sueno promedio",
      null,
      { validation: numberValidation(1, 16, "Ingrese un valor entre 1 y 16 horas") },
    ],
    [
      "Nivel de estres (1-10)",
      null,
      { validation: numberValidation(1, 10, "Ingrese un valor entre 1 y 10") },
    ],
    [
      "Consumo de agua diario (litros)",
      null,
      {
        validation: numberValidation(0, 10, "Ingrese un valor entre 0 y 10 litros"),
        numFmt: "0.0",
      },
    ],
    ["Fumador", null, { validation: dropdownValidation(["Si", "No"]) }],
    [
      "Consumo de alcohol",
      null,
      { validation: dropdownValidation(["Nunca", "Ocasional", "Frecuente"]) },
    ],
  ];

  let row = 3;
  for (const [label, defaultVal, opts] of fields) {
    addLabelRow(ws, row, label, defaultVal, opts);
    row++;
  }

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2" }];
}

// ===========================================================================
// SHEET 3 - Evaluacion Antropometrica
// ===========================================================================
function buildAnthropometrySheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet("Evaluacion Antropometrica", {
    properties: { tabColor: { argb: BRAND_DARK } },
  });

  ws.columns = [{ width: 36 }, { width: 22 }];

  addBrandHeader(ws, 2);

  // -- Basic measurements --
  addSectionTitle(ws, 3, "Medidas Basicas", 2);

  // Row 4: Peso
  addLabelRow(ws, 4, "Peso (kg)", null, {
    numFmt: "0.0",
    validation: numberValidation(20, 300, "Ingrese un peso entre 20 y 300 kg"),
  });
  // Row 5: Talla
  addLabelRow(ws, 5, "Talla (cm)", null, {
    numFmt: "0.0",
    validation: numberValidation(100, 250, "Ingrese una talla entre 100 y 250 cm"),
  });
  // Row 6: IMC (formula)
  addLabelRow(ws, 6, "IMC", null, {
    formula: "IF(AND(B4<>\"\",B5<>\"\"),B4/(B5/100)^2,\"\")",
    numFmt: "0.00",
  });
  // Row 7: Clasificacion IMC (formula)
  addLabelRow(ws, 7, "Clasificacion IMC", null, {
    formula:
      'IF(B6="","",IF(B6<18.5,"Bajo peso",IF(B6<25,"Normal",IF(B6<30,"Sobrepeso",IF(B6<35,"Obesidad I",IF(B6<40,"Obesidad II","Obesidad III"))))))',
  });

  // -- Circunferencias --
  addSectionTitle(ws, 9, "Circunferencias (cm)", 2);

  const circumferences = [
    "Cuello",
    "Pecho",
    "Cintura",
    "Cadera",
    "Brazo Derecho",
    "Brazo Izquierdo",
    "Antebrazo Derecho",
    "Antebrazo Izquierdo",
    "Muslo Derecho",
    "Muslo Izquierdo",
    "Pantorrilla Derecha",
    "Pantorrilla Izquierda",
  ];

  let row = 10;
  for (const name of circumferences) {
    addLabelRow(ws, row, name, null, {
      numFmt: "0.0",
      validation: numberValidation(10, 200, `Ingrese un valor valido para ${name}`),
    });
    row++;
  }

  // Row after circumferences: Waist is at row 12 (Cintura), Hip at row 13 (Cadera)
  // Indice cintura-cadera
  const iccRow = row;
  addLabelRow(ws, iccRow, "Indice cintura-cadera", null, {
    formula: 'IF(AND(B12<>"",B13<>""),B12/B13,"")',
    numFmt: "0.00",
  });

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2" }];
}

// ===========================================================================
// SHEET 4 - Composicion Corporal
// ===========================================================================
function buildBodyCompositionSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet("Composicion Corporal", {
    properties: { tabColor: { argb: BRAND_CYAN } },
  });

  ws.columns = [{ width: 36 }, { width: 22 }];

  addBrandHeader(ws, 2);

  addSectionTitle(ws, 3, "Metodo: Pollock 7 Pliegues", 2);

  // Reference note
  const noteRow = 4;
  ws.mergeCells(noteRow, 1, noteRow, 2);
  const noteCell = ws.getCell(`A${noteRow}`);
  noteCell.value =
    "Ingrese el sexo (M/F) en la hoja 'Datos del Cliente' para el calculo correcto";
  noteCell.font = { italic: true, size: 10, name: "Calibri", color: { argb: "666666" } };
  noteCell.alignment = { horizontal: "center" };

  // -- Pliegues (folds) --
  addSectionTitle(ws, 6, "Pliegues Cutaneos (mm)", 2);

  const folds = [
    "Pectoral",
    "Axilar medio",
    "Tricipital",
    "Subescapular",
    "Abdominal",
    "Suprailiaco",
    "Muslo",
  ];

  let row = 7;
  for (const fold of folds) {
    addLabelRow(ws, row, fold, null, {
      numFmt: "0.0",
      validation: numberValidation(1, 80, `Ingrese un valor entre 1 y 80 mm para ${fold}`),
    });
    row++;
  }
  // Folds are at B7..B13

  // -- Calculated values --
  addSectionTitle(ws, 15, "Resultados Calculados", 2);

  // Row 16: Suma de pliegues
  addLabelRow(ws, 16, "Suma de pliegues (mm)", null, {
    formula: "IF(COUNTA(B7:B13)=7,SUM(B7:B13),\"\")",
    numFmt: "0.0",
  });

  // Row 17: Edad (referenced from Client Data sheet)
  addLabelRow(ws, 17, "Edad (ref. Datos del Cliente)", null, {
    formula: "'Datos del Cliente'!B4",
  });

  // Row 18: Sexo (referenced from Client Data sheet)
  addLabelRow(ws, 18, "Sexo (ref. Datos del Cliente)", null, {
    formula: "'Datos del Cliente'!B5",
  });

  // Row 19: Peso (referenced from Anthropometry sheet)
  addLabelRow(ws, 19, "Peso (ref. Evaluacion Antropometrica)", null, {
    formula: "'Evaluacion Antropometrica'!B4",
    numFmt: "0.0",
  });

  // Row 20: Densidad corporal (Jackson-Pollock 7-fold formula)
  // Male:   DC = 1.112 - 0.00043499*(sum) + 0.00000055*(sum^2) - 0.00028826*(age)
  // Female: DC = 1.097  - 0.00046971*(sum) + 0.00000056*(sum^2) - 0.00012828*(age)
  addLabelRow(ws, 20, "Densidad corporal (g/cc)", null, {
    formula:
      'IF(OR(B16="",B17="",B18=""),"",IF(B18="M",1.112-0.00043499*B16+0.00000055*B16^2-0.00028826*B17,1.097-0.00046971*B16+0.00000056*B16^2-0.00012828*B17))',
    numFmt: "0.0000",
  });

  // Row 21: % Grasa corporal (Siri equation)
  addLabelRow(ws, 21, "% Grasa corporal", null, {
    formula: 'IF(B20="","",(495/B20)-450)',
    numFmt: "0.00",
  });

  // Row 22: Masa grasa (kg)
  addLabelRow(ws, 22, "Masa grasa (kg)", null, {
    formula: 'IF(OR(B19="",B21=""),"",B19*B21/100)',
    numFmt: "0.00",
  });

  // Row 23: Masa magra (kg)
  addLabelRow(ws, 23, "Masa magra (kg)", null, {
    formula: 'IF(OR(B19="",B22=""),"",B19-B22)',
    numFmt: "0.00",
  });

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2" }];
}

// ===========================================================================
// SHEET 5 - Seguimiento
// ===========================================================================
function buildTrackingSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet("Seguimiento", {
    properties: { tabColor: { argb: BRAND_DARK } },
  });

  const columns = [
    "Fecha",
    "Peso (kg)",
    "% Grasa",
    "Masa Magra (kg)",
    "Masa Grasa (kg)",
    "Cintura (cm)",
    "Cadera (cm)",
    "Observaciones",
  ];

  ws.columns = [
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 40 },
  ];

  addBrandHeader(ws, columns.length);

  // Subtitle row
  addSectionTitle(ws, 2, "Seguimiento Mensual (12 meses)", columns.length);

  // Header row
  const headerRowNum = 3;
  columns.forEach((col, idx) => {
    const cell = ws.getCell(headerRowNum, idx + 1);
    cell.value = col;
  });
  styleHeaderRow(ws, headerRowNum, columns.length);

  // 12 data rows (pre-formatted)
  for (let i = 0; i < 12; i++) {
    const r = headerRowNum + 1 + i;
    for (let c = 1; c <= columns.length; c++) {
      const cell = ws.getCell(r, c);
      cell.border = thinBorder();
      cell.font = bodyFont();
      cell.alignment = { vertical: "middle", horizontal: "center" };

      // Apply number formats per column
      switch (c) {
        case 1: // Fecha
          cell.numFmt = "dd/mm/yyyy";
          break;
        case 2: // Peso
        case 4: // Masa Magra
        case 5: // Masa Grasa
        case 6: // Cintura
        case 7: // Cadera
          cell.numFmt = "0.0";
          break;
        case 3: // % Grasa
          cell.numFmt = "0.00";
          break;
      }
    }

    // Alternate row shading
    if (i % 2 === 0) {
      for (let c = 1; c <= columns.length; c++) {
        ws.getCell(r, c).fill = lightFill();
      }
    }
  }

  // Chart placeholder area
  const chartStartRow = headerRowNum + 14;
  addSectionTitle(ws, chartStartRow, "Area para Graficos (copie datos y genere graficos en Excel)", columns.length);

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 3, topLeftCell: "A4" }];
}

// ===========================================================================
// PUBLIC API
// ===========================================================================

/**
 * Generates a complete physical assessment Excel workbook with 5 sheets,
 * formulas, data validation, and JCV Fitness branding.
 *
 * Works both server-side (Node) and client-side (browser).
 */
export async function generateAssessmentSpreadsheet(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();

  wb.creator = "JCV 24 Fitness";
  wb.created = new Date();
  wb.modified = new Date();

  buildClientDataSheet(wb);
  buildAnamnesisSheet(wb);
  buildAnthropometrySheet(wb);
  buildBodyCompositionSheet(wb);
  buildTrackingSheet(wb);

  return wb;
}

/**
 * Generates the workbook and returns it as a Uint8Array backed by a plain
 * ArrayBuffer. This satisfies TS 5.9 strict generics for Blob / Response.
 */
export async function generateAssessmentBuffer(): Promise<Uint8Array<ArrayBuffer>> {
  const wb = await generateAssessmentSpreadsheet();
  const raw = await wb.xlsx.writeBuffer();

  // ExcelJS writeBuffer returns Buffer (Node) or ArrayBuffer (browser).
  // We always copy into a fresh ArrayBuffer so the result is Uint8Array<ArrayBuffer>.
  let source: Uint8Array;
  if (raw instanceof ArrayBuffer) {
    source = new Uint8Array(raw);
  } else {
    // Node Buffer -- extract the relevant slice
    const buf = raw as Buffer;
    source = new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }

  // Copy into a guaranteed-own ArrayBuffer
  const owned = new ArrayBuffer(source.byteLength);
  const result = new Uint8Array(owned);
  result.set(source);
  return result;
}
