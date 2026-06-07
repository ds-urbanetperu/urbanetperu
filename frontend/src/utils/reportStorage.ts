export type ReportSeverity = "Leve" | "Moderado" | "Crítico" | "No determinada";

export type ReportStatus =
  | "Recibido"
  | "En revisión"
  | "En proceso"
  | "Resuelto"
  | "Rechazado";

export type ReportCoords = {
  x: number;
  y: number;
  lat: number;
  lng: number;
};

export type PotholeReport = {
  id: string;
  type: "Bache";
  description: string;
  imageUrl: string;
  address: string;
  distrito: string;
  coords: ReportCoords;
  severity: ReportSeverity;
  confidence: number;
  status: ReportStatus;
  createdAt: string;
  municipalNote?: string;
  municipalNoteUpdatedAt?: string;
  statusUpdatedAt?: string;
};

const REPORTS_KEY = "urbanet_reports";
const PENDING_REPORT_KEY = "urbanet_pending_report";
const LAST_REPORT_KEY = "urbanet_last_report";

function readReport(key: string): PotholeReport | null {
  const rawReport = localStorage.getItem(key);

  if (!rawReport) {
    return null;
  }

  try {
    return JSON.parse(rawReport) as PotholeReport;
  } catch {
    return null;
  }
}

function syncSingleReportCache(report: PotholeReport) {
  const lastReport = getLastReport();

  if (lastReport?.id === report.id) {
    localStorage.setItem(LAST_REPORT_KEY, JSON.stringify(report));
  }

  const pendingReport = getPendingReport();

  if (pendingReport?.id === report.id) {
    localStorage.setItem(PENDING_REPORT_KEY, JSON.stringify(report));
  }
}

function persistReports(reports: PotholeReport[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function getStoredReports(): PotholeReport[] {
  const rawReports = localStorage.getItem(REPORTS_KEY);

  if (!rawReports) {
    return [];
  }

  try {
    return JSON.parse(rawReports) as PotholeReport[];
  } catch {
    return [];
  }
}

export function saveReport(report: PotholeReport): PotholeReport[] {
  const reports = getStoredReports();
  const updatedReports = [report, ...reports];

  persistReports(updatedReports);
  localStorage.setItem(LAST_REPORT_KEY, JSON.stringify(report));
  localStorage.removeItem(PENDING_REPORT_KEY);

  return updatedReports;
}

export function setPendingReport(report: PotholeReport) {
  localStorage.setItem(PENDING_REPORT_KEY, JSON.stringify(report));
}

export function getPendingReport(): PotholeReport | null {
  return readReport(PENDING_REPORT_KEY);
}

export function getLastReport(): PotholeReport | null {
  return readReport(LAST_REPORT_KEY);
}

export function updateReportStatus(
  reportId: string,
  status: ReportStatus
): PotholeReport[] {
  const reports = getStoredReports();
  let updatedReport: PotholeReport | null = null;

  const updatedReports = reports.map((report) => {
    if (report.id !== reportId) {
      return report;
    }

    updatedReport = {
      ...report,
      status,
      statusUpdatedAt: new Date().toISOString()
    };

    return updatedReport;
  });

  persistReports(updatedReports);

  if (updatedReport) {
    syncSingleReportCache(updatedReport);
  }

  return updatedReports;
}

export function addMunicipalNote(
  reportId: string,
  note: string
): PotholeReport[] {
  const reports = getStoredReports();
  const normalizedNote = note.trim();
  let updatedReport: PotholeReport | null = null;

  const updatedReports = reports.map((report) => {
    if (report.id !== reportId) {
      return report;
    }

    updatedReport = {
      ...report,
      municipalNote: normalizedNote,
      municipalNoteUpdatedAt: new Date().toISOString()
    };

    return updatedReport;
  });

  persistReports(updatedReports);

  if (updatedReport) {
    syncSingleReportCache(updatedReport);
  }

  return updatedReports;
}

export function generateReportId() {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `URB-2026-${randomNumber}`;
}

export function getRandomSeverity(): {
  severity: ReportSeverity;
  confidence: number;
} {
  const options: ReportSeverity[] = [
    "Leve",
    "Moderado",
    "Crítico",
    "No determinada"
  ];

  const severity = options[Math.floor(Math.random() * options.length)];

  const confidence =
    severity === "No determinada"
      ? Number((0.42 + Math.random() * 0.17).toFixed(2))
      : Number((0.72 + Math.random() * 0.22).toFixed(2));

  return {
    severity,
    confidence
  };
}
