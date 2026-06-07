import { apiRequest } from "../../utils/api";
import {
  getRandomSeverity,
  setPendingReport,
  type PotholeReport
} from "../../utils/reportStorage";
import {
  ReportAdapter,
  type GeoPosition,
  type ReportUserData
} from "../adapters/ReportAdapter";
import { PotholeReportBuilder } from "../builders/PotholeReportBuilder";

type CreatePotholeReportParams = {
  description: string;
  imageUrl: string;
  position: GeoPosition;
  token: string;
  user: ReportUserData;
};

export class ReportFacade {
  static async createPotholeReport({
    description,
    imageUrl,
    position,
    token,
    user
  }: CreatePotholeReportParams): Promise<PotholeReport> {
    const aiResult = getRandomSeverity();

    const coords = ReportAdapter.toCoords(position);
    const locationText = ReportAdapter.toLocationText(position);

    const report = new PotholeReportBuilder()
      .setDescription(description)
      .setImage(imageUrl)
      .setLocation(locationText, "Ubicación detectada", coords)
      .setAnalysis(aiResult.severity, aiResult.confidence)
      .build();

    await apiRequest("/api/reports", {
      method: "POST",
      token,
      body: ReportAdapter.toBackendPayload(report, user)
    });

    setPendingReport(report);

    return report;
  }
}