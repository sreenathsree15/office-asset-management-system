import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  BatteryIcon,
  CheckCircleIcon,
  ClockIcon,
  CopyIcon,
  LaptopIcon,
  LayoutIcon,
  MonitorIcon,
  PackageIcon,
  PrinterIcon,
  UsersIcon
} from "../components/AppIcons";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const SUMMARY_CARD_CONFIG = [
  {
    label: "Total Assets",
    key: "totalAssets",
    icon: PackageIcon,
    toneClass: "dashboard-summary-icon-blue"
  },
  {
    label: "Available",
    key: "availableAssets",
    icon: CheckCircleIcon,
    toneClass: "dashboard-summary-icon-green"
  },
  {
    label: "Assigned",
    key: "assignedAssets",
    icon: UsersIcon,
    toneClass: "dashboard-summary-icon-violet"
  },
  {
    label: "Damaged",
    key: "damagedAssets",
    icon: AlertTriangleIcon,
    toneClass: "dashboard-summary-icon-orange"
  },
  {
    label: "Expired",
    key: "expiredAssets",
    icon: ClockIcon,
    toneClass: "dashboard-summary-icon-red"
  }
];

const STATUS_COLORS = {
  available: "#10b981",
  assigned: "#8b5cf6",
  damaged: "#f97316",
  expired: "#ef4444"
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

function normalizeText(value) {
  return (value ?? "").trim().toLowerCase();
}

function getStatusColor(label) {
  return STATUS_COLORS[normalizeText(label)] ?? "#60a5fa";
}

function formatAssetCount(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue} ${safeValue === 1 ? "asset" : "assets"}`;
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
    <div
      ref={chartRef}
      className="report-vertical-chart"
      role="list"
      aria-label="Assets by category chart"
    >
      {tooltip?.item ? (
        <div
          className="report-chart-tooltip report-chart-tooltip-follow"
          role="status"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <strong>{tooltip.item.label}</strong>
          <span>{formatAssetCount(tooltip.item.value)}</span>
        </div>
      ) : null}

      {items.map((item) => {
        const isActive = tooltip?.item?.label === item.label;
        const height = maximum > 0 ? Math.max(10, Math.round((item.value / maximum) * 100)) : 0;

        return (
          <div
            key={item.label}
            aria-label={`${item.label}: ${formatAssetCount(item.value)}`}
            className={`report-vertical-bar-group${isActive ? " is-active" : ""}`}
            onBlur={hideTooltip}
            onFocus={(event) => showTooltipFromFocus(event, item)}
            onMouseEnter={(event) => showTooltipFromPointer(event, item)}
            onMouseLeave={hideTooltip}
            onMouseMove={(event) => showTooltipFromPointer(event, item)}
            role="listitem"
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
  const [activeLabel, setActiveLabel] = useState("");
  let currentAngle = 0;
  const activeItem = items.find((item) => item.label === activeLabel) ?? null;

  return (
    <div className="report-donut-layout">
      <div className="report-donut-graphic">
        {activeItem ? (
          <div className="report-chart-tooltip report-chart-tooltip-donut" role="status">
            <strong>{activeItem.label}</strong>
            <span>
              {formatAssetCount(activeItem.value)}
              {total > 0 ? ` | ${((activeItem.value / total) * 100).toFixed(1)}%` : ""}
            </span>
          </div>
        ) : null}

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
                aria-label={`${item.label}: ${formatAssetCount(item.value)}`}
                className={`report-donut-slice${activeItem?.label === item.label ? " is-active" : ""}`}
                d={describeArc(110, 110, 76, startAngle, Math.max(endAngle - 0.8, startAngle + 0.8))}
                stroke={item.color}
                strokeWidth="28"
                strokeLinecap="round"
                fill="none"
                onBlur={() => setActiveLabel((current) => (current === item.label ? "" : current))}
                onFocus={() => setActiveLabel(item.label)}
                onMouseEnter={() => setActiveLabel(item.label)}
                onMouseLeave={() => setActiveLabel((current) => (current === item.label ? "" : current))}
                tabIndex={0}
              />
            );
          })}
        </svg>

        <div className="report-donut-center">
          <strong>{activeItem ? activeItem.value : total}</strong>
          <span>{activeItem ? activeItem.label : "Total"}</span>
        </div>
      </div>

      <div className="report-donut-legend">
        {items.map((item) => (
          <div
            key={item.label}
            className={`report-donut-legend-item${activeItem?.label === item.label ? " is-active" : ""}`}
            onBlur={() => setActiveLabel((current) => (current === item.label ? "" : current))}
            onFocus={() => setActiveLabel(item.label)}
            onMouseEnter={() => setActiveLabel(item.label)}
            onMouseLeave={() => setActiveLabel((current) => (current === item.label ? "" : current))}
            tabIndex={0}
          >
            <span className="report-donut-legend-swatch" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCategoryIcon(categoryName) {
  const normalized = normalizeText(categoryName);

  if (normalized === "laptop") {
    return LaptopIcon;
  }

  if (normalized === "desktop") {
    return MonitorIcon;
  }

  if (normalized === "printer") {
    return PrinterIcon;
  }

  if (normalized === "ups") {
    return BatteryIcon;
  }

  if (normalized === "photocopier") {
    return CopyIcon;
  }

  if (normalized === "plotter") {
    return LayoutIcon;
  }

  return PackageIcon;
}

function getCategoryToneClass(categoryName) {
  const normalized = normalizeText(categoryName);

  if (normalized === "laptop") {
    return "dashboard-category-icon-blue";
  }

  if (normalized === "desktop") {
    return "dashboard-category-icon-violet";
  }

  if (normalized === "printer") {
    return "dashboard-category-icon-green";
  }

  if (normalized === "ups") {
    return "dashboard-category-icon-yellow";
  }

  if (normalized === "photocopier") {
    return "dashboard-category-icon-pink";
  }

  if (normalized === "plotter") {
    return "dashboard-category-icon-indigo";
  }

  return "dashboard-category-icon-slate";
}

export default function DashboardOverview({ user, setPageError, refreshKey = 0 }) {
  const [summaryReport, setSummaryReport] = useState(null);
  const [detailedRows, setDetailedRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [breakdownModal, setBreakdownModal] = useState({
    open: false,
    title: "",
    items: []
  });

  const authHeaders = {
    Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoading(true);

      try {
        const [summaryPayload, detailedPayload] = await Promise.all([
          fetch(`${API_BASE_URL}/api/reports/summary`, {
            method: "GET",
            headers: authHeaders
          }).then(parseResponse),
          fetch(
            `${API_BASE_URL}/api/reports/detailed?search=&category=All&status=All&sortBy=assetId&sortDir=asc&page=0&size=5000`,
            {
              method: "GET",
              headers: authHeaders
            }
          ).then(parseResponse)
        ]);

        if (!isMounted) {
          return;
        }

        setSummaryReport(summaryPayload);
        setDetailedRows(Array.isArray(detailedPayload?.items) ? detailedPayload.items : []);
      } catch (error) {
        if (isMounted) {
          setPageError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey, user?.token, user?.tokenType, setPageError]);

  const statusItems = useMemo(
    () => (Array.isArray(summaryReport?.statusBreakdown) ? summaryReport.statusBreakdown : []).map((item) => ({
      ...item,
      color: getStatusColor(item.label)
    })),
    [summaryReport]
  );

  const categoryItems = useMemo(
    () => Array.isArray(summaryReport?.categoryBreakdown) ? summaryReport.categoryBreakdown : [],
    [summaryReport]
  );

  const summaryCards = useMemo(
    () => SUMMARY_CARD_CONFIG.map((item) => ({
      ...item,
      count: summaryReport?.[item.key] ?? 0
    })),
    [summaryReport]
  );

  const buildBreakdownItems = (cardLabel) => {
    const normalizedLabel = normalizeText(cardLabel);
    const filteredRows =
      normalizedLabel === "total assets"
        ? detailedRows
        : detailedRows.filter((item) => normalizeText(item.status) === normalizedLabel);

    const counts = new Map();

    filteredRows.forEach((item) => {
      const label = item.categoryName || "Uncategorized";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((left, right) => right.count - left.count);
  };

  const handleOpenBreakdown = (cardLabel) => {
    const items = buildBreakdownItems(cardLabel);
    setBreakdownModal({
      open: true,
      title: cardLabel,
      items
    });
  };

  return (
    <>
      <header className="asset-page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="dashboard-user">Live overview of asset counts, categories, and status distribution.</p>
        </div>
      </header>

      {isLoading ? (
        <section className="report-toolbar-card">
          <p className="asset-empty-state">Loading dashboard...</p>
        </section>
      ) : (
        <>
          <section className="dashboard-summary-grid">
            {summaryCards.map((item) => (
              <button
                key={item.label}
                className="dashboard-summary-card"
                type="button"
                onClick={() => handleOpenBreakdown(item.label)}
              >
                <div className="dashboard-summary-copy">
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
                <span className={`dashboard-summary-icon ${item.toneClass}`}>
                  <item.icon />
                </span>
              </button>
            ))}
          </section>

          <section className="dashboard-chart-grid">
            <article className="report-chart-card">
              <h2>Assets by Category</h2>
              <VerticalBarChart items={categoryItems} />
            </article>

            <article className="report-chart-card">
              <h2>Asset Status Distribution</h2>
              <DonutChart items={statusItems} total={summaryReport?.totalAssets ?? 0} />
            </article>
          </section>
        </>
      )}

      {breakdownModal.open ? (
        <div className="modal-backdrop">
          <section className="asset-modal dashboard-breakdown-modal">
            <div className="asset-modal-header">
              <div>
                <p className="auth-modal-caption">Dashboard</p>
                <h3>{breakdownModal.title}</h3>
              </div>

              <button
                aria-label="Close category breakdown dialog"
                className="modal-close-button"
                type="button"
                onClick={() => setBreakdownModal({ open: false, title: "", items: [] })}
              >
                X
              </button>
            </div>

            <div className="asset-modal-scroll">
              <section className="dashboard-breakdown-total-card">
                <div className="dashboard-breakdown-total-copy">
                  <span>Total {breakdownModal.title}</span>
                  <strong>{breakdownModal.items.reduce((sum, item) => sum + item.count, 0)}</strong>
                </div>
                <span className="dashboard-summary-icon dashboard-summary-icon-violet">
                  <PackageIcon />
                </span>
              </section>

              {breakdownModal.items.length === 0 ? (
                <p className="asset-empty-state">No assets are available for this breakdown yet.</p>
              ) : (
                <div className="dashboard-breakdown-grid">
                  {breakdownModal.items.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    const percentage = breakdownModal.items.length === 0
                      ? 0
                      : (item.count / breakdownModal.items.reduce((sum, current) => sum + current.count, 0)) * 100;

                    return (
                      <article key={item.category} className="dashboard-breakdown-card">
                        <div className="dashboard-breakdown-card-top">
                          <div>
                            <p>{item.category}</p>
                            <strong>{item.count}</strong>
                          </div>
                          <span className={`dashboard-category-icon ${getCategoryToneClass(item.category)}`}>
                            <CategoryIcon />
                          </span>
                        </div>

                        <div className="dashboard-breakdown-progress">
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                        <small>{percentage.toFixed(1)}% of total</small>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="asset-modal-footer">
              <button
                className="primary-button"
                type="button"
                onClick={() => setBreakdownModal({ open: false, title: "", items: [] })}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
