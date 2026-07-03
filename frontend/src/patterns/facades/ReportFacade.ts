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
    const coords = ReportAdapter.toCoords(position);
    const locationText = ReportAdapter.toLocationText(position);

    // Call the backend to perform report registration and AI evaluation
    const backendResponse = await apiRequest<any>("/api/reports", {
      method: "POST",
      token,
      body: {
        userName: user.name,
        userEmail: user.email,
        title: "Bache reportado por ciudadano",
        description: description || "Sin descripción",
        location: locationText,
        latitude: coords.lat,
        longitude: coords.lng,
        category: "bache",
        priority: "media",
        images: imageUrl ? [imageUrl] : []
      }
    });

    const reportData = backendResponse.report || {};

    // Translate backend status to frontend status options
    let status: PotholeReport["status"] = "Recibido";
    if (reportData.status === "reportado") status = "Recibido";
    else if (reportData.status === "asignado") status = "En revisión";
    else if (reportData.status === "en_progreso") status = "En proceso";
    else if (reportData.status === "resuelto") status = "Resuelto";

    // Build the report object with the real AI results
    const report = new PotholeReportBuilder()
      .setUserId(user.id)
      .setDescription(description)
      .setImage(imageUrl)
      .setLocation(locationText, "Ubicación detectada", coords)
      .setAnalysis(reportData.severity || "No determinada", reportData.confidence || 0)
      .build();

    // Map backend properties directly
    report.id = reportData.id;
    report.status = status;
    report.createdAt = reportData.createdAt || new Date().toISOString();

    setPendingReport(report);

    return report;
  }
}