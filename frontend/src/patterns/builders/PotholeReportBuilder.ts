import {
  generateReportId,
  type PotholeReport,
  type ReportCoords
} from "../../utils/reportStorage";

export class PotholeReportBuilder {
  private report: Partial<PotholeReport>;

  constructor() {
    this.report = {
      id: generateReportId(),
      type: "Bache",
      status: "Recibido",
      createdAt: new Date().toISOString()
    };
  }

  setDescription(description: string): PotholeReportBuilder {
    this.report.description = description;
    return this;
  }

  setImage(imageUrl: string): PotholeReportBuilder {
    this.report.imageUrl = imageUrl;
    return this;
  }

  setLocation(
    address: string,
    distrito: string,
    coords: ReportCoords
  ): PotholeReportBuilder {
    this.report.address = address;
    this.report.distrito = distrito;
    this.report.coords = coords;
    return this;
  }

  setAnalysis(
    severity: PotholeReport["severity"],
    confidence: number
  ): PotholeReportBuilder {
    this.report.severity = severity;
    this.report.confidence = confidence;
    return this;
  }

  build(): PotholeReport {
    if (!this.report.description && this.report.description !== "") {
      throw new Error("La descripción del reporte no fue definida.");
    }

    if (!this.report.imageUrl) {
      throw new Error("La imagen del reporte no fue definida.");
    }

    if (!this.report.address) {
      throw new Error("La dirección o ubicación del reporte no fue definida.");
    }

    if (!this.report.distrito) {
      throw new Error("El distrito del reporte no fue definido.");
    }

    if (!this.report.coords) {
      throw new Error("Las coordenadas del reporte no fueron definidas.");
    }

    if (!this.report.severity) {
      throw new Error("La severidad del reporte no fue definida.");
    }

    if (this.report.confidence === undefined) {
      throw new Error("La confianza del análisis no fue definida.");
    }

    return this.report as PotholeReport;
  }
}