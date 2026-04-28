export const getStoredReports = () => {
  const reports = localStorage.getItem('urbanet_reports');
  return reports ? JSON.parse(reports) : [];
};

export const saveReport = (report) => {
  const reports = getStoredReports();
  const updatedReports = [report, ...reports];
  localStorage.setItem('urbanet_reports', JSON.stringify(updatedReports));
  return updatedReports;
};

export const updateReportStatus = (reportId, newStatus) => {
  const reports = getStoredReports();
  const index = reports.findIndex(r => r.id === reportId);
  if (index !== -1) {
    reports[index].status = newStatus;
    reports[index].updatedAt = new Date().toISOString();
    localStorage.setItem('urbanet_reports', JSON.stringify(reports));
  }
  return reports;
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('urbanet_user');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user) => {
  localStorage.setItem('urbanet_user', JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem('urbanet_user');
};
