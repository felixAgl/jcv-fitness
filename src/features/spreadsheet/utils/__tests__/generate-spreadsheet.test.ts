import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { generateAssessmentSpreadsheet } from "../generate-spreadsheet";

describe("generateAssessmentSpreadsheet", () => {
  it("generates a valid workbook", async () => {
    const wb = await generateAssessmentSpreadsheet();

    expect(wb).toBeInstanceOf(ExcelJS.Workbook);
    expect(wb.creator).toBe("JCV 24 Fitness");
  });

  it("has exactly 5 sheets", async () => {
    const wb = await generateAssessmentSpreadsheet();

    expect(wb.worksheets).toHaveLength(5);
  });

  it("has correct sheet names in order", async () => {
    const wb = await generateAssessmentSpreadsheet();

    const sheetNames = wb.worksheets.map((ws) => ws.name);

    expect(sheetNames).toEqual([
      "Datos del Cliente",
      "Anamnesis",
      "Evaluacion Antropometrica",
      "Composicion Corporal",
      "Seguimiento",
    ]);
  });

  describe("Datos del Cliente sheet", () => {
    it("has brand header in row 1", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Datos del Cliente")!;

      const header = ws.getCell("A1").value;
      expect(header).toBe("JCV 24 FITNESS - Evaluacion Fisica");
    });

    it("has expected client data labels", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Datos del Cliente")!;

      const expectedLabels = [
        "Nombre completo",
        "Edad",
        "Sexo",
        "Telefono",
        "Email",
        "Objetivo",
        "Fecha de evaluacion",
      ];

      for (const label of expectedLabels) {
        let found = false;
        ws.eachRow((row) => {
          row.eachCell((cell) => {
            if (cell.value === label) found = true;
          });
        });
        expect(found, `Label "${label}" should exist in sheet`).toBe(true);
      }
    });

    it("has frozen panes", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Datos del Cliente")!;

      expect(ws.views).toBeDefined();
      expect(ws.views.length).toBeGreaterThan(0);
      expect(ws.views[0].state).toBe("frozen");
    });
  });

  describe("Anamnesis sheet", () => {
    it("has health history labels", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Anamnesis")!;

      const expectedLabels = [
        "Antecedentes medicos",
        "Lesiones previas",
        "Medicamentos actuales",
        "Alergias alimentarias",
        "Nivel de actividad fisica actual",
        "Horas de sueno promedio",
      ];

      for (const label of expectedLabels) {
        let found = false;
        ws.eachRow((row) => {
          row.eachCell((cell) => {
            if (cell.value === label) found = true;
          });
        });
        expect(found, `Label "${label}" should exist in Anamnesis`).toBe(
          true
        );
      }
    });
  });

  describe("Evaluacion Antropometrica sheet", () => {
    it("has IMC formula in the correct cell", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Evaluacion Antropometrica")!;

      // Row 6, col B should have the IMC formula
      const imcCell = ws.getCell("B6");
      const cellValue = imcCell.value as ExcelJS.CellFormulaValue;

      expect(cellValue).toBeDefined();
      expect(cellValue.formula).toContain("B4");
      expect(cellValue.formula).toContain("B5");
      // IMC = weight / (height_m)^2
      expect(cellValue.formula).toContain("100");
    });

    it("has IMC classification formula", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Evaluacion Antropometrica")!;

      const clasCell = ws.getCell("B7");
      const cellValue = clasCell.value as ExcelJS.CellFormulaValue;

      expect(cellValue).toBeDefined();
      expect(cellValue.formula).toContain("Bajo peso");
      expect(cellValue.formula).toContain("Normal");
      expect(cellValue.formula).toContain("Sobrepeso");
      expect(cellValue.formula).toContain("Obesidad");
    });

    it("has circumference measurement rows", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Evaluacion Antropometrica")!;

      const circumferences = [
        "Cuello",
        "Pecho",
        "Cintura",
        "Cadera",
        "Brazo Derecho",
        "Brazo Izquierdo",
        "Muslo Derecho",
        "Muslo Izquierdo",
        "Pantorrilla Derecha",
        "Pantorrilla Izquierda",
      ];

      for (const name of circumferences) {
        let found = false;
        ws.eachRow((row) => {
          row.eachCell((cell) => {
            if (cell.value === name) found = true;
          });
        });
        expect(found, `Circumference "${name}" should exist`).toBe(true);
      }
    });

    it("has section titles", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Evaluacion Antropometrica")!;

      let hasMedidasBasicas = false;
      let hasCircunferencias = false;

      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (cell.value === "Medidas Basicas") hasMedidasBasicas = true;
          if (cell.value === "Circunferencias (cm)")
            hasCircunferencias = true;
        });
      });

      expect(hasMedidasBasicas).toBe(true);
      expect(hasCircunferencias).toBe(true);
    });
  });

  describe("Composicion Corporal sheet", () => {
    it("has Pollock 7 folds section", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Composicion Corporal")!;

      let hasPollock = false;
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (
            typeof cell.value === "string" &&
            cell.value.includes("Pollock 7 Pliegues")
          ) {
            hasPollock = true;
          }
        });
      });

      expect(hasPollock).toBe(true);
    });

    it("has skin fold measurement rows", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Composicion Corporal")!;

      const folds = [
        "Pectoral",
        "Axilar medio",
        "Tricipital",
        "Subescapular",
        "Abdominal",
        "Suprailiaco",
        "Muslo",
      ];

      for (const fold of folds) {
        let found = false;
        ws.eachRow((row) => {
          row.eachCell((cell) => {
            if (cell.value === fold) found = true;
          });
        });
        expect(found, `Fold "${fold}" should exist`).toBe(true);
      }
    });

    it("has body density formula (Jackson-Pollock)", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Composicion Corporal")!;

      const densityCell = ws.getCell("B20");
      const cellValue = densityCell.value as ExcelJS.CellFormulaValue;

      expect(cellValue).toBeDefined();
      expect(cellValue.formula).toBeDefined();
      // Male coefficient
      expect(cellValue.formula).toContain("1.112");
      // Female coefficient
      expect(cellValue.formula).toContain("1.097");
    });

    it("has body fat percentage formula (Siri equation)", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Composicion Corporal")!;

      const fatCell = ws.getCell("B21");
      const cellValue = fatCell.value as ExcelJS.CellFormulaValue;

      expect(cellValue).toBeDefined();
      expect(cellValue.formula).toBeDefined();
      // Siri: (495/DC) - 450
      expect(cellValue.formula).toContain("495");
      expect(cellValue.formula).toContain("450");
    });

    it("has fat mass and lean mass formulas", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Composicion Corporal")!;

      // Row 22: Masa grasa
      const fatMassCell = ws.getCell("B22");
      const fatMassValue = fatMassCell.value as ExcelJS.CellFormulaValue;
      expect(fatMassValue.formula).toBeDefined();

      // Row 23: Masa magra
      const leanMassCell = ws.getCell("B23");
      const leanMassValue = leanMassCell.value as ExcelJS.CellFormulaValue;
      expect(leanMassValue.formula).toBeDefined();
    });
  });

  describe("Seguimiento sheet", () => {
    it("has 12 pre-formatted data rows for monthly tracking", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Seguimiento")!;

      // Header row is row 3, data starts at row 4
      // 12 rows: rows 4..15
      let dataRowCount = 0;

      for (let r = 4; r <= 15; r++) {
        const cell = ws.getCell(r, 1);
        // Check the cell has border (formatted row)
        if (cell.border && cell.border.top) {
          dataRowCount++;
        }
      }

      expect(dataRowCount).toBe(12);
    });

    it("has correct tracking column headers", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Seguimiento")!;

      const expectedHeaders = [
        "Fecha",
        "Peso (kg)",
        "% Grasa",
        "Masa Magra (kg)",
        "Masa Grasa (kg)",
        "Cintura (cm)",
        "Cadera (cm)",
        "Observaciones",
      ];

      // Header row is row 3
      const headerRow = ws.getRow(3);
      const actualHeaders: string[] = [];

      headerRow.eachCell((cell) => {
        if (cell.value) {
          actualHeaders.push(String(cell.value));
        }
      });

      expect(actualHeaders).toEqual(expectedHeaders);
    });

    it("has monthly tracking subtitle", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Seguimiento")!;

      let hasSubtitle = false;
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (
            typeof cell.value === "string" &&
            cell.value.includes("Seguimiento Mensual")
          ) {
            hasSubtitle = true;
          }
        });
      });

      expect(hasSubtitle).toBe(true);
    });

    it("has chart placeholder area", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const ws = wb.getWorksheet("Seguimiento")!;

      let hasChartArea = false;
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (
            typeof cell.value === "string" &&
            cell.value.includes("Graficos")
          ) {
            hasChartArea = true;
          }
        });
      });

      expect(hasChartArea).toBe(true);
    });
  });

  describe("Workbook metadata", () => {
    it("sets creation dates", async () => {
      const wb = await generateAssessmentSpreadsheet();

      expect(wb.created).toBeInstanceOf(Date);
      expect(wb.modified).toBeInstanceOf(Date);
    });

    it("can be serialized to buffer", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const buffer = await wb.xlsx.writeBuffer();

      expect(buffer).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it("can be read back from buffer", async () => {
      const wb = await generateAssessmentSpreadsheet();
      const buffer = await wb.xlsx.writeBuffer();

      // Read it back
      const wb2 = new ExcelJS.Workbook();
      await wb2.xlsx.load(buffer as Buffer);

      expect(wb2.worksheets).toHaveLength(5);
      expect(wb2.worksheets[0].name).toBe("Datos del Cliente");
    });
  });
});
