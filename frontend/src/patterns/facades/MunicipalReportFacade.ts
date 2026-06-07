import {
  addMunicipalNote,
  getStoredReports,
  updateReportStatus,
  type PotholeReport,
  type ReportStatus
} from "../../utils/reportStorage";

export type MunicipalReportStats = {
  total: number;
  received: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  critical: number;
};

export const MUNICIPAL_STATUS_OPTIONS: ReportStatus[] = [
  "Recibido",
  "En proceso",
  "Resuelto",
  "Rechazado"
];

export class MunicipalReportFacade {
  static listReports(): PotholeReport[] {
    return getStoredReports().sort(
      (firstReport, secondReport) =>
        new Date(secondReport.createdAt).getTime() -
        new Date(firstReport.createdAt).getTime()
    );
  }

  static calculateStats(reports: PotholeReport[]): MunicipalReportStats {
    return {
      total: reports.length,
      received: reports.filter((report) => report.status === "Recibido").length,
      inProgress: reports.filter(
        (report) =>
          report.status === "En proceso" || report.status === "En revisión"
      ).length,
      resolved: reports.filter((report) => report.status === "Resuelto").length,
      rejected: reports.filter((report) => report.status === "Rechazado").length,
      critical: reports.filter((report) => report.severity === "Crítico").length
    };
  }

  static changeStatus(
    reportId: string,
    status: ReportStatus
  ): PotholeReport[] {
    return updateReportStatus(reportId, status);
  }

  static saveMunicipalNote(
    reportId: string,
    note: string
  ): PotholeReport[] {
    return addMunicipalNote(reportId, note);
  }
}
