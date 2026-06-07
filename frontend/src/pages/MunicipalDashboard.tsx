import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageSlot from "../components/common/ImageSlot";
import SeverityBadge from "../components/common/SeverityBadge";
import { assets } from "../config/assets";
import {
  MUNICIPAL_STATUS_OPTIONS,
  MunicipalReportFacade
} from "../patterns/facades/MunicipalReportFacade";
import { clearSession, getSessionUser } from "../utils/authStorage";
import type { PotholeReport, ReportStatus } from "../utils/reportStorage";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function getInitialNoteDrafts(reports: PotholeReport[]) {
  return reports.reduce<Record<string, string>>((drafts, report) => {
    drafts[report.id] = report.municipalNote ?? "";
    return drafts;
  }, {});
}

function MunicipalDashboard() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [activeStatus, setActiveStatus] = useState<"Todos" | ReportStatus>(
    "Todos"
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const sessionUser = getSessionUser();

    if (!sessionUser || sessionUser.role !== "municipal") {
      navigate("/login", { replace: true });
      return;
    }

    const storedReports = MunicipalReportFacade.listReports();
    setReports(storedReports);
    setNoteDrafts(getInitialNoteDrafts(storedReports));
  }, [navigate]);

  const sessionUser = getSessionUser();
  const stats = useMemo(
    () => MunicipalReportFacade.calculateStats(reports),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus =
        activeStatus === "Todos" || report.status === activeStatus;

      const matchesSearch =
        !normalizedSearch ||
        report.id.toLowerCase().includes(normalizedSearch) ||
        report.address.toLowerCase().includes(normalizedSearch) ||
        report.distrito.toLowerCase().includes(normalizedSearch) ||
        report.severity.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, reports, searchTerm]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleStatusChange = (reportId: string, status: ReportStatus) => {
    const updatedReports = MunicipalReportFacade.changeStatus(reportId, status);
    setReports(updatedReports);
  };

  const handleNoteChange = (reportId: string, value: string) => {
    setNoteDrafts((currentDrafts) => ({
      ...currentDrafts,
      [reportId]: value
    }));
  };

  const handleSaveNote = (reportId: string) => {
    const note = noteDrafts[reportId]?.trim();

    if (!note) {
      return;
    }

    const updatedReports = MunicipalReportFacade.saveMunicipalNote(
      reportId,
      note
    );

    setReports(updatedReports);
  };

  return (
    <main className="municipal-page">
      <header className="municipal-header">
        <div className="municipal-header__brand">
          <ImageSlot
            src={assets.appLogo}
            alt="UrbanetPeru"
            fallbackText="UP"
            className="municipal-header__logo"
          />

          <strong>
            Urbanet<span>Peru</span>
          </strong>
        </div>

        <div className="municipal-header__actions">
          <span>{sessionUser?.name || "Municipalidad"}</span>

          <button type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="municipal-content">
        <section className="municipal-hero">
          <div>
            <p>Panel municipal</p>
            <h1>Gestión de reportes ciudadanos</h1>
            <span>
              Revisa las incidencias registradas por los vecinos, actualiza su
              estado y agrega notas de seguimiento municipal.
            </span>
          </div>

          <button type="button" onClick={() => navigate("/login")}>
            Ir al login
          </button>
        </section>

        <section className="municipal-stats" aria-label="Resumen municipal">
          <article>
            <span>Total de reportes</span>
            <strong>{stats.total}</strong>
          </article>

          <article>
            <span>Recibidos</span>
            <strong>{stats.received}</strong>
          </article>

          <article>
            <span>En proceso</span>
            <strong>{stats.inProgress}</strong>
          </article>

          <article>
            <span>Resueltos</span>
            <strong>{stats.resolved}</strong>
          </article>
        </section>

        <section className="municipal-secondary-stats">
          <article>
            <span>Críticos</span>
            <strong>{stats.critical}</strong>
          </article>

          <article>
            <span>Rechazados</span>
            <strong>{stats.rejected}</strong>
          </article>
        </section>

        {reports.length === 0 ? (
          <section className="municipal-empty">
            <div>UP</div>
            <h2>No hay reportes ciudadanos registrados</h2>
            <p>
              Cuando un vecino registre un reporte de bache, aparecerá en este
              panel municipal para su revisión y seguimiento.
            </p>
          </section>
        ) : (
          <section className="municipal-reports">
            <div className="municipal-reports__heading">
              <div>
                <p>Reportes ciudadanos</p>
                <h2>Listado de incidencias</h2>
              </div>
            </div>

            <div className="municipal-toolbar">
              <label>
                Buscar reporte
                <input
                  type="search"
                  placeholder="ID, distrito, dirección o gravedad..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label>
                Filtrar por estado
                <select
                  value={activeStatus}
                  onChange={(event) =>
                    setActiveStatus(event.target.value as "Todos" | ReportStatus)
                  }
                >
                  <option value="Todos">Todos</option>
                  {MUNICIPAL_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                  <option value="En revisión">En revisión</option>
                </select>
              </label>
            </div>

            {filteredReports.length === 0 ? (
              <div className="municipal-filter-empty">
                No se encontraron reportes con los filtros aplicados.
              </div>
            ) : (
              <div className="municipal-report-list">
                {filteredReports.map((report) => (
                  <article key={report.id} className="municipal-report-card">
                    <div className="municipal-report-card__media">
                      <img src={report.imageUrl} alt="Evidencia del bache" />
                    </div>

                    <div className="municipal-report-card__content">
                      <div className="municipal-report-card__title">
                        <div>
                          <span>{report.id}</span>
                          <h3>{report.address}</h3>
                        </div>

                        <SeverityBadge text={report.status} />
                      </div>

                      <p className="municipal-report-card__description">
                        {report.description ||
                          "El ciudadano no agregó una descripción adicional."}
                      </p>

                      <div className="municipal-report-card__meta">
                        <span>Distrito: {report.distrito}</span>
                        <span>Fecha: {formatDate(report.createdAt)}</span>
                        <span>Gravedad: {report.severity}</span>
                        <span>Confianza IA: {Math.round(report.confidence * 100)}%</span>
                      </div>

                      <div className="municipal-report-card__controls">
                        <label>
                          Estado del reporte
                          <select
                            value={report.status}
                            onChange={(event) =>
                              handleStatusChange(
                                report.id,
                                event.target.value as ReportStatus
                              )
                            }
                          >
                            {MUNICIPAL_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Nota municipal
                          <textarea
                            rows={3}
                            placeholder="Agregar comentario de seguimiento..."
                            value={noteDrafts[report.id] ?? ""}
                            onChange={(event) =>
                              handleNoteChange(report.id, event.target.value)
                            }
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleSaveNote(report.id)}
                        >
                          Guardar nota
                        </button>
                      </div>

                      {report.municipalNote && (
                        <div className="municipal-report-card__note">
                          <span>Última nota municipal</span>
                          <p>{report.municipalNote}</p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default MunicipalDashboard;
