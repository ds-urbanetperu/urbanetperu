import type {
  PotholeReport,
  ReportCoords
} from "../../utils/reportStorage";

export type GeoPosition = {
  lat: number;
  lng: number;
};

export type ReportUserData = {
  id: string;
  name: string;
  email: string;
};

export type ReportBackendPayload = {
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  priority: string;
  images: string[];
  userName: string;
  userEmail: string;
};

export class ReportAdapter {
  static toCoords(position: GeoPosition): ReportCoords {
    return {
      x: 0,
      y: 0,
      lat: position.lat,
      lng: position.lng
    };
  }

  static toLocationText(position: GeoPosition): string {
    return `Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`;
  }

  static toBackendPayload(
    report: PotholeReport,
    user: ReportUserData
  ): ReportBackendPayload {
    return {
      title: "Bache reportado por ciudadano",
      description: report.description || "Sin descripción",
      location: report.address,
      latitude: report.coords.lat,
      longitude: report.coords.lng,
      category: "bache",
      priority: report.severity === "Crítico" ? "alta" : "media",
      images: report.imageUrl ? [report.imageUrl] : [],
      userName: user.name,
      userEmail: user.email
    };
  }
}