import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowUpDownIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HistoryIcon,
  PieChartIcon,
  SearchIcon,
  TrashIcon,
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
  },
  {
    key: "deleted-history",
    icon: TrashIcon,
    title: "Deleted Assets History",
    description: "Review soft-deleted assets and restore them when needed"
  }
];

const STATUS_OPTIONS = ["All", "Available", "Assigned", "Damaged", "Expired"];
const HISTORY_ACTION_OPTIONS = [
  "All",
  "Added",
  "Assigned",
  "Reassigned",
  "Returned",
  "Damaged",
  "Expired",
  "Edited",
  "Deleted",
  "Restored"
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

const INITIAL_DELETED_FILTERS = {
  search: "",
  page: 0,
  size: 6
};

const STATUS_COLOR_MAP = {
  available: "#10b981",
  assigned: "#8b5cf6",
  damaged: "#f97316",
  expired: "#ef4444"
};

const ACTION_LABEL_MAP = {
  "new asset": "Added",
  assigned: "Assigned",
  reassigned: "Reassigned",
  returned: "Returned",
  "marked damaged": "Damaged",
  "marked expired": "Expired",
  deleted: "Deleted",
  restored: "Restored",
  edited: "Edited"
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

function actionClassName(action) {
  const normalized = normalizeText(action);

  return normalized === "added"
    ? "report-action-pill report-action-added"
    : normalized === "restored"
      ? "report-action-pill report-action-added"
    : normalized === "assigned" || normalized === "reassigned"
      ? "report-action-pill report-action-assigned"
      : normalized === "returned"
        ? "report-action-pill report-action-returned"
        : normalized === "damaged" || normalized === "expired" || normalized === "deleted"
          ? "report-action-pill report-action-alert"
          : "report-action-pill report-action-neutral";
}

function mapHistoryActionLabel(action) {
  const normalized = normalizeText(action);
  return ACTION_LABEL_MAP[normalized] ?? action ?? "-";
}

function getMetricColor(label) {
  return STATUS_COLOR_MAP[normalizeText(label)] ?? "#60a5fa";
}

function getStatusMetrics(summaryReport) {
  const metrics = Array.isArray(summaryReport?.statusBreakdown)
    ? summaryReport.statusBreakdown
    : [];

  if (metrics.length > 0) {
    return metrics.map((item) => ({
      label: item.label,
      value: item.value,
      color: getMetricColor(item.label)
    }));
  }

  return [
    { label: "Available", value: summaryReport?.availableAssets ?? 0, color: STATUS_COLOR_MAP.available },
    { label: "Assigned", value: summaryReport?.assignedAssets ?? 0, color: STATUS_COLOR_MAP.assigned },
    { label: "Damaged", value: summaryReport?.damagedAssets ?? 0, color: STATUS_COLOR_MAP.damaged },
    { label: "Expired", value: summaryReport?.expiredAssets ?? 0, color: STATUS_COLOR_MAP.expired }
  ];
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(centerX, centerY, radius, startAngle, endAngle) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y
  ].join(" ");
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getPointerTooltipPosition(event, containerRect, tooltipWidth = 180, tooltipHeight = 74) {
  return {
    x: clamp(
      event.clientX - containerRect.left + 18,
      12,
      Math.max(12, containerRect.width - tooltipWidth - 12)
    ),
    y: clamp(
      event.clientY - containerRect.top - 12,
      12,
      Math.max(12, containerRect.height - tooltipHeight - 12)
    )
  };
}

function getElementTooltipPosition(element, containerRect, tooltipWidth = 180, tooltipHeight = 74) {
  const elementRect = element.getBoundingClientRect();
  const centerX = elementRect.left - containerRect.left + elementRect.width / 2;

  return {
    x: clamp(centerX - tooltipWidth / 2, 12, Math.max(12, containerRect.width - tooltipWidth - 12)),
    y: clamp(
      elementRect.top - containerRect.top - tooltipHeight - 12,
      12,
      Math.max(12, containerRect.height - tooltipHeight - 12)
    )
  };
}

function VerticalBarChart({ items }) {
  const chartRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const maximum = Math.max(...items.map((item) => item.value), 0);

  if (items.length === 0) {
    return <p className="asset-empty-state">No category data is available yet.</p>;
  }

  const hideTooltip = () => setTooltip(null);
  const showTooltipFromPointer = (event, item) => {
    const containerRect = chartRef.current?.getBoundingClientRect();

    if (!containerRect) {
      return;
    }

    setTooltip({
      item,
      ...getPointerTooltipPosition(event, containerRect)
    });
  };

  const showTooltipFromFocus = (event, item) => {
    const containerRect = chartRef.current?.getBoundingClientRect();

    if (!containerRect) {
      return;
    }

    setTooltip({
      item,
      ...getElementTooltipPosition(event.currentTarget, containerRect)
    });
  };

  return (
    <div ref={chartRef} className="report-vertical-chart">
      {tooltip?.item ? (
        <div
          className="report-chart-tooltip report-chart-tooltip-follow"
          role="status"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <strong>{tooltip.item.label}</strong>
          <span>{tooltip.item.value} {tooltip.item.value === 1 ? "asset" : "assets"}</span>
        </div>
      ) : null}

      {items.map((item) => {
        const isActive = tooltip?.item?.label === item.label;
        const height = maximum > 0 ? Math.max(10, Math.round((item.value / maximum) * 100)) : 0;

        return (
          <div
            key={item.label}
            className={`report-vertical-bar-group${isActive ? " is-active" : ""}`}
            onBlur={hideTooltip}
            onFocus={(event) => showTooltipFromFocus(event, item)}
            onMouseEnter={(event) => showTooltipFromPointer(event, item)}
            onMouseLeave={hideTooltip}
            onMouseMove={(event) => showTooltipFromPointer(event, item)}
            tabIndex={0}
          >
            <span className="report-vertical-bar-value">{item.value}</span>
            <div className="report-vertical-bar-track">
              <span className="report-vertical-bar-fill" style={{ "--bar-height": `${height}%` }} />
            </div>
            <span className="report-vertical-bar-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ items, total }) {
  let currentAngle = 0;

  return (
    <div className="report-donut-layout">
      <div className="report-donut-graphic">
        <svg className="report-donut-svg" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="76" className="report-donut-track" />
          {items.map((item) => {
            const portion = total > 0 ? item.value / total : 0;
            const startAngle = currentAngle;
            const endAngle = currentAngle + portion * 360;
            currentAngle = endAngle;

            if (item.value <= 0) {
              return null;
            }

            return (
              <path
                key={item.label}
                d={describeArc(110, 110, 76, startAngle, Math.max(endAngle - 0.8, startAngle + 0.8))}
                stroke={item.color}
                strokeWidth="28"
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </svg>

        <div className="report-donut-center">
          <strong>{total}</strong>
          <span>Total</span>
        </div>
      </div>

      <div className="report-donut-legend">
        {items.map((item) => (
          <div key={item.label} className="report-donut-legend-item">
            <span className="report-donut-legend-swatch" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownCard({ title, items, total, accent = "default" }) {
  return (
    <article className="report-breakdown-card">
      <h3>{title}</h3>
      <div className="report-breakdown-list">
        {items.length === 0 ? (
          <p className="asset-empty-state">No data available yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="report-breakdown-item">
              <div className="report-breakdown-item-label">
                {"color" in item ? (
                  <span className="report-breakdown-dot" style={{ backgroundColor: item.color }} />
                ) : null}
                <span>{item.label}</span>
              </div>
              <strong>{item.value}</strong>
            </div>
          ))
        )}
      </div>
      <div className={`report-breakdown-total report-breakdown-total-${accent}`}>
        <span>Total</span>
        <strong>{total}</strong>
      </div>
    </article>
  );
}

export default function ReportsPanelFigma({
  user,
  categories,
  setPageError,
  setPageNotice,
  onRequestDeleteAsset,
  onRequestRestoreAsset,
  refreshKey = 0
}) {
  const [activeView, setActiveView] = useState("home");
  const [detailedFilters, setDetailedFilters] = useState(INITIAL_DETAILED_FILTERS);
  const [historyFilters, setHistoryFilters] = useState(INITIAL_HISTORY_FILTERS);
  const [deletedFilters, setDeletedFilters] = useState(INITIAL_DELETED_FILTERS);
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
  const [deletedReport, setDeletedReport] = useState({
    items: [],
    page: 0,
    size: 6,
    totalElements: 0,
    totalPages: 1
  });
  const [summaryReport, setSummaryReport] = useState(null);
  const [isLoadingDetailed, setIsLoadingDetailed] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExportingDetailed, setIsExportingDetailed] = useState(false);
  const [isExportingHistory, setIsExportingHistory] = useState(false);
  const [isExportingDeleted, setIsExportingDeleted] = useState(false);
  const [isExportingSummary, setIsExportingSummary] = useState(false);

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
      action: filters.action === "Added" ? "New Asset" : filters.action,
      page: String(filters.page),
      size: String(filters.size)
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/history?${params}`, {
      method: "GET",
      headers: authHeaders
    });

    return parseResponse(response);
  };

  const fetchDeletedReport = async (filters) => {
    const params = new URLSearchParams({
      search: filters.search,
      page: String(filters.page),
      size: String(filters.size)
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/deleted-assets?${params}`, {
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
  }, [activeView, detailedFilters, refreshKey, user?.token, user?.tokenType, setPageError]);

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
  }, [activeView, historyFilters, refreshKey, user?.token, user?.tokenType, setPageError]);

  useEffect(() => {
    if (activeView !== "deleted-history") {
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setIsLoadingDeleted(true);

      try {
        const payload = await fetchDeletedReport(deletedFilters);
        setDeletedReport(payload);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoadingDeleted(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeView, deletedFilters, refreshKey, user?.token, user?.tokenType, setPageError]);

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
  }, [activeView, refreshKey, user?.token, user?.tokenType, setPageError]);

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

  const handleDeletedFilterChange = (event) => {
    const { name, value } = event.target;
    setDeletedFilters((current) => ({
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

  const resetDeletedFilters = () => {
    setDeletedFilters(INITIAL_DELETED_FILTERS);
  };

  const fetchAllDetailedRows = async () => {
    const payload = await fetchDetailedReport({
      ...detailedFilters,
      page: 0,
      size: Math.max(detailedReport.totalElements || 0, 500)
    });

    return Array.isArray(payload?.items) ? payload.items : [];
  };

  const fetchAllHistoryRows = async () => {
    const payload = await fetchHistoryReport({
      ...historyFilters,
      page: 0,
      size: Math.max(historyReport.totalElements || 0, 500)
    });

    return Array.isArray(payload?.items) ? payload.items : [];
  };

  const fetchAllDeletedRows = async () => {
    const payload = await fetchDeletedReport({
      ...deletedFilters,
      page: 0,
      size: Math.max(deletedReport.totalElements || 0, 500)
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

  const handleExportHistoryExcel = async () => {
    clearMessages();
    setIsExportingHistory(true);

    try {
      const items = await fetchAllHistoryRows();
      const rows = [
        ["Asset ID", "Asset Name", "Action Type", "From", "To", "Action Date", "Remarks"],
        ...items.map((item) => ([
          item.assetDisplayId,
          item.assetName,
          mapHistoryActionLabel(item.action),
          item.oldStatus || "-",
          item.newStatus || "-",
          formatDateTime(item.eventDate),
          item.details || "-"
        ]))
      ];

      const csv = rows.map((row) => row.map(buildCsvCell).join(",")).join("\n");
      downloadBlob(csv, "asset-history-report.csv", "text/csv;charset=utf-8;");
      setPageNotice("History report exported for Excel.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsExportingHistory(false);
    }
  };

  const handleExportHistoryPdf = async () => {
    clearMessages();
    setIsExportingHistory(true);

    try {
      const items = await fetchAllHistoryRows();
      const printableWindow = window.open("", "_blank", "width=1280,height=900");

      if (!printableWindow) {
        throw new Error("Popup blocked. Allow popups to export the report as PDF.");
      }

      const tableRows = items.map((item) => `
        <tr>
          <td>${escapeHtml(item.assetDisplayId)}</td>
          <td>${escapeHtml(item.assetName)}</td>
          <td>${escapeHtml(mapHistoryActionLabel(item.action))}</td>
          <td>${escapeHtml(item.oldStatus || "-")}</td>
          <td>${escapeHtml(item.newStatus || "-")}</td>
          <td>${escapeHtml(formatDateTime(item.eventDate))}</td>
          <td>${escapeHtml(item.details || "-")}</td>
        </tr>
      `).join("");

      printableWindow.document.write(`
        <html>
          <head>
            <title>Asset History Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
              h1 { margin: 0 0 12px; }
              p { margin: 0 0 18px; color: #4b5563; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #d1d5db; padding: 9px; text-align: left; font-size: 12px; }
              th { background: #f3f4f6; }
            </style>
          </head>
          <body>
            <h1>Asset History Report</h1>
            <p>Generated from Office Asset Management System</p>
            <table>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Asset Name</th>
                  <th>Action Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Action Date</th>
                  <th>Remarks</th>
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
      setPageNotice("History report opened in print view for PDF export.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsExportingHistory(false);
    }
  };

  const handleExportDeletedExcel = async () => {
    clearMessages();
    setIsExportingDeleted(true);

    try {
      const items = await fetchAllDeletedRows();
      const rows = [
        ["Deletion Date", "Asset ID", "Asset Name", "Reason", "Deleted By"],
        ...items.map((item) => ([
          formatDateTime(item.deletionDate),
          item.assetDisplayId,
          item.assetName,
          item.reason || "-",
          item.deletedBy || "-"
        ]))
      ];

      const csv = rows.map((row) => row.map(buildCsvCell).join(",")).join("\n");
      downloadBlob(csv, "deleted-assets-history.csv", "text/csv;charset=utf-8;");
      setPageNotice("Deleted assets history exported for Excel.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsExportingDeleted(false);
    }
  };

  const handleExportDeletedPdf = async () => {
    clearMessages();
    setIsExportingDeleted(true);

    try {
      const items = await fetchAllDeletedRows();
      const printableWindow = window.open("", "_blank", "width=1280,height=900");

      if (!printableWindow) {
        throw new Error("Popup blocked. Allow popups to export the report as PDF.");
      }

      const tableRows = items.map((item) => `
        <tr>
          <td>${escapeHtml(formatDateTime(item.deletionDate))}</td>
          <td>${escapeHtml(item.assetDisplayId)}</td>
          <td>${escapeHtml(item.assetName)}</td>
          <td>${escapeHtml(item.reason || "-")}</td>
          <td>${escapeHtml(item.deletedBy || "-")}</td>
        </tr>
      `).join("");

      printableWindow.document.write(`
        <html>
          <head>
            <title>Deleted Assets History</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
              h1 { margin: 0 0 12px; }
              p { margin: 0 0 18px; color: #4b5563; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #d1d5db; padding: 9px; text-align: left; font-size: 12px; }
              th { background: #f3f4f6; }
            </style>
          </head>
          <body>
            <h1>Deleted Assets History</h1>
            <p>Generated from Office Asset Management System</p>
            <table>
              <thead>
                <tr>
                  <th>Deletion Date</th>
                  <th>Asset ID</th>
                  <th>Asset Name</th>
                  <th>Reason</th>
                  <th>Deleted By</th>
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
      setPageNotice("Deleted assets history opened in print view for PDF export.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsExportingDeleted(false);
    }
  };

  const handleExportSummaryExcel = async () => {
    clearMessages();
    setIsExportingSummary(true);

    try {
      const payload = summaryReport ?? await fetchSummaryReport();
      const statusItems = getStatusMetrics(payload);
      const categoryItems = Array.isArray(payload?.categoryBreakdown) ? payload.categoryBreakdown : [];
      const sectionItems = Array.isArray(payload?.sectionBreakdown) ? payload.sectionBreakdown : [];
      const rows = [
        ["Summary Metric", "Value"],
        ["Total Assets", payload?.totalAssets ?? 0],
        ["Available", payload?.availableAssets ?? 0],
        ["Assigned", payload?.assignedAssets ?? 0],
        ["Damaged", payload?.damagedAssets ?? 0],
        ["Expired", payload?.expiredAssets ?? 0],
        ["Assigned With Seat", payload?.assignedWithSeatNumber ?? 0],
        [],
        ["Status", "Count"],
        ...statusItems.map((item) => [item.label, item.value]),
        [],
        ["Category", "Count"],
        ...categoryItems.map((item) => [item.label, item.value]),
        [],
        ["Section", "Assigned Assets"],
        ...sectionItems.map((item) => [item.label, item.value])
      ];

      const csv = rows.map((row) => row.map(buildCsvCell).join(",")).join("\n");
      downloadBlob(csv, "asset-summary-report.csv", "text/csv;charset=utf-8;");
      setPageNotice("Summary report exported for Excel.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsExportingSummary(false);
    }
  };

  const handleExportSummaryPdf = async () => {
    clearMessages();
    setIsExportingSummary(true);

    try {
      const payload = summaryReport ?? await fetchSummaryReport();
      const statusItems = getStatusMetrics(payload);
      const categoryItems = Array.isArray(payload?.categoryBreakdown) ? payload.categoryBreakdown : [];
      const sectionItems = Array.isArray(payload?.sectionBreakdown) ? payload.sectionBreakdown : [];
      const printableWindow = window.open("", "_blank", "width=1280,height=900");

      if (!printableWindow) {
        throw new Error("Popup blocked. Allow popups to export the report as PDF.");
      }

      const renderRows = (items) => items.map((item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${escapeHtml(item.value)}</td>
        </tr>
      `).join("");

      printableWindow.document.write(`
        <html>
          <head>
            <title>Asset Summary Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
              h1, h2 { margin: 0 0 12px; }
              h2 { margin-top: 28px; font-size: 20px; }
              p { margin: 0 0 18px; color: #4b5563; }
              .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
              .stat { border: 1px solid #d1d5db; border-radius: 12px; padding: 14px; }
              .stat span { display: block; color: #6b7280; font-size: 12px; margin-bottom: 6px; }
              .stat strong { font-size: 22px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 13px; }
              th { background: #f3f4f6; }
            </style>
          </head>
          <body>
            <h1>Asset Summary Report</h1>
            <p>Generated from Office Asset Management System</p>
            <div class="stats">
              <div class="stat"><span>Total Assets</span><strong>${payload?.totalAssets ?? 0}</strong></div>
              <div class="stat"><span>Available</span><strong>${payload?.availableAssets ?? 0}</strong></div>
              <div class="stat"><span>Assigned</span><strong>${payload?.assignedAssets ?? 0}</strong></div>
              <div class="stat"><span>Damaged</span><strong>${payload?.damagedAssets ?? 0}</strong></div>
              <div class="stat"><span>Expired</span><strong>${payload?.expiredAssets ?? 0}</strong></div>
              <div class="stat"><span>Assigned With Seat</span><strong>${payload?.assignedWithSeatNumber ?? 0}</strong></div>
            </div>
            <h2>Status Distribution</h2>
            <table>
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>${renderRows(statusItems)}</tbody>
            </table>
            <h2>Total Assets per Category</h2>
            <table>
              <thead><tr><th>Category</th><th>Count</th></tr></thead>
              <tbody>${renderRows(categoryItems)}</tbody>
            </table>
            <h2>Assigned Assets by Section</h2>
            <table>
              <thead><tr><th>Section</th><th>Count</th></tr></thead>
              <tbody>${renderRows(sectionItems)}</tbody>
            </table>
          </body>
        </html>
      `);
      printableWindow.document.close();
      printableWindow.focus();
      printableWindow.print();
      setPageNotice("Summary report opened in print view for PDF export.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsExportingSummary(false);
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
  const deletedStart = deletedReport.totalElements === 0
    ? 0
    : deletedReport.page * deletedReport.size + 1;
  const deletedEnd = Math.min(
    deletedReport.totalElements,
    (deletedReport.page + 1) * deletedReport.size
  );

  const historyRows = useMemo(
    () => (historyReport.items ?? []).map((item) => ({
      historyId: item.historyId,
      assetDisplayId: item.assetDisplayId,
      assetName: item.assetName,
      actionLabel: mapHistoryActionLabel(item.action),
      from: item.oldStatus || "-",
      to: item.newStatus || "-",
      eventDate: formatDateTime(item.eventDate),
      remarks: item.details || "-"
    })),
    [historyReport.items]
  );
  const deletedRows = useMemo(
    () => (deletedReport.items ?? []).map((item) => ({
      deletionLogId: item.deletionLogId,
      assetId: item.assetId,
      assetDisplayId: item.assetDisplayId,
      assetName: item.assetName,
      deletionDate: formatDateTime(item.deletionDate),
      reason: item.reason || "-",
      deletedBy: item.deletedBy || "-"
    })),
    [deletedReport.items]
  );

  const summaryStatusItems = useMemo(() => getStatusMetrics(summaryReport), [summaryReport]);
  const summaryCategoryItems = useMemo(
    () => (Array.isArray(summaryReport?.categoryBreakdown) ? summaryReport.categoryBreakdown : []),
    [summaryReport]
  );
  const summarySectionItems = useMemo(
    () => (Array.isArray(summaryReport?.sectionBreakdown) ? summaryReport.sectionBreakdown : []),
    [summaryReport]
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
            <div className="asset-action-copy">
              <strong>{card.title}</strong>
              <span className="asset-action-description">{card.description}</span>
            </div>
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
              placeholder="Search by Asset ID, Name, Employee, Section"
              type="text"
              value={detailedFilters.search}
            />
          </label>

          <select className="report-select" name="category" onChange={handleDetailedFilterChange} value={detailedFilters.category}>
            <option value="All">Category: All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                Category: {category.name}
              </option>
            ))}
          </select>

          <select className="report-select" name="status" onChange={handleDetailedFilterChange} value={detailedFilters.status}>
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
          <button className="primary-button report-export-button report-export-excel" disabled={isExportingDetailed} type="button" onClick={handleExportExcel}>
            <FileSpreadsheetIcon className="report-button-icon" />
            <span>Excel</span>
          </button>
          <button className="primary-button report-export-button report-export-pdf" disabled={isExportingDetailed} type="button" onClick={handleExportPdf}>
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
                <th className="report-action-column">Delete</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingDetailed ? (
                <tr>
                  <td className="report-empty-cell" colSpan="7">Loading report...</td>
                </tr>
              ) : detailedReport.items.length === 0 ? (
                <tr>
                  <td className="report-empty-cell" colSpan="7">No assets match the selected filters.</td>
                </tr>
              ) : (
                detailedReport.items.map((item) => (
                  <tr key={item.assetId}>
                    <td>{item.assetDisplayId}</td>
                    <td>{item.assetName}</td>
                    <td>{item.categoryName}</td>
                    <td>{item.employeeName}</td>
                    <td>{item.section}</td>
                    <td><span className={statusClassName(item.status)}>{item.status}</span></td>
                    <td>
                      <button
                        aria-label={`Delete ${item.assetName}`}
                        className="report-row-action-button report-row-action-button-danger"
                        type="button"
                        onClick={() => onRequestDeleteAsset?.(item)}
                      >
                        <TrashIcon className="report-row-action-icon" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="report-pagination-row">
          <span>Showing {detailedStart} to {detailedEnd} of {detailedReport.totalElements} results</span>
          <div className="report-pagination-actions">
            <button className="secondary-button report-page-button" disabled={detailedReport.page <= 0 || isLoadingDetailed} type="button" onClick={() => setDetailedFilters((current) => ({ ...current, page: current.page - 1 }))}>
              Previous
            </button>
            <button className="secondary-button report-page-button" disabled={detailedReport.page >= detailedReport.totalPages - 1 || isLoadingDetailed} type="button" onClick={() => setDetailedFilters((current) => ({ ...current, page: current.page + 1 }))}>
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
              placeholder="Search by Asset ID, Name, From, To, Remarks"
              type="text"
              value={historyFilters.search}
            />
          </label>

          <select className="report-select" name="action" onChange={handleHistoryFilterChange} value={historyFilters.action}>
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
          <button className="primary-button report-export-button report-export-excel" disabled={isExportingHistory} type="button" onClick={handleExportHistoryExcel}>
            <FileSpreadsheetIcon className="report-button-icon" />
            <span>Excel</span>
          </button>
          <button className="primary-button report-export-button report-export-pdf" disabled={isExportingHistory} type="button" onClick={handleExportHistoryPdf}>
            <FileTextIcon className="report-button-icon" />
            <span>PDF</span>
          </button>
        </div>
      </section>

      <section className="report-table-card">
        <div className="report-table-scroll">
          <table className="report-table report-table-history-figma">
            <thead>
              <tr>
                <th><span className="report-sort-button"><span>Asset ID</span><ArrowUpDownIcon className="report-sort-icon" /></span></th>
                <th>Asset Name</th>
                <th>Action Type</th>
                <th>From</th>
                <th>To</th>
                <th><span className="report-sort-button"><span>Action Date</span><ArrowUpDownIcon className="report-sort-icon" /></span></th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingHistory ? (
                <tr>
                  <td className="report-empty-cell" colSpan="7">Loading history...</td>
                </tr>
              ) : historyRows.length === 0 ? (
                <tr>
                  <td className="report-empty-cell" colSpan="7">No history records found.</td>
                </tr>
              ) : (
                historyRows.map((item) => (
                  <tr key={item.historyId}>
                    <td>{item.assetDisplayId}</td>
                    <td>{item.assetName}</td>
                    <td><span className={actionClassName(item.actionLabel)}>{item.actionLabel}</span></td>
                    <td>{item.from}</td>
                    <td>{item.to}</td>
                    <td>{item.eventDate}</td>
                    <td>{item.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="report-pagination-row">
          <span>Showing {historyStart} to {historyEnd} of {historyReport.totalElements} results</span>
          <div className="report-pagination-actions">
            <button className="secondary-button report-page-button" disabled={historyReport.page <= 0 || isLoadingHistory} type="button" onClick={() => setHistoryFilters((current) => ({ ...current, page: current.page - 1 }))}>
              Previous
            </button>
            <button className="secondary-button report-page-button" disabled={historyReport.page >= historyReport.totalPages - 1 || isLoadingHistory} type="button" onClick={() => setHistoryFilters((current) => ({ ...current, page: current.page + 1 }))}>
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  ) : activeView === "deleted-history" ? (
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
        <div className="report-filter-grid report-filter-grid-deleted">
          <label className="report-search-field">
            <SearchIcon className="report-search-icon-svg" />
            <input
              name="search"
              onChange={handleDeletedFilterChange}
              placeholder="Search by Asset ID, Name, Reason, Deleted By"
              type="text"
              value={deletedFilters.search}
            />
          </label>

          <button className="secondary-button report-filter-button" type="button" onClick={resetDeletedFilters}>
            <XIcon className="report-button-icon" />
            <span>Clear</span>
          </button>
          <button className="primary-button report-export-button report-export-excel" disabled={isExportingDeleted} type="button" onClick={handleExportDeletedExcel}>
            <FileSpreadsheetIcon className="report-button-icon" />
            <span>Excel</span>
          </button>
          <button className="primary-button report-export-button report-export-pdf" disabled={isExportingDeleted} type="button" onClick={handleExportDeletedPdf}>
            <FileTextIcon className="report-button-icon" />
            <span>PDF</span>
          </button>
        </div>
      </section>

      <section className="report-table-card">
        <div className="report-table-scroll">
          <table className="report-table report-table-deleted-history">
            <thead>
              <tr>
                <th>Deletion Date</th>
                <th>Asset ID</th>
                <th>Asset Name</th>
                <th>Reason</th>
                <th>Deleted By</th>
                <th className="report-action-column">Restore</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingDeleted ? (
                <tr>
                  <td className="report-empty-cell" colSpan="6">Loading deleted assets...</td>
                </tr>
              ) : deletedRows.length === 0 ? (
                <tr>
                  <td className="report-empty-cell" colSpan="6">No deleted assets found.</td>
                </tr>
              ) : (
                deletedRows.map((item) => (
                  <tr key={item.deletionLogId}>
                    <td>{item.deletionDate}</td>
                    <td>{item.assetDisplayId}</td>
                    <td>{item.assetName}</td>
                    <td>{item.reason}</td>
                    <td>{item.deletedBy}</td>
                    <td>
                      <button
                        className="report-restore-button"
                        type="button"
                        onClick={() => onRequestRestoreAsset?.(item)}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="report-pagination-row">
          <span>Showing {deletedStart} to {deletedEnd} of {deletedReport.totalElements} results</span>
          <div className="report-pagination-actions">
            <button className="secondary-button report-page-button" disabled={deletedReport.page <= 0 || isLoadingDeleted} type="button" onClick={() => setDeletedFilters((current) => ({ ...current, page: current.page - 1 }))}>
              Previous
            </button>
            <button className="secondary-button report-page-button" disabled={deletedReport.page >= deletedReport.totalPages - 1 || isLoadingDeleted} type="button" onClick={() => setDeletedFilters((current) => ({ ...current, page: current.page + 1 }))}>
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

      <section className="report-summary-toolbar">
        <button className="primary-button report-export-button report-export-excel" disabled={isExportingSummary} type="button" onClick={handleExportSummaryExcel}>
          <FileSpreadsheetIcon className="report-button-icon" />
          <span>Download Excel</span>
        </button>
        <button className="primary-button report-export-button report-export-pdf" disabled={isExportingSummary} type="button" onClick={handleExportSummaryPdf}>
          <FileTextIcon className="report-button-icon" />
          <span>Download PDF</span>
        </button>
      </section>

      {isLoadingSummary ? (
        <section className="report-toolbar-card">
          <p className="asset-empty-state">Loading summary report...</p>
        </section>
      ) : (
        <>
          <section className="report-summary-charts">
            <article className="report-chart-card">
              <h2>Total Assets per Category</h2>
              <VerticalBarChart items={summaryCategoryItems} />
            </article>
            <article className="report-chart-card">
              <h2>Status Distribution</h2>
              <DonutChart items={summaryStatusItems} total={summaryReport?.totalAssets ?? 0} />
            </article>
          </section>

          <section className="report-summary-breakdown-grid">
            <BreakdownCard accent="violet" items={summaryCategoryItems} title="Assets by Category" total={summaryCategoryItems.reduce((sum, item) => sum + item.value, 0)} />
            <BreakdownCard accent="violet" items={summaryStatusItems} title="Assets by Status" total={summaryStatusItems.reduce((sum, item) => sum + item.value, 0)} />
          </section>

          <section className="report-summary-breakdown-grid">
            <article className="report-breakdown-card">
              <h3>Assigned Assets by Section</h3>
              <div className="report-breakdown-list">
                {summarySectionItems.length === 0 ? (
                  <p className="asset-empty-state">No assigned assets are linked to sections yet.</p>
                ) : (
                  summarySectionItems.map((item) => (
                    <div key={item.label} className="report-breakdown-item">
                      <div className="report-breakdown-item-label"><span>{item.label}</span></div>
                      <strong>{item.value}</strong>
                    </div>
                  ))
                )}
              </div>
              <div className="report-breakdown-total report-breakdown-total-green">
                <span>Total Assigned</span>
                <strong>{summaryReport?.assignedAssets ?? 0}</strong>
              </div>
            </article>
            <article className="report-breakdown-card">
              <h3>Quick Totals</h3>
              <div className="report-breakdown-list">
                <div className="report-breakdown-item"><div className="report-breakdown-item-label"><span>Total Assets</span></div><strong>{summaryReport?.totalAssets ?? 0}</strong></div>
                <div className="report-breakdown-item"><div className="report-breakdown-item-label"><span>Assigned With Seat</span></div><strong>{summaryReport?.assignedWithSeatNumber ?? 0}</strong></div>
                <div className="report-breakdown-item"><div className="report-breakdown-item-label"><span>Available</span></div><strong>{summaryReport?.availableAssets ?? 0}</strong></div>
                <div className="report-breakdown-item"><div className="report-breakdown-item-label"><span>Damaged + Expired</span></div><strong>{(summaryReport?.damagedAssets ?? 0) + (summaryReport?.expiredAssets ?? 0)}</strong></div>
              </div>
              <div className="report-breakdown-total report-breakdown-total-blue">
                <span>Tracked Assets</span>
                <strong>{summaryReport?.totalAssets ?? 0}</strong>
              </div>
            </article>
          </section>
        </>
      )}
    </>
  );
}
