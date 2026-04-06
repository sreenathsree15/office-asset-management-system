import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowUpDownIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HistoryIcon,
  PieChartIcon,
  SearchIcon,
  XIcon
} from "../components/AppIcons";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const REPORT_CARDS = [
  {
    key: "detailed",
    icon: FileTextIcon,
    title: "Detailed View",
    description: "View complete asset details with filters"
  },
  {
    key: "history",
    icon: HistoryIcon,
    title: "History Report",
    description: "Track all asset movements and changes"
  },
  {
    key: "summary",
    icon: PieChartIcon,
    title: "Summary Report",
    description: "Visual overview with charts and statistics"
  }
];

const STATUS_OPTIONS = ["All", "Available", "Assigned", "Damaged", "Expired"];
const HISTORY_ACTION_OPTIONS = [
  "All",
  "New Asset",
  "Assigned",
  "Marked Damaged",
  "Marked Expired",
  "Returned",
  "Edited"
];

const INITIAL_DETAILED_FILTERS = {
  search: "",
  category: "All",
  status: "All",
  sortBy: "assetId",
  sortDir: "asc",
  page: 0,
  size: 5
};

const INITIAL_HISTORY_FILTERS = {
  search: "",
  action: "All",
  page: 0,
  size: 6
};

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? payload.error
        : "Unable to complete the request.";

    throw new Error(message);
  }

  return payload;
}

function formatDate(value) {
  if (!value || value === "-") {
    return "-";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB");
}

function formatDateTime(value) {
  if (!value || value === "-") {
    return "-";
  }

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizeText(value) {
  return (value ?? "").trim().toLowerCase();
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildCsvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function statusClassName(status) {
  const normalized = normalizeText(status);

  return normalized === "assigned"
    ? "report-status-pill report-status-assigned"
    : normalized === "available"
      ? "report-status-pill report-status-available"
      : normalized === "damaged"
        ? "report-status-pill report-status-damaged"
        : normalized === "expired"
          ? "report-status-pill report-status-expired"
          : "report-status-pill";
}

export default function ReportsPanel({ user, categories, setPageError, setPageNotice }) {
  const [activeView, setActiveView] = useState("home");
  const [detailedFilters, setDetailedFilters] = useState(INITIAL_DETAILED_FILTERS);
  const [historyFilters, setHistoryFilters] = useState(INITIAL_HISTORY_FILTERS);
  const [detailedReport, setDetailedReport] = useState({
    items: [],
    page: 0,
    size: 5,
    totalElements: 0,
    totalPages: 1
  });
  const [historyReport, setHistoryReport] = useState({
    items: [],
    page: 0,
    size: 6,
    totalElements: 0,
    totalPages: 1
  });
  const [summaryReport, setSummaryReport] = useState(null);
  const [isLoadingDetailed, setIsLoadingDetailed] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExportingDetailed, setIsExportingDetailed] = useState(false);

  const authHeaders = {
    Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`
  };

  const clearMessages = () => {
    setPageError("");
    setPageNotice("");
  };

  const fetchDetailedReport = async (filters) => {
    const params = new URLSearchParams({
      search: filters.search,
      category: filters.category,
      status: filters.status,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: String(filters.page),
      size: String(filters.size)
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/detailed?${params}`, {
      method: "GET",
      headers: authHeaders
    });

    return parseResponse(response);
  };

  const fetchHistoryReport = async (filters) => {
    const params = new URLSearchParams({
      search: filters.search,
      action: filters.action,
      page: String(filters.page),
      size: String(filters.size)
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/history?${params}`, {
      method: "GET",
      headers: authHeaders
    });

    return parseResponse(response);
  };

  const fetchSummaryReport = async () => {
    const response = await fetch(`${API_BASE_URL}/api/reports/summary`, {
      method: "GET",
      headers: authHeaders
    });

    return parseResponse(response);
  };

  useEffect(() => {
    if (activeView !== "detailed") {
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setIsLoadingDetailed(true);

      try {
        const payload = await fetchDetailedReport(detailedFilters);
        setDetailedReport(payload);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoadingDetailed(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeView, detailedFilters, user?.token, user?.tokenType, setPageError]);

  useEffect(() => {
    if (activeView !== "history") {
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setIsLoadingHistory(true);

      try {
        const payload = await fetchHistoryReport(historyFilters);
        setHistoryReport(payload);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoadingHistory(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeView, historyFilters, user?.token, user?.tokenType, setPageError]);

  useEffect(() => {
    if (activeView !== "summary") {
      return undefined;
    }

    const loadSummary = async () => {
      setIsLoadingSummary(true);

      try {
        const payload = await fetchSummaryReport();
        setSummaryReport(payload);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    loadSummary();
    return undefined;
  }, [activeView, user?.token, user?.tokenType, setPageError]);

  const handleOpenView = (nextView) => {
    clearMessages();
    setActiveView(nextView);
  };

  const handleDetailedFilterChange = (event) => {
    const { name, value } = event.target;
    setDetailedFilters((current) => ({
      ...current,
      [name]: value,
      page: 0
    }));
  };

  const handleHistoryFilterChange = (event) => {
    const { name, value } = event.target;
    setHistoryFilters((current) => ({
      ...current,
      [name]: value,
      page: 0
    }));
  };

  const handleDetailedSort = (sortBy) => {
    setDetailedFilters((current) => ({
      ...current,
      sortBy,
      sortDir: current.sortBy === sortBy && current.sortDir === "asc" ? "desc" : "asc",
      page: 0
    }));
  };

  const resetDetailedFilters = () => {
    setDetailedFilters(INITIAL_DETAILED_FILTERS);
  };

  const resetHistoryFilters = () => {
    setHistoryFilters(INITIAL_HISTORY_FILTERS);
  };

  const fetchAllDetailedRows = async () => {
    const payload = await fetchDetailedReport({
      ...detailedFilters,
      page: 0,
      size: Math.max(detailedReport.totalElements || 0, 500)
    });

    return Array.isArray(payload?.items) ? payload.items : [];
  };

  const handleExportExcel = async () => {
    clearMessages();
    setIsExportingDetailed(true);

    try {
      const items = await fetchAllDetailedRows();
      const rows = [
        [
          "Asset ID",
          "Asset Name",
          "Category",
          "Employee Name",
          "Section",
          "Seat Number",
          "Status",
          "Serial Number",
          "Brand",
          "Model",
          "Purchase Date",
          "Warranty Expiry Date",
          "Date of Issue",
          "Remarks"
        ],
        ...items.map((item) => ([
          item.assetDisplayId,
          item.assetName,
          item.categoryName,
          item.employeeName,
          item.section,
          item.seatNumber,
          item.status,
          item.serialNumber,
          item.brand,
          item.model,
          formatDate(item.purchaseDate),
          formatDate(item.warrantyExpiryDate),
          formatDate(item.dateOfIssue),
          item.remarks
        ]))
      ];

      const csv = rows.map((row) => row.map(buildCsvCell).join(",")).join("\n");
      downloadBlob(csv, "asset-detailed-report.csv", "text/csv;charset=utf-8;");
      setPageNotice("Detailed report exported for Excel.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsExportingDetailed(false);
    }
  };

  const handleExportPdf = async () => {
    clearMessages();
    setIsExportingDetailed(true);

    try {
      const items = await fetchAllDetailedRows();
      const printableWindow = window.open("", "_blank", "width=1200,height=900");

      if (!printableWindow) {
        throw new Error("Popup blocked. Allow popups to export the report as PDF.");
      }

      const tableRows = items.map((item) => `
        <tr>
          <td>${escapeHtml(item.assetDisplayId)}</td>
          <td>${escapeHtml(item.assetName)}</td>
          <td>${escapeHtml(item.categoryName)}</td>
          <td>${escapeHtml(item.employeeName)}</td>
          <td>${escapeHtml(item.section)}</td>
          <td>${escapeHtml(item.seatNumber)}</td>
          <td>${escapeHtml(item.status)}</td>
        </tr>
      `).join("");

      printableWindow.document.write(`
        <html>
          <head>
            <title>Detailed Asset Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
              h1 { margin: 0 0 12px; }
              p { margin: 0 0 18px; color: #4b5563; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 13px; }
              th { background: #f3f4f6; }
            </style>
          </head>
          <body>
            <h1>Detailed Asset Report</h1>
            <p>Generated from Office Asset Management System</p>
            <table>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Employee Name</th>
                  <th>Section</th>
                  <th>Seat Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </body>
        </html>
      `);
      printableWindow.document.close();
      printableWindow.focus();
      printableWindow.print();
      setPageNotice("Detailed report opened in print view for PDF export.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsExportingDetailed(false);
    }
  };

  const detailedStart = detailedReport.totalElements === 0
    ? 0
    : detailedReport.page * detailedReport.size + 1;
  const detailedEnd = Math.min(
    detailedReport.totalElements,
    (detailedReport.page + 1) * detailedReport.size
  );
  const historyStart = historyReport.totalElements === 0
    ? 0
    : historyReport.page * historyReport.size + 1;
  const historyEnd = Math.min(
    historyReport.totalElements,
    (historyReport.page + 1) * historyReport.size
  );

  return activeView === "home" ? (
    <>
      <header className="asset-page-header">
        <div>
          <h1>Reports</h1>
        </div>
      </header>

      <section className="asset-actions-grid report-actions-grid">
        {REPORT_CARDS.map((card) => (
          <button
            key={card.key}
            className="asset-action-card"
            type="button"
            onClick={() => handleOpenView(card.key)}
          >
            <span className="asset-action-icon">
              <card.icon />
            </span>
            <strong>{card.title}</strong>
            <span>{card.description}</span>
          </button>
        ))}
      </section>
    </>
  ) : activeView === "detailed" ? (
    <>
      <header className="asset-page-header">
        <div>
          <h1>Reports</h1>
        </div>
      </header>

      <button className="secondary-button report-back-button" type="button" onClick={() => setActiveView("home")}>
        <ArrowLeftIcon className="report-button-icon" />
        <span>Back to Reports</span>
      </button>

      <section className="report-toolbar-card">
        <div className="report-filter-grid">
          <label className="report-search-field">
            <SearchIcon className="report-search-icon-svg" />
            <input
              name="search"
              onChange={handleDetailedFilterChange}
              placeholder="Search by Asset ID, Name, Employee"
              type="text"
              value={detailedFilters.search}
            />
          </label>

          <select
            className="report-select"
            name="category"
            onChange={handleDetailedFilterChange}
            value={detailedFilters.category}
          >
            <option value="All">Category: All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                Category: {category.name}
              </option>
            ))}
          </select>

          <select
            className="report-select"
            name="status"
            onChange={handleDetailedFilterChange}
            value={detailedFilters.status}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                Status: {status}
              </option>
            ))}
          </select>

          <button className="secondary-button report-filter-button" type="button" onClick={resetDetailedFilters}>
            <XIcon className="report-button-icon" />
            <span>Clear</span>
          </button>
          <button
            className="primary-button report-export-button report-export-excel"
            disabled={isExportingDetailed}
            type="button"
            onClick={handleExportExcel}
          >
            <FileSpreadsheetIcon className="report-button-icon" />
            <span>Excel</span>
          </button>
          <button
            className="primary-button report-export-button report-export-pdf"
            disabled={isExportingDetailed}
            type="button"
            onClick={handleExportPdf}
          >
            <FileTextIcon className="report-button-icon" />
            <span>PDF</span>
          </button>
        </div>
      </section>

      <section className="report-table-card">
        <div className="report-table-scroll">
          <table className="report-table">
            <thead>
              <tr>
                <th>
                  <button className="report-sort-button" type="button" onClick={() => handleDetailedSort("assetId")}>
                    <span>Asset ID</span>
                    <ArrowUpDownIcon className="report-sort-icon" />
                  </button>
                </th>
                <th>
                  <button className="report-sort-button" type="button" onClick={() => handleDetailedSort("assetName")}>
                    <span>Asset Name</span>
                    <ArrowUpDownIcon className="report-sort-icon" />
                  </button>
                </th>
                <th>Category</th>
                <th>Employee Name</th>
                <th>Section</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingDetailed ? (
                <tr>
                  <td className="report-empty-cell" colSpan="6">Loading report...</td>
                </tr>
              ) : detailedReport.items.length === 0 ? (
                <tr>
                  <td className="report-empty-cell" colSpan="6">No assets match the selected filters.</td>
                </tr>
              ) : (
                detailedReport.items.map((item) => (
                  <tr key={item.assetId}>
                    <td>{item.assetDisplayId}</td>
                    <td>{item.assetName}</td>
                    <td>{item.categoryName}</td>
                    <td>{item.employeeName}</td>
                    <td>{item.section}</td>
                    <td>
                      <span className={statusClassName(item.status)}>{item.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="report-pagination-row">
          <span>
            Showing {detailedStart} to {detailedEnd} of {detailedReport.totalElements} results
          </span>

          <div className="report-pagination-actions">
            <button
              className="secondary-button report-page-button"
              disabled={detailedReport.page <= 0 || isLoadingDetailed}
              type="button"
              onClick={() => setDetailedFilters((current) => ({ ...current, page: current.page - 1 }))}
            >
              Previous
            </button>
            <button
              className="secondary-button report-page-button"
              disabled={detailedReport.page >= detailedReport.totalPages - 1 || isLoadingDetailed}
              type="button"
              onClick={() => setDetailedFilters((current) => ({ ...current, page: current.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  ) : activeView === "history" ? (
    <>
      <header className="asset-page-header">
        <div>
          <h1>Reports</h1>
        </div>
      </header>

      <button className="secondary-button report-back-button" type="button" onClick={() => setActiveView("home")}>
        <ArrowLeftIcon className="report-button-icon" />
        <span>Back to Reports</span>
      </button>

      <section className="report-toolbar-card">
        <div className="report-filter-grid report-filter-grid-history">
          <label className="report-search-field">
            <SearchIcon className="report-search-icon-svg" />
            <input
              name="search"
              onChange={handleHistoryFilterChange}
              placeholder="Search by Asset ID, Asset Name, Action"
              type="text"
              value={historyFilters.search}
            />
          </label>

          <select
            className="report-select"
            name="action"
            onChange={handleHistoryFilterChange}
            value={historyFilters.action}
          >
            {HISTORY_ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>
                Action: {action}
              </option>
            ))}
          </select>

          <button className="secondary-button report-filter-button" type="button" onClick={resetHistoryFilters}>
            <XIcon className="report-button-icon" />
            <span>Clear</span>
          </button>
        </div>
      </section>

      <section className="report-table-card">
        <div className="report-table-scroll">
          <table className="report-table report-table-history">
            <thead>
              <tr>
                <th>Date</th>
                <th>Asset ID</th>
                <th>Asset Name</th>
                <th>Action</th>
                <th>Old Status</th>
                <th>New Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingHistory ? (
                <tr>
                  <td className="report-empty-cell" colSpan="7">Loading history...</td>
                </tr>
              ) : historyReport.items.length === 0 ? (
                <tr>
                  <td className="report-empty-cell" colSpan="7">No history records found.</td>
                </tr>
              ) : (
                historyReport.items.map((item) => (
                  <tr key={item.historyId}>
                    <td>{formatDateTime(item.eventDate)}</td>
                    <td>{item.assetDisplayId}</td>
                    <td>{item.assetName}</td>
                    <td>{item.action}</td>
                    <td>{item.oldStatus}</td>
                    <td>{item.newStatus}</td>
                    <td>{item.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="report-pagination-row">
          <span>
            Showing {historyStart} to {historyEnd} of {historyReport.totalElements} results
          </span>

          <div className="report-pagination-actions">
            <button
              className="secondary-button report-page-button"
              disabled={historyReport.page <= 0 || isLoadingHistory}
              type="button"
              onClick={() => setHistoryFilters((current) => ({ ...current, page: current.page - 1 }))}
            >
              Previous
            </button>
            <button
              className="secondary-button report-page-button"
              disabled={historyReport.page >= historyReport.totalPages - 1 || isLoadingHistory}
              type="button"
              onClick={() => setHistoryFilters((current) => ({ ...current, page: current.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  ) : (
    <>
      <header className="asset-page-header">
        <div>
          <h1>Reports</h1>
        </div>
      </header>

      <button className="secondary-button report-back-button" type="button" onClick={() => setActiveView("home")}>
        <ArrowLeftIcon className="report-button-icon" />
        <span>Back to Reports</span>
      </button>

      <section className="report-summary-grid">
        <article className="asset-summary-card">
          <span>Total Assets</span>
          <strong>{summaryReport?.totalAssets ?? 0}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Available</span>
          <strong>{summaryReport?.availableAssets ?? 0}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Assigned</span>
          <strong>{summaryReport?.assignedAssets ?? 0}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Damaged</span>
          <strong>{summaryReport?.damagedAssets ?? 0}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Expired</span>
          <strong>{summaryReport?.expiredAssets ?? 0}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Assigned With Seat</span>
          <strong>{summaryReport?.assignedWithSeatNumber ?? 0}</strong>
        </article>
      </section>

      {isLoadingSummary ? (
        <section className="report-toolbar-card">
          <p className="asset-empty-state">Loading summary report...</p>
        </section>
      ) : (
        <section className="report-summary-layout">
          <article className="report-chart-card">
            <h3>Status Breakdown</h3>
            {(summaryReport?.statusBreakdown ?? []).map((metric) => {
              const percentage = summaryReport?.totalAssets
                ? Math.round((metric.value / summaryReport.totalAssets) * 100)
                : 0;

              return (
                <div key={metric.label} className="report-bar-row">
                  <div className="report-bar-meta">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                  <div className="report-bar-track">
                    <span className="report-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </article>

          <article className="report-chart-card">
            <h3>Category Breakdown</h3>
            {(summaryReport?.categoryBreakdown ?? []).map((metric) => {
              const percentage = summaryReport?.totalAssets
                ? Math.round((metric.value / summaryReport.totalAssets) * 100)
                : 0;

              return (
                <div key={metric.label} className="report-bar-row">
                  <div className="report-bar-meta">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                  <div className="report-bar-track">
                    <span className="report-bar-fill report-bar-fill-secondary" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </article>

          <article className="report-chart-card report-chart-card-wide">
            <h3>Assigned Assets by Section</h3>
            {(summaryReport?.sectionBreakdown ?? []).length === 0 ? (
              <p className="asset-empty-state">No assigned assets are linked to sections yet.</p>
            ) : (
              (summaryReport?.sectionBreakdown ?? []).map((metric) => {
                const percentage = summaryReport?.assignedAssets
                  ? Math.round((metric.value / summaryReport.assignedAssets) * 100)
                  : 0;

                return (
                  <div key={metric.label} className="report-bar-row">
                    <div className="report-bar-meta">
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                    <div className="report-bar-track">
                      <span className="report-bar-fill report-bar-fill-tertiary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </article>
        </section>
      )}
    </>
  );
}
