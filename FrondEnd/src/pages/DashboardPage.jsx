import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AlertTriangleIcon,
  ArmchairIcon,
  BuildingIcon,
  ChevronLeftIcon,
  CirclePlusIcon,
  ClockIcon,
  DashboardIcon,
  EditIcon,
  FileTextIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TrashIcon,
  UploadIcon,
  UserCogIcon,
  UserPlusIcon
} from "../components/AppIcons";
import DashboardOverview from "./DashboardOverview";
import ReportsPanel from "./ReportsPanelFigma";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const MESSAGE_TIMEOUT_MS = 5000;
const SIDEBAR_COLLAPSE_STORAGE_KEY = "asset-portal-sidebar-collapsed";
const MOBILE_BREAKPOINT_PX = 960;
const WARRANTY_ALERT_WINDOW_DAYS = 30;
const DOCUMENT_TYPE_OPTIONS = [
  "Invoice",
  "Warranty",
  "AMC Contract",
  "Repair Bill",
  "Transfer Document",
  "Other"
];
const MAX_DOCUMENT_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png"
]);

const ACTION_CARDS = [
  {
    key: "new-asset",
    icon: CirclePlusIcon,
    title: "New Asset",
    description: "Add a single new asset to the inventory."
  },
  {
    key: "bulk-add",
    icon: CirclePlusIcon,
    title: "Bulk Add Assets",
    description: "Add multiple assets with auto-generated serial numbers."
  },
  {
    key: "edit-asset",
    icon: EditIcon,
    title: "Edit Asset",
    description: "Update asset details, status, and serial information."
  },
  {
    key: "delete-asset",
    icon: TrashIcon,
    title: "Delete Asset",
    description: "Soft-delete an asset and move it to deleted assets history."
  },
  {
    key: "return-asset",
    icon: RotateCcwIcon,
    title: "Return Asset",
    description: "Process asset returns from employees."
  },
  {
    key: "mark-expired",
    icon: ClockIcon,
    title: "Mark as Expired",
    description: "Mark an asset as expired or out of warranty."
  },
  {
    key: "mark-damaged",
    icon: AlertTriangleIcon,
    title: "Mark as Damaged",
    description: "Report asset damage and severity."
  },
  {
    key: "assign-asset",
    icon: UserPlusIcon,
    title: "Assign Asset",
    description: "Assign an asset to an employee or section."
  },
  {
    key: "reassign-asset",
    icon: RefreshCwIcon,
    title: "Reassign Asset",
    description: "Transfer an assigned asset to a new employee or section."
  }
];

const ADMIN_ACTION_CARDS = [
  {
    key: "add-category",
    icon: PackageIcon,
    title: "Add Category",
    description: "Create new asset categories for future asset entries."
  },
  {
    key: "add-section",
    icon: BuildingIcon,
    title: "Add Section",
    description: "Create sections that can be used during asset assignment."
  },
  {
    key: "add-seat",
    icon: ArmchairIcon,
    title: "Add Seat Number",
    description: "Save seat numbers and link them to the correct section."
  },
  {
    key: "admin-profile",
    icon: UserCogIcon,
    title: "Admin Profile",
    description: "Update the admin name and change the account password."
  }
];

const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", type: "panel", icon: DashboardIcon },
  { key: "asset-management", label: "Asset Management", type: "panel", icon: PackageIcon },
  { key: "admin-control", label: "Admin Control", type: "panel", icon: ShieldCheckIcon },
  { key: "reports", label: "Reports", type: "panel", icon: FileTextIcon },
  { key: "logout", label: "Logout", type: "logout", icon: LogOutIcon }
];

const createEmptyAssetForm = () => ({
  assetName: "",
  categoryId: "",
  brand: "",
  model: "",
  serialNumber: "",
  purchaseDate: "",
  warrantyExpiryDate: "",
  status: "Available",
  remarks: ""
});

const createEmptyBulkAssetForm = () => ({
  assetName: "",
  categoryId: "",
  brand: "",
  model: "",
  purchaseDate: "",
  warrantyExpiryDate: "",
  status: "Available",
  quantity: "",
  remarks: ""
});

const createEmptyQueuedDocumentDraft = () => ({
  documentType: ""
});

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const createEmptyAssignAssetForm = () => ({
  assetId: "",
  category: "",
  assignedTo: "",
  section: "",
  seatNumber: "",
  dateOfIssue: getTodayDateString(),
  status: "Assigned",
  remarks: ""
});

const createEmptyReturnAssetForm = () => ({
  assetId: "",
  category: "",
  assignedTo: "",
  section: "",
  seatNumber: "",
  dateOfIssue: "",
  returnDate: getTodayDateString(),
  conditionAtReturn: "Good",
  remarks: ""
});

const createEmptyReassignAssetForm = () => ({
  assetId: "",
  category: "",
  currentAssignedTo: "",
  currentSection: "",
  currentSeatNumber: "",
  assignedTo: "",
  section: "",
  seatNumber: "",
  dateOfIssue: getTodayDateString(),
  remarks: ""
});

const createEmptyDeleteAssetForm = () => ({
  assetId: "",
  reason: ""
});

const createEmptyExpiredAssetForm = () => ({
  assetId: "",
  category: "",
  expiryDate: getTodayDateString(),
  reason: "",
  remarks: ""
});

const createEmptyDamagedAssetForm = () => ({
  assetId: "",
  category: "",
  damageDate: getTodayDateString(),
  damageDescription: "",
  severity: "Minor",
  remarks: ""
});

const createEmptyEditAssetForm = () => ({
  assetId: "",
  assetDisplayId: "",
  assetName: "",
  categoryId: "",
  brand: "",
  model: "",
  serialNumber: "",
  purchaseDate: "",
  warrantyExpiryDate: "",
  status: "Available",
  assignedTo: "",
  remarks: "",
  originalSerialNumber: "",
  originalStatus: ""
});

const createEmptySectionForm = () => ({
  id: "",
  sectionName: "",
  sectionCode: "",
  description: ""
});

const createEmptyCategoryForm = () => ({
  name: ""
});

const createEmptySeatNumberForm = () => ({
  id: "",
  seatNumber: "",
  sectionId: "",
  description: ""
});

const createAdminNameForm = (username = "") => ({
  newName: username
});

const createEmptyAdminPasswordForm = () => ({
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: ""
});

const SEAT_REQUIRED_CATEGORIES = new Set(["desktop", "printer", "ups"]);

function shouldConfirmUnusualStatusChange(originalStatus, nextStatus) {
  const previous = (originalStatus ?? "").trim().toLowerCase();
  const next = (nextStatus ?? "").trim().toLowerCase();

  return (
    previous !== next &&
    (
      (previous === "damaged" && next === "available") ||
      (previous === "expired" && (next === "available" || next === "assigned")) ||
      (previous === "assigned" && next === "expired")
    )
  );
}

function normalizeText(value) {
  return (value ?? "").trim().toLowerCase();
}

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

function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDisplayDate(value) {
  if (!value) {
    return "";
  }

  const parsedDate = parseLocalDate(value);

  return parsedDate
    ? parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
    : value;
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 KB";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(2)} KB`;
}

function validateSelectedDocumentFile(file) {
  if (!file) {
    return "Select a file to upload.";
  }

  if (!ALLOWED_DOCUMENT_MIME_TYPES.has((file.type ?? "").toLowerCase())) {
    return "Only PDF, JPG, and PNG files are supported.";
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return "File size exceeds 5MB. Upload a smaller file.";
  }

  return "";
}

function buildQueuedDocument(documentType, file) {
  return {
    id: `${documentType}-${file.name}-${file.size}-${Date.now()}`,
    documentType,
    file
  };
}

function buildBatchIdentifier() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `batch-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export default function DashboardPage() {
  const { user, logout, updateSession } = useAuth();
  const [activePanel, setActivePanel] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth <= MOBILE_BREAKPOINT_PX;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [assetSummary, setAssetSummary] = useState({
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0,
    damagedAssets: 0,
    expiredAssets: 0
  });
  const [warrantyAlerts, setWarrantyAlerts] = useState({
    overdue: [],
    dueSoon: []
  });
  const [isLoadingEditableAssets, setIsLoadingEditableAssets] = useState(false);
  const [isLoadingActiveAssets, setIsLoadingActiveAssets] = useState(false);
  const [isLoadingWarrantyAlerts, setIsLoadingWarrantyAlerts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [isLoadingSeatNumbers, setIsLoadingSeatNumbers] = useState(true);
  const [isLoadingAvailableAssets, setIsLoadingAvailableAssets] = useState(false);
  const [isLoadingAssignedAssets, setIsLoadingAssignedAssets] = useState(false);
  const [isLoadingDeletableAssets, setIsLoadingDeletableAssets] = useState(false);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [isSavingBulkAssets, setIsSavingBulkAssets] = useState(false);
  const [isSavingEditAsset, setIsSavingEditAsset] = useState(false);
  const [isSavingAssignAsset, setIsSavingAssignAsset] = useState(false);
  const [isSavingReassignAsset, setIsSavingReassignAsset] = useState(false);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);
  const [isRestoringAsset, setIsRestoringAsset] = useState(false);
  const [isSavingDamagedAsset, setIsSavingDamagedAsset] = useState(false);
  const [isSavingExpiredAsset, setIsSavingExpiredAsset] = useState(false);
  const [isSavingReturnAsset, setIsSavingReturnAsset] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isSavingSeatNumber, setIsSavingSeatNumber] = useState(false);
  const [isSavingAdminName, setIsSavingAdminName] = useState(false);
  const [isSavingAdminPassword, setIsSavingAdminPassword] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [assetForm, setAssetForm] = useState(createEmptyAssetForm);
  const [bulkAssetForm, setBulkAssetForm] = useState(createEmptyBulkAssetForm);
  const [assetDocuments, setAssetDocuments] = useState([]);
  const [bulkDocuments, setBulkDocuments] = useState([]);
  const [assetDocumentDraft, setAssetDocumentDraft] = useState(createEmptyQueuedDocumentDraft);
  const [bulkDocumentDraft, setBulkDocumentDraft] = useState(createEmptyQueuedDocumentDraft);
  const [editAssetForm, setEditAssetForm] = useState(createEmptyEditAssetForm);
  const [assignAssetForm, setAssignAssetForm] = useState(createEmptyAssignAssetForm);
  const [reassignAssetForm, setReassignAssetForm] = useState(createEmptyReassignAssetForm);
  const [deleteAssetForm, setDeleteAssetForm] = useState(createEmptyDeleteAssetForm);
  const [returnAssetForm, setReturnAssetForm] = useState(createEmptyReturnAssetForm);
  const [damagedAssetForm, setDamagedAssetForm] = useState(createEmptyDamagedAssetForm);
  const [expiredAssetForm, setExpiredAssetForm] = useState(createEmptyExpiredAssetForm);
  const [categoryForm, setCategoryForm] = useState(createEmptyCategoryForm);
  const [sectionForm, setSectionForm] = useState(createEmptySectionForm);
  const [seatNumberForm, setSeatNumberForm] = useState(createEmptySeatNumberForm);
  const [adminNameForm, setAdminNameForm] = useState(() => createAdminNameForm(user?.username ?? ""));
  const [adminPasswordForm, setAdminPasswordForm] = useState(createEmptyAdminPasswordForm);
  const [adminProfileTab, setAdminProfileTab] = useState("name");
  const [editableAssets, setEditableAssets] = useState([]);
  const [activeAssets, setActiveAssets] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [deletableAssets, setDeletableAssets] = useState([]);
  const [seatNumbers, setSeatNumbers] = useState([]);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const [serialAvailability, setSerialAvailability] = useState({
    isChecking: false,
    available: true,
    message: ""
  });
  const [editStatusConfirmed, setEditStatusConfirmed] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [modalError, setModalError] = useState("");
  const isAssetFormModal =
    activeModal?.key === "new-asset" ||
    activeModal?.key === "bulk-add" ||
    activeModal?.key === "edit-asset" ||
    activeModal?.key === "assign-asset" ||
    activeModal?.key === "reassign-asset" ||
    activeModal?.key === "delete-asset" ||
    activeModal?.key === "mark-damaged" ||
    activeModal?.key === "mark-expired" ||
    activeModal?.key === "return-asset" ||
    activeModal?.key === "add-category" ||
    activeModal?.key === "add-section" ||
    activeModal?.key === "add-seat" ||
    activeModal?.key === "admin-profile";
  const isSerialNumberChanged =
    editAssetForm.assetId &&
    editAssetForm.serialNumber.trim() !== editAssetForm.originalSerialNumber.trim();
  const isUnusualEditStatusChange = shouldConfirmUnusualStatusChange(
    editAssetForm.originalStatus,
    editAssetForm.status
  );
  const isAssetPanel = activePanel === "asset-management";
  const isDashboardPanel = activePanel === "dashboard";
  const isAdminPanel = activePanel === "admin-control";
  const isReportsPanel = activePanel === "reports";
  const currentSidebarLabel =
    SIDEBAR_ITEMS.find((item) => item.key === activePanel)?.label ?? "Asset Management";
  const layoutClassName = [
    "asset-layout",
    !isMobileViewport && isSidebarCollapsed ? "asset-layout-sidebar-collapsed" : "",
    isMobileSidebarOpen ? "asset-layout-mobile-sidebar-open" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const sidebarClassName = [
    "asset-sidebar",
    isMobileSidebarOpen ? "asset-sidebar-mobile-open" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const sectionNameConflict = sections.find((section) => (
    normalizeText(section.sectionName) === normalizeText(sectionForm.sectionName) &&
    String(section.id) !== String(sectionForm.id)
  ));
  const categoryNameConflict = categories.find((category) => (
    normalizeText(category.name) === normalizeText(categoryForm.name)
  ));
  const selectedAssignSection = sections.find(
    (section) => normalizeText(section.sectionName) === normalizeText(assignAssetForm.section)
  );
  const selectedReassignAsset = assignedAssets.find(
    (asset) => String(asset.assetId) === String(reassignAssetForm.assetId)
  );
  const selectedDeleteAsset = deletableAssets.find(
    (asset) => String(asset.assetId) === String(deleteAssetForm.assetId)
  );
  const selectedReassignSection = sections.find(
    (section) => normalizeText(section.sectionName) === normalizeText(reassignAssetForm.section)
  );
  const assignAssetRequiresSeatNumber = SEAT_REQUIRED_CATEGORIES.has(normalizeText(assignAssetForm.category));
  const reassignAssetRequiresSeatNumber = SEAT_REQUIRED_CATEGORIES.has(normalizeText(reassignAssetForm.category));
  const reassignAssetShowsEmployeeName = ["laptop", "desktop"].includes(
    normalizeText(reassignAssetForm.category)
  );
  const assignSeatNumbersForSection = selectedAssignSection
    ? seatNumbers.filter((seat) => seat.sectionId === selectedAssignSection.id)
    : [];
  const reassignSeatNumbersForSection = selectedReassignSection
    ? seatNumbers.filter((seat) => seat.sectionId === selectedReassignSection.id)
    : [];
  const seatNumberConflict = seatNumbers.find((seat) => (
    normalizeText(seat.seatNumber) === normalizeText(seatNumberForm.seatNumber) &&
    String(seat.id) !== String(seatNumberForm.id)
  ));
  const warrantyOverdueCount = warrantyAlerts.overdue.length;
  const warrantyDueSoonCount = warrantyAlerts.dueSoon.length;
  const nearestWarrantyAlert = warrantyAlerts.overdue[0] ?? warrantyAlerts.dueSoon[0] ?? null;

  const authHeaders = {
    Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`
  };

  const fetchAssetSummary = async () => {
    const response = await fetch(`${API_BASE_URL}/api/assets/summary`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    setAssetSummary({
      totalAssets: payload?.totalAssets ?? 0,
      availableAssets: payload?.availableAssets ?? 0,
      assignedAssets: payload?.assignedAssets ?? 0,
      damagedAssets: payload?.damagedAssets ?? 0,
      expiredAssets: payload?.expiredAssets ?? 0
    });
  };

  const fetchWarrantyAlerts = async () => {
    const params = new URLSearchParams({
      search: "",
      category: "All",
      status: "All",
      sortBy: "warrantyExpiryDate",
      sortDir: "asc",
      page: "0",
      size: "5000"
    });
    const response = await fetch(`${API_BASE_URL}/api/reports/detailed?${params}`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const activeStatuses = new Set(["available", "assigned"]);
    const today = startOfDay(new Date());
    const soonThreshold = new Date(today);
    soonThreshold.setDate(soonThreshold.getDate() + WARRANTY_ALERT_WINDOW_DAYS);

    const categorizedAlerts = items.reduce((accumulator, item) => {
      const warrantyDate = parseLocalDate(item.warrantyExpiryDate);
      const normalizedStatus = normalizeText(item.status);

      if (!warrantyDate || !activeStatuses.has(normalizedStatus)) {
        return accumulator;
      }

      const alertItem = {
        assetId: item.assetId,
        assetDisplayId: item.assetDisplayId,
        assetName: item.assetName,
        categoryName: item.categoryName,
        warrantyExpiryDate: item.warrantyExpiryDate,
        status: item.status
      };

      if (warrantyDate < today) {
        accumulator.overdue.push(alertItem);
      } else if (warrantyDate <= soonThreshold) {
        accumulator.dueSoon.push(alertItem);
      }

      return accumulator;
    }, { overdue: [], dueSoon: [] });

    setWarrantyAlerts(categorizedAlerts);
  };

  const refreshAssetInsights = async () => {
    await Promise.all([fetchAssetSummary(), fetchWarrantyAlerts()]);
  };

  const handleAssetDataChanged = async () => {
    await refreshAssetInsights();
    setReportRefreshKey((current) => current + 1);
  };

  const fetchEditableAssets = async () => {
    const response = await fetch(`${API_BASE_URL}/api/assets/editable`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload) ? payload : [];
  };

  const fetchActiveAssets = async () => {
    const response = await fetch(`${API_BASE_URL}/api/assets/active`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload) ? payload : [];
  };

  const fetchAvailableAssets = async () => {
    const response = await fetch(`${API_BASE_URL}/api/assets/available`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload) ? payload : [];
  };

  const fetchAssignedAssets = async () => {
    const response = await fetch(`${API_BASE_URL}/api/assets/assigned`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload) ? payload : [];
  };

  const fetchDeletableAssets = async () => {
    const response = await fetch(`${API_BASE_URL}/api/assets/deletable`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload) ? payload : [];
  };

  const fetchCategories = async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload) ? payload : [];
  };

  const refreshCategoriesData = async () => {
    const payload = await fetchCategories();
    setCategories(payload);
    return payload;
  };

  const fetchSections = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/sections`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload) ? payload : [];
  };

  const refreshSectionsData = async () => {
    const payload = await fetchSections();
    setSections(payload);
    return payload;
  };

  const fetchSeatNumbers = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/seats`, {
      method: "GET",
      headers: authHeaders
    });

    const payload = await parseResponse(response);
    return Array.isArray(payload) ? payload : [];
  };

  const refreshSeatNumbersData = async () => {
    const payload = await fetchSeatNumbers();
    setSeatNumbers(payload);
    return payload;
  };

  const uploadSingleAssetDocument = async (assetId, queuedDocument) => {
    const formData = new FormData();
    formData.append("file", queuedDocument.file);
    formData.append("documentType", queuedDocument.documentType);

    const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}/documents`, {
      method: "POST",
      headers: {
        Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`
      },
      body: formData
    });

    return parseResponse(response);
  };

  const uploadAssetDocuments = async (assetId, queuedDocuments) => {
    if (!assetId || queuedDocuments.length === 0) {
      return [];
    }

    const uploads = [];

    for (const queuedDocument of queuedDocuments) {
      uploads.push(await uploadSingleAssetDocument(assetId, queuedDocument));
    }

    return uploads;
  };

  const uploadSharedDocumentsToAssets = async (assetIds, queuedDocuments) => {
    if (!Array.isArray(assetIds) || assetIds.length === 0 || queuedDocuments.length === 0) {
      return [];
    }

    const batchId = buildBatchIdentifier();
    const uploads = [];

    for (const queuedDocument of queuedDocuments) {
      const formData = new FormData();
      formData.append("file", queuedDocument.file);
      formData.append("documentType", queuedDocument.documentType);
      formData.append("batchId", batchId);
      assetIds.forEach((assetId) => {
        formData.append("assetIds", String(assetId));
      });

      const response = await fetch(`${API_BASE_URL}/api/assets/documents/bulk`, {
        method: "POST",
        headers: {
          Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`
        },
        body: formData
      });

      uploads.push(await parseResponse(response));
    }

    return uploads;
  };

  const getSectionOptionLabel = (section) => {
    const code = (section?.sectionCode ?? "").trim();
    return code ? `${section.sectionName} (${code})` : section.sectionName;
  };

  const toggleSidebar = () => {
    if (isMobileViewport) {
      setIsMobileSidebarOpen((current) => !current);
      return;
    }

    setIsSidebarCollapsed((current) => !current);
  };

  const openLogoutConfirmation = () => {
    setModalError("");
    setIsMobileSidebarOpen(false);
    setActiveModal({
      key: "logout-confirm",
      title: "Logout"
    });
  };

  const handleConfirmLogout = () => {
    closeModal();
    logout();
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(isSidebarCollapsed));
    } catch {
      // Ignore storage errors and keep the current UI state in memory.
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT_PX;
      setIsMobileViewport(isMobile);

      if (!isMobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!pageError && !pageNotice) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPageError("");
      setPageNotice("");
    }, MESSAGE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pageError, pageNotice]);

  useEffect(() => {
    if (!modalError) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setModalError("");
    }, MESSAGE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [modalError]);

  useEffect(() => {
    if (
      activeModal?.key !== "edit-asset" ||
      !editAssetForm.assetId ||
      !editAssetForm.originalSerialNumber ||
      editAssetForm.serialNumber.trim() === editAssetForm.originalSerialNumber.trim()
    ) {
      setSerialAvailability({
        isChecking: false,
        available: true,
        message: ""
      });
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setSerialAvailability({
        isChecking: true,
        available: true,
        message: "Checking serial number..."
      });

      try {
        const params = new URLSearchParams({
          serialNumber: editAssetForm.serialNumber,
          excludeAssetId: editAssetForm.assetId
        });
        const response = await fetch(`${API_BASE_URL}/api/assets/serial-availability?${params}`, {
          method: "GET",
          headers: authHeaders
        });
        const payload = await parseResponse(response);

        setSerialAvailability({
          isChecking: false,
          available: Boolean(payload?.available),
          message: payload?.message ?? ""
        });
      } catch (error) {
        setSerialAvailability({
          isChecking: false,
          available: false,
          message: error.message
        });
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    activeModal,
    user?.token,
    user?.tokenType,
    editAssetForm.assetId,
    editAssetForm.originalSerialNumber,
    editAssetForm.serialNumber
  ]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    if (activeModal || (isMobileViewport && isMobileSidebarOpen)) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [activeModal, isMobileSidebarOpen, isMobileViewport]);

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      setIsLoadingCategories(true);
      setIsLoadingSections(true);
      setIsLoadingSeatNumbers(true);
      setIsLoadingWarrantyAlerts(true);

      try {
        const [categoryPayload, summaryPayload, sectionPayload, seatNumberPayload, warrantyPayload] = await Promise.all([
          fetchCategories(),
          fetch(`${API_BASE_URL}/api/assets/summary`, {
            method: "GET",
            headers: authHeaders
          }).then(parseResponse),
          fetchSections(),
          fetchSeatNumbers(),
          fetch(`${API_BASE_URL}/api/reports/detailed?search=&category=All&status=All&sortBy=warrantyExpiryDate&sortDir=asc&page=0&size=5000`, {
            method: "GET",
            headers: authHeaders
          }).then(parseResponse)
        ]);

        if (isMounted) {
          const activeStatuses = new Set(["available", "assigned"]);
          const today = startOfDay(new Date());
          const soonThreshold = new Date(today);
          soonThreshold.setDate(soonThreshold.getDate() + WARRANTY_ALERT_WINDOW_DAYS);
          const warrantyItems = Array.isArray(warrantyPayload?.items) ? warrantyPayload.items : [];
          const nextWarrantyAlerts = warrantyItems.reduce((accumulator, item) => {
            const warrantyDate = parseLocalDate(item.warrantyExpiryDate);
            const normalizedStatus = normalizeText(item.status);

            if (!warrantyDate || !activeStatuses.has(normalizedStatus)) {
              return accumulator;
            }

            const alertItem = {
              assetId: item.assetId,
              assetDisplayId: item.assetDisplayId,
              assetName: item.assetName,
              categoryName: item.categoryName,
              warrantyExpiryDate: item.warrantyExpiryDate,
              status: item.status
            };

            if (warrantyDate < today) {
              accumulator.overdue.push(alertItem);
            } else if (warrantyDate <= soonThreshold) {
              accumulator.dueSoon.push(alertItem);
            }

            return accumulator;
          }, { overdue: [], dueSoon: [] });

          setCategories(Array.isArray(categoryPayload) ? categoryPayload : []);
          setSections(Array.isArray(sectionPayload) ? sectionPayload : []);
          setSeatNumbers(Array.isArray(seatNumberPayload) ? seatNumberPayload : []);
          setWarrantyAlerts(nextWarrantyAlerts);
          setAssetSummary({
            totalAssets: summaryPayload?.totalAssets ?? 0,
            availableAssets: summaryPayload?.availableAssets ?? 0,
            assignedAssets: summaryPayload?.assignedAssets ?? 0,
            damagedAssets: summaryPayload?.damagedAssets ?? 0,
            expiredAssets: summaryPayload?.expiredAssets ?? 0
          });
        }
      } catch (error) {
        if (isMounted) {
          setPageError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
          setIsLoadingSections(false);
          setIsLoadingSeatNumbers(false);
          setIsLoadingWarrantyAlerts(false);
        }
      }
    };

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [user?.token, user?.tokenType]);

  const openModal = async (card) => {
    if (card.key === "delete-asset") {
      await openDeleteAssetModal();
      return;
    }

    setModalError("");
    setActiveModal(card);

    if (card.key === "new-asset") {
      setAssetForm(createEmptyAssetForm());
      setAssetDocuments([]);
      setAssetDocumentDraft(createEmptyQueuedDocumentDraft());
    }

    if (card.key === "bulk-add") {
      setBulkAssetForm(createEmptyBulkAssetForm());
      setBulkDocuments([]);
      setBulkDocumentDraft(createEmptyQueuedDocumentDraft());
    }

    if (card.key === "edit-asset") {
      setEditAssetForm(createEmptyEditAssetForm());
      setEditStatusConfirmed(false);
      setEditableAssets([]);
      setSerialAvailability({
        isChecking: false,
        available: true,
        message: ""
      });
      setIsLoadingEditableAssets(true);

      try {
        const payload = await fetchEditableAssets();
        setEditableAssets(payload);
      } catch (error) {
        setModalError(error.message);
      } finally {
        setIsLoadingEditableAssets(false);
      }
    }

    if (card.key === "assign-asset") {
      setAssignAssetForm(createEmptyAssignAssetForm());
      setAvailableAssets([]);
      setIsLoadingAvailableAssets(true);

      try {
        const payload = await fetchAvailableAssets();
        setAvailableAssets(payload);
      } catch (error) {
        setModalError(error.message);
      } finally {
        setIsLoadingAvailableAssets(false);
      }
    }

    if (card.key === "reassign-asset") {
      setReassignAssetForm(createEmptyReassignAssetForm());
      setAssignedAssets([]);
      setIsLoadingAssignedAssets(true);

      try {
        const payload = await fetchAssignedAssets();
        setAssignedAssets(payload);
      } catch (error) {
        setModalError(error.message);
      } finally {
        setIsLoadingAssignedAssets(false);
      }
    }

    if (card.key === "mark-damaged") {
      setDamagedAssetForm(createEmptyDamagedAssetForm());
      setActiveAssets([]);
      setIsLoadingActiveAssets(true);

      try {
        const payload = await fetchActiveAssets();
        setActiveAssets(payload);
      } catch (error) {
        setModalError(error.message);
      } finally {
        setIsLoadingActiveAssets(false);
      }
    }

    if (card.key === "mark-expired") {
      setExpiredAssetForm(createEmptyExpiredAssetForm());
      setActiveAssets([]);
      setIsLoadingActiveAssets(true);

      try {
        const payload = await fetchActiveAssets();
        setActiveAssets(payload);
      } catch (error) {
        setModalError(error.message);
      } finally {
        setIsLoadingActiveAssets(false);
      }
    }

    if (card.key === "return-asset") {
      setReturnAssetForm(createEmptyReturnAssetForm());
      setAssignedAssets([]);
      setIsLoadingAssignedAssets(true);

      try {
        const payload = await fetchAssignedAssets();
        setAssignedAssets(payload);
      } catch (error) {
        setModalError(error.message);
      } finally {
        setIsLoadingAssignedAssets(false);
      }
    }

    if (card.key === "add-section") {
      setSectionForm(createEmptySectionForm());
    }

    if (card.key === "add-category") {
      setCategoryForm(createEmptyCategoryForm());
    }

    if (card.key === "add-seat") {
      setSeatNumberForm(createEmptySeatNumberForm());
    }

    if (card.key === "admin-profile") {
      setAdminProfileTab("name");
      setAdminNameForm(createAdminNameForm(user?.username ?? ""));
      setAdminPasswordForm(createEmptyAdminPasswordForm());
    }
  };

  const openDeleteAssetModal = async (asset = null) => {
    setModalError("");
    setDeleteAssetForm({
      assetId: asset?.assetId ? String(asset.assetId) : "",
      reason: ""
    });
    setDeletableAssets([]);
    setActiveModal({
      key: "delete-asset",
      title: "Delete Asset",
      item: asset
    });
    setIsLoadingDeletableAssets(true);

    try {
      const payload = await fetchDeletableAssets();
      setDeletableAssets(payload);

      if (asset?.assetId) {
        const matchingAsset = payload.find(
          (item) => String(item.assetId) === String(asset.assetId)
        );

        if (matchingAsset) {
          setDeleteAssetForm((current) => ({
            ...current,
            assetId: String(matchingAsset.assetId)
          }));
        }
      }
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsLoadingDeletableAssets(false);
    }
  };

  const openRestoreAssetModal = (asset) => {
    setModalError("");
    setActiveModal({
      key: "restore-asset",
      title: "Restore Asset",
      item: asset
    });
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalError("");
    setIsLoadingDeletableAssets(false);
    setIsSavingAsset(false);
    setIsSavingBulkAssets(false);
    setIsSavingEditAsset(false);
    setIsSavingAssignAsset(false);
    setIsSavingReassignAsset(false);
    setIsDeletingAsset(false);
    setIsRestoringAsset(false);
    setIsSavingDamagedAsset(false);
    setIsSavingExpiredAsset(false);
    setIsSavingReturnAsset(false);
    setIsSavingCategory(false);
    setIsSavingSection(false);
    setIsSavingSeatNumber(false);
    setIsSavingAdminName(false);
    setIsSavingAdminPassword(false);
    setEditAssetForm(createEmptyEditAssetForm());
    setAssetDocuments([]);
    setBulkDocuments([]);
    setAssetDocumentDraft(createEmptyQueuedDocumentDraft());
    setBulkDocumentDraft(createEmptyQueuedDocumentDraft());
    setDeleteAssetForm(createEmptyDeleteAssetForm());
    setCategoryForm(createEmptyCategoryForm());
    setSectionForm(createEmptySectionForm());
    setSeatNumberForm(createEmptySeatNumberForm());
    setAdminNameForm(createAdminNameForm(user?.username ?? ""));
    setAdminPasswordForm(createEmptyAdminPasswordForm());
    setAdminProfileTab("name");
    setEditStatusConfirmed(false);
    setDeletableAssets([]);
    setSerialAvailability({
      isChecking: false,
      available: true,
      message: ""
    });
  };

  const handleSidebarItemClick = (item) => {
    if (item.type === "logout") {
      openLogoutConfirmation();
      return;
    }

    setActivePanel(item.key);
    closeModal();
    setIsMobileSidebarOpen(false);

    if (item.key === "admin-control") {
      Promise.all([refreshCategoriesData(), refreshSectionsData(), refreshSeatNumbersData()]).catch((error) => {
        setPageError(error.message);
      });
    }
  };

  const openSectionEditor = (section) => {
    setModalError("");
    setSectionForm({
      id: String(section.id),
      sectionName: section.sectionName ?? "",
      sectionCode: section.sectionCode ?? "",
      description: section.description ?? ""
    });
    setActiveModal({ key: "add-section", title: "Edit Section" });
  };

  const openSeatNumberEditor = (seat) => {
    setModalError("");
    setSeatNumberForm({
      id: String(seat.id),
      seatNumber: seat.seatNumber ?? "",
      sectionId: String(seat.sectionId ?? ""),
      description: seat.description ?? ""
    });
    setActiveModal({ key: "add-seat", title: "Edit Seat Number" });
  };

  const openDeleteDialog = (type, item) => {
    setModalError("");
    setActiveModal({
      key: type === "section" ? "delete-section" : "delete-seat",
      title: type === "section" ? "Delete Section" : "Delete Seat Number",
      item
    });
  };

  const handleAssetFormChange = (event) => {
    const { name, value } = event.target;
    setAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleBulkAssetFormChange = (event) => {
    const { name, value } = event.target;
    setBulkAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleAssetDocumentDraftChange = (event) => {
    const { value } = event.target;
    setModalError("");
    setAssetDocumentDraft({ documentType: value });
  };

  const handleBulkDocumentDraftChange = (event) => {
    const { value } = event.target;
    setModalError("");
    setBulkDocumentDraft({ documentType: value });
  };

  const queueDocumentForAsset = (event, scope) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const isSingleAssetScope = scope === "single";
    const selectedType = isSingleAssetScope
      ? assetDocumentDraft.documentType
      : bulkDocumentDraft.documentType;
    const existingDocuments = isSingleAssetScope ? assetDocuments : bulkDocuments;
    const setDocuments = isSingleAssetScope ? setAssetDocuments : setBulkDocuments;
    const setDraft = isSingleAssetScope ? setAssetDocumentDraft : setBulkDocumentDraft;

    if (!selectedType) {
      setModalError("Select a document type before choosing the file.");
      return;
    }

    if (existingDocuments.some((document) => document.documentType === selectedType)) {
      setModalError(`${selectedType} is already attached. Remove it first to upload a different file.`);
      return;
    }

    const validationMessage = validateSelectedDocumentFile(file);
    if (validationMessage) {
      setModalError(validationMessage);
      return;
    }

    setModalError("");
    setDocuments((current) => [...current, buildQueuedDocument(selectedType, file)]);
    setDraft(createEmptyQueuedDocumentDraft());
  };

  const removeQueuedDocument = (scope, documentId) => {
    setModalError("");

    if (scope === "single") {
      setAssetDocuments((current) => current.filter((document) => document.id !== documentId));
      return;
    }

    setBulkDocuments((current) => current.filter((document) => document.id !== documentId));
  };

  const handleEditAssetFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "assetId") {
      const selectedAsset = editableAssets.find((asset) => String(asset.assetId) === value);

      setEditAssetForm(selectedAsset
        ? {
            assetId: String(selectedAsset.assetId),
            assetDisplayId: selectedAsset.assetDisplayId ?? "",
            assetName: selectedAsset.assetName ?? "",
            categoryId: String(selectedAsset.categoryId ?? ""),
            brand: selectedAsset.brand ?? "",
            model: selectedAsset.model ?? "",
            serialNumber: selectedAsset.serialNumber ?? "",
            purchaseDate: selectedAsset.purchaseDate ?? "",
            warrantyExpiryDate: selectedAsset.warrantyExpiryDate ?? "",
            status: selectedAsset.status ?? "Available",
            assignedTo: selectedAsset.assignedTo ?? "",
            remarks: selectedAsset.remarks ?? "",
            originalSerialNumber: selectedAsset.serialNumber ?? "",
            originalStatus: selectedAsset.status ?? ""
          }
        : createEmptyEditAssetForm());

      setEditStatusConfirmed(false);
      setSerialAvailability({
        isChecking: false,
        available: true,
        message: ""
      });
      return;
    }

    if (name === "status") {
      setEditStatusConfirmed(false);
    }

    setEditAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleAssignAssetFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "assetId") {
      const selectedAsset = availableAssets.find((asset) => String(asset.assetId) === value);

      setAssignAssetForm((current) => ({
        ...current,
        assetId: value,
        category: selectedAsset?.categoryName ?? "",
        seatNumber: ""
      }));

      return;
    }

    if (name === "section") {
      setAssignAssetForm((current) => ({
        ...current,
        section: value,
        seatNumber: ""
      }));

      return;
    }

    setAssignAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleReassignAssetFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "assetId") {
      const selectedAsset = assignedAssets.find((asset) => String(asset.assetId) === value);

      setReassignAssetForm((current) => ({
        ...current,
        assetId: value,
        category: selectedAsset?.categoryName ?? "",
        currentAssignedTo: selectedAsset?.assignedTo ?? "",
        currentSection: selectedAsset?.section ?? "",
        currentSeatNumber: selectedAsset?.seatNumber ?? "",
        assignedTo: selectedAsset?.assignedTo ?? "",
        section: selectedAsset?.section ?? "",
        seatNumber: selectedAsset?.seatNumber ?? ""
      }));

      return;
    }

    if (name === "section") {
      setReassignAssetForm((current) => ({
        ...current,
        section: value,
        seatNumber: ""
      }));

      return;
    }

    setReassignAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleDeleteAssetFormChange = (event) => {
    const { name, value } = event.target;
    setDeleteAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleReturnAssetFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "assetId") {
      const selectedAsset = assignedAssets.find((asset) => String(asset.assetId) === value);

      setReturnAssetForm((current) => ({
        ...current,
        assetId: value,
        category: selectedAsset?.categoryName ?? "",
        assignedTo: selectedAsset?.assignedTo ?? "",
        section: selectedAsset?.section ?? "",
        seatNumber: selectedAsset?.seatNumber ?? "",
        dateOfIssue: selectedAsset?.dateOfIssue ?? ""
      }));

      return;
    }

    setReturnAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleExpiredAssetFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "assetId") {
      const selectedAsset = activeAssets.find((asset) => String(asset.assetId) === value);

      setExpiredAssetForm((current) => ({
        ...current,
        assetId: value,
        category: selectedAsset?.categoryName ?? "",
        expiryDate: selectedAsset?.warrantyExpiryDate ?? current.expiryDate
      }));

      return;
    }

    setExpiredAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleDamagedAssetFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "assetId") {
      const selectedAsset = activeAssets.find((asset) => String(asset.assetId) === value);

      setDamagedAssetForm((current) => ({
        ...current,
        assetId: value,
        category: selectedAsset?.categoryName ?? ""
      }));

      return;
    }

    setDamagedAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleSectionFormChange = (event) => {
    const { name, value } = event.target;
    setModalError("");
    setSectionForm((current) => ({ ...current, [name]: value }));
  };

  const handleCategoryFormChange = (event) => {
    const { name, value } = event.target;
    setModalError("");
    setCategoryForm((current) => ({ ...current, [name]: value }));
  };

  const handleSeatNumberFormChange = (event) => {
    const { name, value } = event.target;
    setModalError("");
    setSeatNumberForm((current) => ({ ...current, [name]: value }));
  };

  const handleAdminNameFormChange = (event) => {
    const { name, value } = event.target;
    setModalError("");
    setAdminNameForm((current) => ({ ...current, [name]: value }));
  };

  const handleAdminPasswordFormChange = (event) => {
    const { name, value } = event.target;
    setModalError("");
    setAdminPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleSaveAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");

    if (
      assetForm.purchaseDate &&
      assetForm.warrantyExpiryDate &&
      assetForm.purchaseDate === assetForm.warrantyExpiryDate
    ) {
      setModalError("Warranty expiry date must be later than the purchase date.");
      return;
    }

    setIsSavingAsset(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/single`, {
        method: "POST",
        headers: {
          Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetName: assetForm.assetName,
          categoryId: Number(assetForm.categoryId),
          brand: assetForm.brand,
          model: assetForm.model,
          serialNumber: assetForm.serialNumber,
          purchaseDate: assetForm.purchaseDate,
          warrantyExpiryDate: assetForm.warrantyExpiryDate,
          remarks: assetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      let documentUploadError = "";

      if (assetDocuments.length > 0) {
        try {
          await uploadAssetDocuments(payload.id, assetDocuments);
        } catch (error) {
          documentUploadError = error.message;
        }
      }

      await handleAssetDataChanged();
      closeModal();
      setPageNotice(
        assetDocuments.length > 0
          ? `Asset "${payload.assetName}" added successfully with ${assetDocuments.length} document${assetDocuments.length === 1 ? "" : "s"}.`
          : `Asset "${payload.assetName}" added successfully.`
      );
      if (documentUploadError) {
        setPageError(`Asset was saved, but the documents could not be uploaded: ${documentUploadError}`);
      }
      setAssetForm(createEmptyAssetForm());
      setAssetDocuments([]);
      setAssetDocumentDraft(createEmptyQueuedDocumentDraft());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handleSaveBulkAssets = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingBulkAssets(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/bulk`, {
        method: "POST",
        headers: {
          Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetName: bulkAssetForm.assetName,
          categoryId: Number(bulkAssetForm.categoryId),
          brand: bulkAssetForm.brand,
          model: bulkAssetForm.model,
          purchaseDate: bulkAssetForm.purchaseDate,
          warrantyExpiryDate: bulkAssetForm.warrantyExpiryDate,
          quantity: Number(bulkAssetForm.quantity),
          remarks: bulkAssetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      const assetCount = Array.isArray(payload) ? payload.length : Number(bulkAssetForm.quantity);
      let documentUploadError = "";

      if (bulkDocuments.length > 0 && Array.isArray(payload) && payload.length > 0) {
        try {
          await uploadSharedDocumentsToAssets(
            payload.map((asset) => asset.id).filter(Boolean),
            bulkDocuments
          );
        } catch (error) {
          documentUploadError = error.message;
        }
      }

      await handleAssetDataChanged();
      closeModal();
      setPageNotice(
        bulkDocuments.length > 0
          ? `${assetCount} assets added successfully, and ${bulkDocuments.length} shared document${bulkDocuments.length === 1 ? "" : "s"} were attached.`
          : `${assetCount} assets added successfully. Serial numbers were generated automatically.`
      );
      if (documentUploadError) {
        setPageError(`Assets were saved, but the shared documents could not be uploaded: ${documentUploadError}`);
      }
      setBulkAssetForm(createEmptyBulkAssetForm());
      setBulkDocuments([]);
      setBulkDocumentDraft(createEmptyQueuedDocumentDraft());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingBulkAssets(false);
    }
  };

  const handleAssignAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingAssignAsset(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/assign`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetId: Number(assignAssetForm.assetId),
          assignedTo: assignAssetForm.assignedTo,
          section: assignAssetForm.section,
          seatNumber: assignAssetForm.seatNumber,
          dateOfIssue: assignAssetForm.dateOfIssue,
          remarks: assignAssetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      await handleAssetDataChanged();
      closeModal();
      setPageNotice(payload.message ?? "Asset assigned successfully.");
      setAssignAssetForm(createEmptyAssignAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingAssignAsset(false);
    }
  };

  const handleReassignAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingReassignAsset(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/reassign`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetId: Number(reassignAssetForm.assetId),
          assignedTo: reassignAssetShowsEmployeeName
            ? reassignAssetForm.assignedTo
            : (reassignAssetForm.assignedTo || reassignAssetForm.currentAssignedTo),
          section: reassignAssetForm.section,
          seatNumber: reassignAssetForm.seatNumber,
          dateOfIssue: reassignAssetForm.dateOfIssue,
          remarks: reassignAssetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      await handleAssetDataChanged();
      closeModal();
      setPageNotice(payload.message ?? "Asset reassigned successfully.");
      setReassignAssetForm(createEmptyReassignAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingReassignAsset(false);
    }
  };

  const handleUpdateAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");

    if (!editAssetForm.assetId) {
      setModalError("Select an asset to edit.");
      return;
    }

    if (isSerialNumberChanged && !serialAvailability.available) {
      setModalError(serialAvailability.message || "Serial number already exists.");
      return;
    }

    if (isUnusualEditStatusChange && !editStatusConfirmed) {
      setModalError("Confirm the unusual status change before updating the asset.");
      return;
    }

    setIsSavingEditAsset(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/${editAssetForm.assetId}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetName: editAssetForm.assetName,
          categoryId: Number(editAssetForm.categoryId),
          brand: editAssetForm.brand,
          model: editAssetForm.model,
          serialNumber: editAssetForm.serialNumber,
          purchaseDate: editAssetForm.purchaseDate,
          warrantyExpiryDate: editAssetForm.warrantyExpiryDate,
          status: editAssetForm.status,
          assignedTo: editAssetForm.assignedTo,
          remarks: editAssetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      await handleAssetDataChanged();
      closeModal();
      setPageNotice(`Asset "${payload.assetName}" updated successfully.`);
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingEditAsset(false);
    }
  };

  const handleDamageAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingDamagedAsset(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/damage`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetId: Number(damagedAssetForm.assetId),
          damageDate: damagedAssetForm.damageDate,
          damageDescription: damagedAssetForm.damageDescription,
          severity: damagedAssetForm.severity,
          remarks: damagedAssetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      await handleAssetDataChanged();
      closeModal();
      setPageNotice(payload.message ?? "Asset marked as damaged successfully.");
      setDamagedAssetForm(createEmptyDamagedAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingDamagedAsset(false);
    }
  };

  const handleReturnAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingReturnAsset(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/return`, {
        method: "POST",
        headers: {
          Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetId: Number(returnAssetForm.assetId),
          returnDate: returnAssetForm.returnDate,
          conditionAtReturn: returnAssetForm.conditionAtReturn,
          remarks: returnAssetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      await handleAssetDataChanged();
      closeModal();
      setPageNotice(payload.message ?? "Asset returned successfully.");
      setReturnAssetForm(createEmptyReturnAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingReturnAsset(false);
    }
  };

  const handleExpireAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingExpiredAsset(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/expire`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetId: Number(expiredAssetForm.assetId),
          expiryDate: expiredAssetForm.expiryDate,
          reason: expiredAssetForm.reason,
          remarks: expiredAssetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      await handleAssetDataChanged();
      closeModal();
      setPageNotice(payload.message ?? "Asset marked as expired successfully.");
      setExpiredAssetForm(createEmptyExpiredAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingExpiredAsset(false);
    }
  };

  const handleDeleteAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsDeletingAsset(true);

    const assetLabel = selectedDeleteAsset?.assetName ?? activeModal?.item?.assetName ?? "Asset";

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/delete`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetId: Number(deleteAssetForm.assetId),
          reason: deleteAssetForm.reason
        })
      });

      const payload = await parseResponse(response);
      await handleAssetDataChanged();
      closeModal();
      setPageNotice(payload.message ?? `Asset "${assetLabel}" deleted successfully.`);
      setDeleteAssetForm(createEmptyDeleteAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsDeletingAsset(false);
    }
  };

  const handleRestoreAsset = async () => {
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsRestoringAsset(true);

    const assetLabel = activeModal?.item?.assetName ?? "Asset";

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/restore`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetId: Number(activeModal?.item?.assetId)
        })
      });

      const payload = await parseResponse(response);
      await handleAssetDataChanged();
      closeModal();
      setPageNotice(payload.message ?? `Asset "${assetLabel}" restored successfully.`);
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsRestoringAsset(false);
    }
  };

  const handleSaveSection = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");

    if (sectionNameConflict) {
      setModalError(`Section name "${sectionForm.sectionName}" already exists.`);
      return;
    }

    setIsSavingSection(true);

    try {
      const response = await fetch(
        sectionForm.id
          ? `${API_BASE_URL}/api/admin/sections/${sectionForm.id}`
          : `${API_BASE_URL}/api/admin/sections`,
        {
        method: sectionForm.id ? "PUT" : "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sectionName: sectionForm.sectionName,
          sectionCode: sectionForm.sectionCode,
          description: sectionForm.description
        })
      });

      const payload = await parseResponse(response);
      await Promise.all([refreshSectionsData(), refreshSeatNumbersData()]);
      closeModal();
      setPageNotice(
        sectionForm.id
          ? `Section "${payload.sectionName}" updated successfully.`
          : `Section "${payload.sectionName}" saved successfully.`
      );
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleSaveCategory = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");

    if (categoryNameConflict) {
      setModalError(`Category name "${categoryForm.name}" already exists.`);
      return;
    }

    setIsSavingCategory(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: categoryForm.name
        })
      });

      const payload = await parseResponse(response);
      await refreshCategoriesData();
      closeModal();
      setPageNotice(`Category "${payload.name}" saved successfully.`);
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSaveSeatNumber = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");

    if (seatNumberConflict) {
      setModalError(
        `Seat number "${seatNumberForm.seatNumber}" already exists under ${seatNumberConflict.sectionName}.`
      );
      return;
    }

    setIsSavingSeatNumber(true);

    try {
      const response = await fetch(
        seatNumberForm.id
          ? `${API_BASE_URL}/api/admin/seats/${seatNumberForm.id}`
          : `${API_BASE_URL}/api/admin/seats`,
        {
        method: seatNumberForm.id ? "PUT" : "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          seatNumber: seatNumberForm.seatNumber,
          sectionId: Number(seatNumberForm.sectionId),
          description: seatNumberForm.description
        })
      });

      const payload = await parseResponse(response);
      await refreshSeatNumbersData();
      closeModal();
      setPageNotice(
        seatNumberForm.id
          ? `Seat number "${payload.seatNumber}" updated successfully.`
          : payload.message ?? "Seat number saved successfully."
      );
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingSeatNumber(false);
    }
  };

  const handleDeleteSection = async () => {
    const section = activeModal?.item;

    if (!section?.id) {
      return;
    }

    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingSection(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/sections/${section.id}`, {
        method: "DELETE",
        headers: authHeaders
      });

      const payload = await parseResponse(response);
      await Promise.all([refreshSectionsData(), refreshSeatNumbersData()]);
      closeModal();
      setPageNotice(payload.message ?? "Section deleted successfully.");
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleDeleteSeatNumber = async () => {
    const seat = activeModal?.item;

    if (!seat?.id) {
      return;
    }

    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingSeatNumber(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/seats/${seat.id}`, {
        method: "DELETE",
        headers: authHeaders
      });

      const payload = await parseResponse(response);
      await refreshSeatNumbersData();
      closeModal();
      setPageNotice(payload.message ?? "Seat number deleted successfully.");
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingSeatNumber(false);
    }
  };

  const handleSaveAdminName = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingAdminName(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/name`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          newName: adminNameForm.newName
        })
      });

      const payload = await parseResponse(response);
      updateSession({
        username: payload.username,
        role: payload.role,
        token: payload.token,
        tokenType: payload.tokenType
      });
      closeModal();
      setPageNotice(payload.message ?? "Admin name updated successfully.");
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingAdminName(false);
    }
  };

  const handleSaveAdminPassword = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
    setIsSavingAdminPassword(true);

    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmNewPassword) {
      setModalError("New password and confirm new password must match.");
      setIsSavingAdminPassword(false);
      return;
    }

    if (adminPasswordForm.currentPassword === adminPasswordForm.newPassword) {
      setModalError("New password must be different from the current password.");
      setIsSavingAdminPassword(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/password`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword: adminPasswordForm.currentPassword,
          newPassword: adminPasswordForm.newPassword,
          confirmNewPassword: adminPasswordForm.confirmNewPassword
        })
      });

      const payload = await parseResponse(response);
      closeModal();
      setPageNotice(payload.message ?? "Password updated successfully.");
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingAdminPassword(false);
    }
  };

  const renderPlaceholderPanel = (title, description) => (
    <>
      <header className="asset-page-header">
        <div>
          <h1>{title}</h1>
          <p className="dashboard-user">{description}</p>
        </div>
      </header>

      <section className="asset-placeholder-card">
        <p className="eyebrow">Coming Soon</p>
        <h2>{title} is ready for the next step.</h2>
        <p>
          We have the Asset Management and Admin Control modules connected first. This area can be
          designed next whenever you want to continue.
        </p>
      </section>
    </>
  );

  const renderDashboardPanel = () => (
    <DashboardOverview
      refreshKey={reportRefreshKey}
      setPageError={setPageError}
      setPageNotice={setPageNotice}
      user={user}
    />
  );

  const renderAssetPanel = () => (
    <>
      <header className="asset-page-header">
        <div>
          <h1>Asset Management</h1>
          <p className="dashboard-user">Manage electronic assets and inventory actions.</p>
        </div>
      </header>

      <section className="asset-summary-grid">
        <article className="asset-summary-card">
          <span>Total Assets</span>
          <strong>{assetSummary.totalAssets}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Available</span>
          <strong>{assetSummary.availableAssets}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Assigned</span>
          <strong>{assetSummary.assignedAssets}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Damaged</span>
          <strong>{assetSummary.damagedAssets}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Expired</span>
          <strong>{assetSummary.expiredAssets}</strong>
        </article>
      </section>

      <section className="asset-actions-grid asset-actions-grid-main">
        {ACTION_CARDS.map((card) => (
          <button
            key={card.key}
            className={
              card.key === "mark-expired" && (warrantyOverdueCount > 0 || warrantyDueSoonCount > 0)
                ? "asset-action-card asset-action-card-alert"
                : card.key === "delete-asset"
                  ? "asset-action-card asset-action-card-danger"
                : "asset-action-card"
            }
            type="button"
            onClick={() => openModal(card)}
          >
            <span className="asset-action-icon">
              <card.icon />
            </span>
            <div className="asset-action-copy">
              <strong>{card.title}</strong>
              <span className="asset-action-description">{card.description}</span>

              {card.key === "mark-expired" ? (
                <div className="asset-action-alerts">
                  {isLoadingWarrantyAlerts ? (
                    <p className="asset-action-alert-line">Checking warranty alerts...</p>
                  ) : warrantyOverdueCount === 0 && warrantyDueSoonCount === 0 ? (
                    <p className="asset-action-alert-line asset-action-alert-line-muted">
                      No warranty alerts right now.
                    </p>
                  ) : (
                    <>
                      {warrantyOverdueCount > 0 ? (
                        <p className="asset-action-alert-line asset-action-alert-line-danger">
                          {warrantyOverdueCount} asset{warrantyOverdueCount === 1 ? "" : "s"} past warranty
                        </p>
                      ) : null}
                      {warrantyDueSoonCount > 0 ? (
                        <p className="asset-action-alert-line asset-action-alert-line-warning">
                          {warrantyDueSoonCount} due within {WARRANTY_ALERT_WINDOW_DAYS} days
                        </p>
                      ) : null}
                      {nearestWarrantyAlert ? (
                        <p className="asset-action-alert-note">
                          Next: {nearestWarrantyAlert.assetDisplayId} • {formatDisplayDate(nearestWarrantyAlert.warrantyExpiryDate)}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </section>
    </>
  );

  const renderAdminPanel = () => (
    <>
      <header className="asset-page-header">
        <div>
          <h1>Admin Control</h1>
          <p className="dashboard-user">
            Manage categories, sections, seat numbers, and profile settings for the administrator account.
          </p>
        </div>
      </header>

      <section className="asset-summary-grid asset-summary-grid-admin">
        <article className="asset-summary-card">
          <span>Current Admin</span>
          <strong>{user?.username ?? "Admin"}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Categories</span>
          <strong>{categories.length}</strong>
        </article>
        <article className="asset-summary-card">
          <span>Sections</span>
          <strong>{sections.length}</strong>
        </article>
      </section>

      <section className="asset-actions-grid asset-actions-grid-admin">
        {ADMIN_ACTION_CARDS.map((card) => (
          <button
            key={card.key}
            className="asset-action-card"
            type="button"
            onClick={() => openModal(card)}
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

      <section className="admin-section-panel">
        <div className="admin-section-panel-header">
          <div>
            <p className="eyebrow">Saved Categories</p>
          </div>
        </div>

        {isLoadingCategories ? (
          <p className="asset-empty-state">Loading categories from the database...</p>
        ) : categories.length === 0 ? (
          <p className="asset-empty-state">
            No categories have been saved yet. Add a category and it will appear here and in the
            asset entry forms.
          </p>
        ) : (
          <div className="admin-section-grid">
            {categories.map((category) => (
              <article key={category.id} className="admin-section-card">
                <strong>{category.name}</strong>
                <span>Available in asset entry dropdowns</span>
                <p>Use this category in Add New Asset and Bulk Add Assets.</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section-panel">
        <div className="admin-section-panel-header">
          <div>
            <p className="eyebrow">Saved Sections</p>
          </div>
        </div>

        {isLoadingSections ? (
          <p className="asset-empty-state">Loading sections from the database...</p>
        ) : sections.length === 0 ? (
          <p className="asset-empty-state">
            No sections have been saved yet. Add a section and it will appear here and in the
            Assign Asset form.
          </p>
        ) : (
          <div className="admin-section-grid">
            {sections.map((section) => (
              <article key={section.id} className="admin-section-card">
                <strong>{section.sectionName}</strong>
                <span>{section.sectionCode ? `Code: ${section.sectionCode}` : "No section code"}</span>
                <p>{section.description || "No description added yet."}</p>
                <div className="admin-card-actions">
                  <button
                    className="secondary-button admin-inline-button"
                    type="button"
                    onClick={() => openSectionEditor(section)}
                  >
                    Edit
                  </button>
                  <button
                    className="secondary-button admin-inline-button admin-inline-button-danger"
                    type="button"
                    onClick={() => openDeleteDialog("section", section)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section-panel">
        <div className="admin-section-panel-header">
          <div>
            <p className="eyebrow">Saved Seat Numbers</p>
          </div>
        </div>

        {isLoadingSeatNumbers ? (
          <p className="asset-empty-state">Loading seat numbers from the database...</p>
        ) : seatNumbers.length === 0 ? (
          <p className="asset-empty-state">
            No seat numbers have been saved yet. Add a seat number and it will appear here.
          </p>
        ) : (
          <div className="admin-section-grid">
            {seatNumbers.map((seat) => (
              <article key={seat.id} className="admin-section-card">
                <strong>{seat.seatNumber}</strong>
                <span>Section: {seat.sectionName}</span>
                <p>{seat.description || "No description added yet."}</p>
                <div className="admin-card-actions">
                  <button
                    className="secondary-button admin-inline-button"
                    type="button"
                    onClick={() => openSeatNumberEditor(seat)}
                  >
                    Edit
                  </button>
                  <button
                    className="secondary-button admin-inline-button admin-inline-button-danger"
                    type="button"
                    onClick={() => openDeleteDialog("seat", seat)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <main className="asset-shell">
      {pageError || pageNotice ? (
        <div className="asset-toast-stack">
          {pageError ? <p className="message error-message">{pageError}</p> : null}
          {pageNotice ? <p className="message success-message">{pageNotice}</p> : null}
        </div>
      ) : null}

      <div className={layoutClassName}>
        <aside className={sidebarClassName}>
          <div className="asset-sidebar-brand">
            <div className="asset-sidebar-brand-copy">
              <h2>Asset Portal</h2>
              <p>{user?.username}</p>
            </div>
            <button
              aria-label={
                isMobileViewport
                  ? "Close navigation menu"
                  : isSidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              className={
                !isMobileViewport && isSidebarCollapsed
                  ? "asset-sidebar-chevron asset-sidebar-chevron-collapsed"
                  : "asset-sidebar-chevron"
              }
              type="button"
              onClick={toggleSidebar}
            >
              <ChevronLeftIcon />
            </button>
          </div>

          <nav className="asset-sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.key}
                className={
                  item.type !== "logout" && item.key === activePanel
                    ? "asset-sidebar-item asset-sidebar-item-active"
                    : "asset-sidebar-item"
                }
                type="button"
                onClick={() => handleSidebarItemClick(item)}
              >
                <span className="asset-sidebar-icon">
                  <item.icon />
                </span>
                <span className="asset-sidebar-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {isMobileViewport ? (
          <button
            aria-label="Close navigation menu"
            className="asset-sidebar-overlay"
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        ) : null}

        <section className="asset-content">
          {isMobileViewport ? (
            <div className="asset-mobile-toolbar">
              <button
                aria-expanded={isMobileSidebarOpen}
                aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                className="asset-mobile-menu-button"
                type="button"
                onClick={() => setIsMobileSidebarOpen((current) => !current)}
              >
                <MenuIcon />
                <span>{isMobileSidebarOpen ? "Close" : "Menu"}</span>
              </button>

              <div className="asset-mobile-toolbar-copy">
                <span>Asset Portal</span>
                <strong>{currentSidebarLabel}</strong>
              </div>
            </div>
          ) : null}

          {isDashboardPanel
            ? renderDashboardPanel()
            : isAssetPanel
            ? renderAssetPanel()
            : isAdminPanel
              ? renderAdminPanel()
              : isReportsPanel
                ? (
                  <ReportsPanel
                    categories={categories}
                    onRequestDeleteAsset={openDeleteAssetModal}
                    onRequestRestoreAsset={openRestoreAssetModal}
                    refreshKey={reportRefreshKey}
                    setPageError={setPageError}
                    setPageNotice={setPageNotice}
                    user={user}
                  />
                )
              : renderPlaceholderPanel(
                  currentSidebarLabel,
                  currentSidebarLabel === "Dashboard"
                    ? "A high-level dashboard view can be added next."
                    : "Reports can be designed once the reporting workflows are finalized."
                )}
        </section>
      </div>

      {activeModal ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <section
            aria-modal="true"
            className={isAssetFormModal ? "asset-modal" : "asset-modal asset-modal-compact"}
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            {activeModal.key === "new-asset" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Add New Asset</h3>
                  </div>

                  <button
                    aria-label="Close add asset dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleSaveAsset}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field">
                        <span>Asset Name</span>
                        <input
                          name="assetName"
                          onChange={handleAssetFormChange}
                          placeholder="Enter asset name"
                          type="text"
                          value={assetForm.assetName}
                        />
                      </label>

                      <label className="field">
                        <span>Category</span>
                        <select
                          name="categoryId"
                          onChange={handleAssetFormChange}
                          value={assetForm.categoryId}
                        >
                          <option value="">
                            {isLoadingCategories ? "Loading categories..." : "Select category"}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Brand</span>
                        <input
                          name="brand"
                          onChange={handleAssetFormChange}
                          placeholder="Enter brand"
                          type="text"
                          value={assetForm.brand}
                        />
                      </label>

                      <label className="field">
                        <span>Model</span>
                        <input
                          name="model"
                          onChange={handleAssetFormChange}
                          placeholder="Enter model"
                          type="text"
                          value={assetForm.model}
                        />
                      </label>

                      <label className="field asset-field-full">
                        <span>Serial Number</span>
                        <input
                          name="serialNumber"
                          onChange={handleAssetFormChange}
                          placeholder="Enter serial number"
                          type="text"
                          value={assetForm.serialNumber}
                        />
                      </label>

                      <label className="field">
                        <span>Purchase Date</span>
                        <input
                          name="purchaseDate"
                          onChange={handleAssetFormChange}
                          type="date"
                          value={assetForm.purchaseDate}
                        />
                      </label>

                      <label className="field">
                        <span>Warranty Expiry Date</span>
                        <input
                          name="warrantyExpiryDate"
                          onChange={handleAssetFormChange}
                          type="date"
                          value={assetForm.warrantyExpiryDate}
                        />
                      </label>

                      <label className="field asset-field-full">
                        <span>Status</span>
                        <input readOnly type="text" value={assetForm.status} />
                      </label>

                      <label className="field asset-field-full">
                        <span>Remarks (Optional)</span>
                        <textarea
                          name="remarks"
                          onChange={handleAssetFormChange}
                          placeholder="Enter remarks"
                          rows="5"
                          value={assetForm.remarks}
                        />
                      </label>
                    </div>

                    <section className="asset-document-panel">
                      <div className="asset-document-panel-header">
                        <div>
                          <h4>Documents (Optional)</h4>
                          <p>Upload invoices, warranty cards, and repair bills for this asset.</p>
                        </div>
                      </div>

                      {assetDocuments.length > 0 ? (
                        <div className="asset-document-list">
                          {assetDocuments.map((document) => (
                            <article key={document.id} className="asset-document-item">
                              <div className="asset-document-item-main">
                                <span className="asset-document-icon">
                                  <FileTextIcon />
                                </span>
                                <div className="asset-document-copy">
                                  <strong>{document.documentType}</strong>
                                  <span>
                                    {document.file.name} ({formatFileSize(document.file.size)})
                                  </span>
                                </div>
                              </div>

                              <button
                                className="asset-document-remove"
                                type="button"
                                onClick={() => removeQueuedDocument("single", document.id)}
                              >
                                Remove
                              </button>
                            </article>
                          ))}
                        </div>
                      ) : null}

                      <div className="asset-document-upload-grid">
                        <label className="field">
                          <span>Document Type</span>
                          <select
                            name="documentType"
                            onChange={handleAssetDocumentDraftChange}
                            value={assetDocumentDraft.documentType}
                          >
                            <option value="">Select document type</option>
                            {DOCUMENT_TYPE_OPTIONS
                              .filter((type) => !assetDocuments.some((document) => document.documentType === type))
                              .map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                          </select>
                        </label>

                        <label
                          className={
                            assetDocumentDraft.documentType
                              ? "asset-upload-trigger"
                              : "asset-upload-trigger asset-upload-trigger-disabled"
                          }
                        >
                          <UploadIcon />
                          <span>Upload</span>
                          <input
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={!assetDocumentDraft.documentType}
                            onChange={(event) => queueDocumentForAsset(event, "single")}
                            type="file"
                          />
                        </label>
                      </div>

                      <p className="asset-document-note">
                        Supports PDF, JPG, and PNG files up to 5MB each.
                      </p>
                    </section>

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={isSavingAsset || isLoadingCategories}
                      type="submit"
                    >
                      {isSavingAsset ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "bulk-add" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Bulk Add Assets</h3>
                  </div>

                  <button
                    aria-label="Close bulk add asset dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleSaveBulkAssets}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field">
                        <span>Asset Name</span>
                        <input
                          name="assetName"
                          onChange={handleBulkAssetFormChange}
                          placeholder="Enter asset name"
                          type="text"
                          value={bulkAssetForm.assetName}
                        />
                      </label>

                      <label className="field">
                        <span>Category</span>
                        <select
                          name="categoryId"
                          onChange={handleBulkAssetFormChange}
                          value={bulkAssetForm.categoryId}
                        >
                          <option value="">
                            {isLoadingCategories ? "Loading categories..." : "Select category"}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Brand</span>
                        <input
                          name="brand"
                          onChange={handleBulkAssetFormChange}
                          placeholder="Enter brand"
                          type="text"
                          value={bulkAssetForm.brand}
                        />
                      </label>

                      <label className="field">
                        <span>Model</span>
                        <input
                          name="model"
                          onChange={handleBulkAssetFormChange}
                          placeholder="Enter model"
                          type="text"
                          value={bulkAssetForm.model}
                        />
                      </label>

                      <label className="field">
                        <span>Purchase Date</span>
                        <input
                          name="purchaseDate"
                          onChange={handleBulkAssetFormChange}
                          type="date"
                          value={bulkAssetForm.purchaseDate}
                        />
                      </label>

                      <label className="field">
                        <span>Warranty Expiry Date</span>
                        <input
                          name="warrantyExpiryDate"
                          onChange={handleBulkAssetFormChange}
                          type="date"
                          value={bulkAssetForm.warrantyExpiryDate}
                        />
                      </label>

                      <label className="field">
                        <span>Status</span>
                        <input readOnly type="text" value={bulkAssetForm.status} />
                      </label>

                      <label className="field">
                        <span>Quantity</span>
                        <input
                          min="1"
                          name="quantity"
                          onChange={handleBulkAssetFormChange}
                          placeholder="Enter quantity"
                          type="number"
                          value={bulkAssetForm.quantity}
                        />
                      </label>

                      <label className="field asset-field-full">
                        <span>Remarks (Optional)</span>
                        <textarea
                          name="remarks"
                          onChange={handleBulkAssetFormChange}
                          placeholder="Enter remarks"
                          rows="5"
                          value={bulkAssetForm.remarks}
                        />
                      </label>
                    </div>

                    <section className="asset-document-panel">
                      <div className="asset-document-panel-header">
                        <div>
                          <h4>Shared Documents (Optional)</h4>
                          <p>
                            These documents will be attached to all {bulkAssetForm.quantity || "0"} assets created in this batch.
                          </p>
                        </div>
                      </div>

                      {bulkDocuments.length > 0 ? (
                        <div className="asset-document-list">
                          {bulkDocuments.map((document) => (
                            <article key={document.id} className="asset-document-item">
                              <div className="asset-document-item-main">
                                <span className="asset-document-icon">
                                  <FileTextIcon />
                                </span>
                                <div className="asset-document-copy">
                                  <strong>{document.documentType}</strong>
                                  <span>
                                    {document.file.name} ({formatFileSize(document.file.size)})
                                  </span>
                                </div>
                              </div>

                              <button
                                className="asset-document-remove"
                                type="button"
                                onClick={() => removeQueuedDocument("bulk", document.id)}
                              >
                                Remove
                              </button>
                            </article>
                          ))}
                        </div>
                      ) : null}

                      <div className="asset-document-upload-grid">
                        <label className="field">
                          <span>Document Type</span>
                          <select
                            name="documentType"
                            onChange={handleBulkDocumentDraftChange}
                            value={bulkDocumentDraft.documentType}
                          >
                            <option value="">Select document type</option>
                            {DOCUMENT_TYPE_OPTIONS
                              .filter((type) => !bulkDocuments.some((document) => document.documentType === type))
                              .map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                          </select>
                        </label>

                        <label
                          className={
                            bulkDocumentDraft.documentType
                              ? "asset-upload-trigger"
                              : "asset-upload-trigger asset-upload-trigger-disabled"
                          }
                        >
                          <UploadIcon />
                          <span>Upload</span>
                          <input
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={!bulkDocumentDraft.documentType}
                            onChange={(event) => queueDocumentForAsset(event, "bulk")}
                            type="file"
                          />
                        </label>
                      </div>

                      <p className="asset-document-note">
                        Supports PDF, JPG, and PNG files up to 5MB each.
                      </p>
                    </section>

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={isSavingBulkAssets || isLoadingCategories}
                      type="submit"
                    >
                      {isSavingBulkAssets ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "edit-asset" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Edit Asset</h3>
                  </div>

                  <button
                    aria-label="Close edit asset dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleUpdateAsset}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Asset ID</span>
                        <select
                          name="assetId"
                          onChange={handleEditAssetFormChange}
                          value={editAssetForm.assetId}
                        >
                          <option value="">
                            {isLoadingEditableAssets
                              ? "Loading assets..."
                              : editableAssets.length === 0
                                ? "No assets available"
                                : "Select asset"}
                          </option>
                          {editableAssets.map((asset) => (
                            <option key={asset.assetId} value={asset.assetId}>
                              {asset.assetDisplayId} - {asset.assetName}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {!isLoadingEditableAssets && editableAssets.length === 0 ? (
                      <p className="asset-empty-state">
                        No assets are available to edit yet. Add or seed assets first, then edit
                        them here.
                      </p>
                    ) : null}

                    {editAssetForm.assetId ? (
                      <div className="asset-form-grid">
                        <label className="field">
                          <span>Asset Name</span>
                          <input
                            name="assetName"
                            onChange={handleEditAssetFormChange}
                            placeholder="Enter asset name"
                            type="text"
                            value={editAssetForm.assetName}
                          />
                        </label>

                        <label className="field">
                          <span>Category</span>
                          <select
                            name="categoryId"
                            onChange={handleEditAssetFormChange}
                            value={editAssetForm.categoryId}
                          >
                            <option value="">
                              {isLoadingCategories ? "Loading categories..." : "Select category"}
                            </option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Brand</span>
                          <input
                            name="brand"
                            onChange={handleEditAssetFormChange}
                            placeholder="Enter brand"
                            type="text"
                            value={editAssetForm.brand}
                          />
                        </label>

                        <label className="field">
                          <span>Model</span>
                          <input
                            name="model"
                            onChange={handleEditAssetFormChange}
                            placeholder="Enter model"
                            type="text"
                            value={editAssetForm.model}
                          />
                        </label>

                        <label className="field asset-field-full">
                          <span>Serial Number</span>
                          <input
                            name="serialNumber"
                            onChange={handleEditAssetFormChange}
                            placeholder="Enter serial number"
                            type="text"
                            value={editAssetForm.serialNumber}
                          />
                        </label>

                        {isSerialNumberChanged ? (
                          <div className="asset-field-full">
                            <p className="asset-inline-warning">
                              Serial number changed. The new value must remain unique.
                            </p>
                            {serialAvailability.message ? (
                              <p
                                className={
                                  serialAvailability.isChecking
                                    ? "asset-inline-warning"
                                    : serialAvailability.available
                                    ? "asset-inline-success"
                                    : "asset-inline-error"
                                }
                              >
                                {serialAvailability.message}
                              </p>
                            ) : null}
                          </div>
                        ) : null}

                        <label className="field">
                          <span>Purchase Date</span>
                          <input
                            name="purchaseDate"
                            onChange={handleEditAssetFormChange}
                            type="date"
                            value={editAssetForm.purchaseDate}
                          />
                        </label>

                        <label className="field">
                          <span>Warranty Expiry Date</span>
                          <input
                            name="warrantyExpiryDate"
                            onChange={handleEditAssetFormChange}
                            type="date"
                            value={editAssetForm.warrantyExpiryDate}
                          />
                        </label>

                        <label className="field asset-field-full">
                          <span>Status</span>
                          <select
                            name="status"
                            onChange={handleEditAssetFormChange}
                            value={editAssetForm.status}
                          >
                            <option value="Available">Available</option>
                            {editAssetForm.originalStatus === "Assigned" ? (
                              <option value="Assigned">Assigned</option>
                            ) : (
                              <option disabled value="Assigned">
                                Assigned (use Assign Asset)
                              </option>
                            )}
                            <option value="Damaged">Damaged</option>
                            <option value="Expired">Expired</option>
                          </select>
                        </label>

                        {isUnusualEditStatusChange ? (
                          <div className="asset-field-full">
                            <p className="asset-inline-warning">
                              Unusual status change detected: {editAssetForm.originalStatus} to{" "}
                              {editAssetForm.status}.
                            </p>
                            <button
                              className={
                                editStatusConfirmed
                                  ? "secondary-button asset-confirm-button is-confirmed"
                                  : "secondary-button asset-confirm-button"
                              }
                              type="button"
                              onClick={() => setEditStatusConfirmed((current) => !current)}
                            >
                              {editStatusConfirmed ? "Confirmed" : "Confirm Status Change"}
                            </button>
                          </div>
                        ) : null}

                        <label className="field asset-field-full">
                          <span>Assigned To</span>
                          <input
                            className={editAssetForm.status === "Assigned" ? "" : "readonly-field"}
                            name="assignedTo"
                            onChange={handleEditAssetFormChange}
                            placeholder={
                              editAssetForm.status === "Assigned"
                                ? "Enter assignee name"
                                : "Available when asset status is Assigned"
                            }
                            readOnly={editAssetForm.status !== "Assigned"}
                            type="text"
                            value={editAssetForm.assignedTo}
                          />
                        </label>

                        <label className="field asset-field-full">
                          <span>Remarks (Optional)</span>
                          <textarea
                            name="remarks"
                            onChange={handleEditAssetFormChange}
                            placeholder="Enter remarks"
                            rows="5"
                            value={editAssetForm.remarks}
                          />
                        </label>
                      </div>
                    ) : null}

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={
                        isSavingEditAsset ||
                        isLoadingEditableAssets ||
                        !editAssetForm.assetId ||
                        (editAssetForm.status === "Assigned" &&
                          (
                            editAssetForm.originalStatus !== "Assigned" ||
                            !editAssetForm.assignedTo.trim()
                          )) ||
                        serialAvailability.isChecking ||
                        (isSerialNumberChanged && !serialAvailability.available) ||
                        (isUnusualEditStatusChange && !editStatusConfirmed)
                      }
                      type="submit"
                    >
                      {isSavingEditAsset ? "Updating..." : "Update"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "mark-damaged" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Mark as Damaged</h3>
                  </div>

                  <button
                    aria-label="Close mark as damaged dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleDamageAsset}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Asset ID</span>
                        <select
                          name="assetId"
                          onChange={handleDamagedAssetFormChange}
                          value={damagedAssetForm.assetId}
                        >
                          <option value="">
                            {isLoadingActiveAssets
                              ? "Loading active assets..."
                              : activeAssets.length === 0
                                ? "No active assets available"
                                : "Select active asset"}
                          </option>
                          {activeAssets.map((asset) => (
                            <option key={asset.assetId} value={asset.assetId}>
                              {asset.assetId} - {asset.assetName} ({asset.serialNumber}) [{asset.status}]
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field asset-field-full">
                        <span>Category</span>
                        <input
                          className="readonly-field"
                          readOnly
                          type="text"
                          value={damagedAssetForm.category}
                        />
                      </label>

                      <label className="field">
                        <span>Damage Date</span>
                        <input
                          name="damageDate"
                          onChange={handleDamagedAssetFormChange}
                          type="date"
                          value={damagedAssetForm.damageDate}
                        />
                      </label>

                      <label className="field">
                        <span>Severity</span>
                        <select
                          name="severity"
                          onChange={handleDamagedAssetFormChange}
                          value={damagedAssetForm.severity}
                        >
                          <option value="Minor">Minor</option>
                          <option value="Major">Major</option>
                        </select>
                      </label>

                      <label className="field asset-field-full">
                        <span>Damage Description</span>
                        <textarea
                          name="damageDescription"
                          onChange={handleDamagedAssetFormChange}
                          placeholder="Describe the damage"
                          rows="5"
                          value={damagedAssetForm.damageDescription}
                        />
                      </label>

                      <label className="field asset-field-full">
                        <span>Remarks (Optional)</span>
                        <textarea
                          name="remarks"
                          onChange={handleDamagedAssetFormChange}
                          placeholder="Enter remarks"
                          rows="5"
                          value={damagedAssetForm.remarks}
                        />
                      </label>
                    </div>

                    {!isLoadingActiveAssets && activeAssets.length === 0 ? (
                      <p className="asset-empty-state">
                        No active assets are available to mark as damaged. Only Available or
                        Assigned assets can be damaged.
                      </p>
                    ) : null}

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={isSavingDamagedAsset || isLoadingActiveAssets || activeAssets.length === 0}
                      type="submit"
                    >
                      {isSavingDamagedAsset ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "assign-asset" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Assign Asset</h3>
                  </div>

                  <button
                    aria-label="Close assign asset dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleAssignAsset}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Asset ID</span>
                        <select
                          name="assetId"
                          onChange={handleAssignAssetFormChange}
                          value={assignAssetForm.assetId}
                        >
                          <option value="">
                            {isLoadingAvailableAssets
                              ? "Loading available assets..."
                              : availableAssets.length === 0
                                ? "No available assets ready to assign"
                                : "Select available asset"}
                          </option>
                          {availableAssets.map((asset) => (
                            <option key={asset.assetId} value={asset.assetId}>
                              {asset.assetId} - {asset.assetName} ({asset.serialNumber})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Category</span>
                        <input
                          className="readonly-field"
                          readOnly
                          type="text"
                          value={assignAssetForm.category}
                        />
                      </label>

                      <label className="field">
                        <span>Status</span>
                        <input
                          className="readonly-field"
                          readOnly
                          type="text"
                          value={assignAssetForm.status}
                        />
                      </label>

                      <label className="field">
                        <span>Assigned To</span>
                        <input
                          name="assignedTo"
                          onChange={handleAssignAssetFormChange}
                          placeholder="Enter employee name"
                          type="text"
                          value={assignAssetForm.assignedTo}
                        />
                      </label>

                      <label className="field">
                        <span>Section</span>
                        <select
                          name="section"
                          onChange={handleAssignAssetFormChange}
                          value={assignAssetForm.section}
                        >
                          <option value="">
                            {isLoadingSections
                              ? "Loading sections..."
                              : sections.length === 0
                                ? "No sections available"
                                : "Select section"}
                          </option>
                          {sections.map((section) => (
                            <option key={section.id} value={section.sectionName}>
                              {getSectionOptionLabel(section)}
                            </option>
                          ))}
                        </select>
                      </label>

                      {assignAssetRequiresSeatNumber ? (
                        <label className="field">
                          <span>Seat Number</span>
                          <select
                            name="seatNumber"
                            onChange={handleAssignAssetFormChange}
                            value={assignAssetForm.seatNumber}
                          >
                            <option value="">
                              {!assignAssetForm.section
                                ? "Select section first"
                                : assignSeatNumbersForSection.length === 0
                                  ? "No seat numbers available"
                                  : "Select seat number"}
                            </option>
                            {assignSeatNumbersForSection.map((seat) => (
                              <option key={seat.id} value={seat.seatNumber}>
                                {seat.seatNumber}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      <label className="field asset-field-full">
                        <span>Date of Issue</span>
                        <input
                          name="dateOfIssue"
                          onChange={handleAssignAssetFormChange}
                          type="date"
                          value={assignAssetForm.dateOfIssue}
                        />
                      </label>

                      <label className="field asset-field-full">
                        <span>Remarks (Optional)</span>
                        <textarea
                          name="remarks"
                          onChange={handleAssignAssetFormChange}
                          placeholder="Enter remarks"
                          rows="5"
                          value={assignAssetForm.remarks}
                        />
                      </label>
                    </div>

                    {!isLoadingAvailableAssets && availableAssets.length === 0 ? (
                      <p className="asset-empty-state">
                        No available assets are ready for assignment yet. Add an asset first, then
                        assign it here.
                      </p>
                    ) : null}

                    {!isLoadingSections && sections.length === 0 ? (
                      <p className="asset-empty-state">
                        No sections are available yet. Add a section in Admin Control before
                        assigning assets.
                      </p>
                    ) : null}

                    {assignAssetRequiresSeatNumber && !assignAssetForm.section ? (
                      <p className="asset-empty-state">
                        This asset category requires a seat number. Select a section first, then
                        choose one of its seat numbers.
                      </p>
                    ) : null}

                    {assignAssetRequiresSeatNumber &&
                    assignAssetForm.section &&
                    assignSeatNumbersForSection.length === 0 ? (
                      <p className="asset-empty-state">
                        No seat numbers are available for the selected section. Add a seat number
                        in Admin Control before assigning this asset.
                      </p>
                    ) : null}

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={
                        isSavingAssignAsset ||
                        isLoadingAvailableAssets ||
                        isLoadingSections ||
                        availableAssets.length === 0 ||
                        sections.length === 0 ||
                        (assignAssetRequiresSeatNumber && !assignAssetForm.seatNumber)
                      }
                      type="submit"
                    >
                      {isSavingAssignAsset ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "reassign-asset" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Reassign Asset</h3>
                  </div>

                  <button
                    aria-label="Close reassign asset dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleReassignAsset}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Asset ID</span>
                        <select
                          name="assetId"
                          onChange={handleReassignAssetFormChange}
                          value={reassignAssetForm.assetId}
                        >
                          <option value="">
                            {isLoadingAssignedAssets
                              ? "Loading assigned assets..."
                              : assignedAssets.length === 0
                                ? "No assigned assets available"
                                : "Select assigned asset"}
                          </option>
                          {assignedAssets.map((asset) => (
                            <option key={asset.assetId} value={asset.assetId}>
                              {(asset.assetDisplayId ?? asset.assetId)} - Currently: {asset.assignedTo || asset.section || "Assigned"}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {!selectedReassignAsset && !isLoadingAssignedAssets && assignedAssets.length > 0 ? (
                      <p className="asset-form-note">
                        After selecting an asset, the reassign fields will load. Seat Number is required only for Desktop, Printer, and UPS assets.
                      </p>
                    ) : null}

                    {selectedReassignAsset ? (
                      <div className="asset-form-grid">
                        <label className="field">
                          <span>Category</span>
                          <input
                            className="readonly-field"
                            readOnly
                            type="text"
                            value={reassignAssetForm.category}
                          />
                        </label>

                        <label className="field">
                          <span>Current Assignee</span>
                          <input
                            className="readonly-field"
                            readOnly
                            type="text"
                            value={reassignAssetForm.currentAssignedTo || reassignAssetForm.currentSection || "-"}
                          />
                        </label>

                        {reassignAssetRequiresSeatNumber ? (
                          <label className="field asset-field-full">
                            <span>Current Seat Number</span>
                            <input
                              className="readonly-field"
                              readOnly
                              type="text"
                              value={reassignAssetForm.currentSeatNumber || "-"}
                            />
                          </label>
                        ) : null}

                        <label className="field asset-field-full">
                          <span>New Date of Issue</span>
                          <input
                            name="dateOfIssue"
                            onChange={handleReassignAssetFormChange}
                            type="date"
                            value={reassignAssetForm.dateOfIssue}
                          />
                        </label>

                        {reassignAssetShowsEmployeeName ? (
                          <label className="field asset-field-full">
                            <span>New Employee Name</span>
                            <input
                              name="assignedTo"
                              onChange={handleReassignAssetFormChange}
                              placeholder="Enter new employee name"
                              type="text"
                              value={reassignAssetForm.assignedTo}
                            />
                          </label>
                        ) : null}

                        <label className="field asset-field-full">
                          <span>New Section</span>
                          <select
                            name="section"
                            onChange={handleReassignAssetFormChange}
                            value={reassignAssetForm.section}
                          >
                            <option value="">
                              {isLoadingSections
                                ? "Loading sections..."
                                : sections.length === 0
                                  ? "No sections available"
                                  : "Select section"}
                            </option>
                            {sections.map((section) => (
                              <option key={section.id} value={section.sectionName}>
                                {getSectionOptionLabel(section)}
                              </option>
                            ))}
                          </select>
                        </label>

                        {reassignAssetRequiresSeatNumber ? (
                          <label className="field asset-field-full">
                            <span>New Seat Number</span>
                            <select
                              disabled={!reassignAssetForm.section}
                              name="seatNumber"
                              onChange={handleReassignAssetFormChange}
                              value={reassignAssetForm.seatNumber}
                            >
                              <option value="">
                                {!reassignAssetForm.section
                                  ? "Select section first"
                                  : reassignSeatNumbersForSection.length === 0
                                    ? "No seat numbers available"
                                    : "Select seat"}
                              </option>
                              {reassignSeatNumbersForSection.map((seat) => (
                                <option key={seat.id} value={seat.seatNumber}>
                                  {seat.seatNumber}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </div>
                    ) : null}

                    {!isLoadingAssignedAssets && assignedAssets.length === 0 ? (
                      <p className="asset-empty-state">
                        No assigned assets are ready to reassign yet. Assign an asset first, then
                        transfer it here.
                      </p>
                    ) : null}

                    {!isLoadingSections && sections.length === 0 ? (
                      <p className="asset-empty-state">
                        No sections are available yet. Add a section in Admin Control before
                        reassigning assets.
                      </p>
                    ) : null}

                    {reassignAssetRequiresSeatNumber && !reassignAssetForm.section ? (
                      <p className="asset-empty-state">
                        This asset category requires a seat number. Select the new section first,
                        then choose one of its seat numbers.
                      </p>
                    ) : null}

                    {reassignAssetRequiresSeatNumber &&
                    reassignAssetForm.section &&
                    reassignSeatNumbersForSection.length === 0 ? (
                      <p className="asset-empty-state">
                        No seat numbers are available for the selected section. Add a seat number
                        in Admin Control before reassigning this asset.
                      </p>
                    ) : null}

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={
                        isSavingReassignAsset ||
                        isLoadingAssignedAssets ||
                        isLoadingSections ||
                        !selectedReassignAsset ||
                        assignedAssets.length === 0 ||
                        sections.length === 0 ||
                        (reassignAssetShowsEmployeeName && !reassignAssetForm.assignedTo.trim()) ||
                        (reassignAssetRequiresSeatNumber && !reassignAssetForm.seatNumber)
                      }
                      type="submit"
                    >
                      {isSavingReassignAsset ? "Saving..." : "Reassign"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "mark-expired" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Mark as Expired</h3>
                  </div>

                  <button
                    aria-label="Close mark as expired dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleExpireAsset}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Asset ID</span>
                        <select
                          name="assetId"
                          onChange={handleExpiredAssetFormChange}
                          value={expiredAssetForm.assetId}
                        >
                          <option value="">
                            {isLoadingActiveAssets
                              ? "Loading active assets..."
                              : activeAssets.length === 0
                                ? "No active assets available"
                                : "Select active asset"}
                          </option>
                          {activeAssets.map((asset) => (
                            <option key={asset.assetId} value={asset.assetId}>
                              {asset.assetId} - {asset.assetName} ({asset.serialNumber}) [{asset.status}]
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field asset-field-full">
                        <span>Category</span>
                        <input
                          className="readonly-field"
                          readOnly
                          type="text"
                          value={expiredAssetForm.category}
                        />
                      </label>

                      <label className="field">
                        <span>Expiry Date</span>
                        <input
                          name="expiryDate"
                          onChange={handleExpiredAssetFormChange}
                          type="date"
                          value={expiredAssetForm.expiryDate}
                        />
                      </label>

                      <label className="field">
                        <span>Reason (Optional)</span>
                        <input
                          name="reason"
                          onChange={handleExpiredAssetFormChange}
                          placeholder="Enter reason"
                          type="text"
                          value={expiredAssetForm.reason}
                        />
                      </label>

                      <label className="field asset-field-full">
                        <span>Remarks (Optional)</span>
                        <textarea
                          name="remarks"
                          onChange={handleExpiredAssetFormChange}
                          placeholder="Enter remarks"
                          rows="5"
                          value={expiredAssetForm.remarks}
                        />
                      </label>
                    </div>

                    {!isLoadingActiveAssets && activeAssets.length === 0 ? (
                      <p className="asset-empty-state">
                        No active assets are available to expire. Only assets with Available or
                        Assigned status can be marked as expired.
                      </p>
                    ) : null}

                    {!isLoadingWarrantyAlerts && (warrantyOverdueCount > 0 || warrantyDueSoonCount > 0) ? (
                      <div className="asset-action-alerts asset-action-alerts-modal">
                        {warrantyOverdueCount > 0 ? (
                          <p className="asset-action-alert-line asset-action-alert-line-danger">
                            {warrantyOverdueCount} asset{warrantyOverdueCount === 1 ? "" : "s"} already past warranty
                          </p>
                        ) : null}
                        {warrantyDueSoonCount > 0 ? (
                          <p className="asset-action-alert-line asset-action-alert-line-warning">
                            {warrantyDueSoonCount} due within {WARRANTY_ALERT_WINDOW_DAYS} days
                          </p>
                        ) : null}
                        {nearestWarrantyAlert ? (
                          <p className="asset-action-alert-note">
                            Next alert: {nearestWarrantyAlert.assetDisplayId} • {nearestWarrantyAlert.assetName} • {formatDisplayDate(nearestWarrantyAlert.warrantyExpiryDate)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={isSavingExpiredAsset || isLoadingActiveAssets || activeAssets.length === 0}
                      type="submit"
                    >
                      {isSavingExpiredAsset ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "return-asset" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Return Asset</h3>
                  </div>

                  <button
                    aria-label="Close return asset dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleReturnAsset}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Asset ID</span>
                        <select
                          name="assetId"
                          onChange={handleReturnAssetFormChange}
                          value={returnAssetForm.assetId}
                        >
                          <option value="">
                            {isLoadingAssignedAssets
                              ? "Loading assigned assets..."
                              : assignedAssets.length === 0
                                ? "No assigned assets available"
                                : "Select assigned asset"}
                          </option>
                          {assignedAssets.map((asset) => (
                            <option key={asset.assetId} value={asset.assetId}>
                              {asset.assetId} - {asset.assetName} ({asset.serialNumber})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Category</span>
                        <input
                          className="readonly-field"
                          readOnly
                          type="text"
                          value={returnAssetForm.category}
                        />
                      </label>

                      <label className="field">
                        <span>Assigned To</span>
                        <input
                          className="readonly-field"
                          readOnly
                          type="text"
                          value={returnAssetForm.assignedTo}
                        />
                      </label>

                      <label className="field">
                        <span>Section</span>
                        <input
                          className="readonly-field"
                          readOnly
                          type="text"
                          value={returnAssetForm.section}
                        />
                      </label>

                      {returnAssetForm.seatNumber ? (
                        <label className="field">
                          <span>Seat Number</span>
                          <input
                            className="readonly-field"
                            readOnly
                            type="text"
                            value={returnAssetForm.seatNumber}
                          />
                        </label>
                      ) : null}

                      <label className="field">
                        <span>Date of Issue</span>
                        <input
                          className="readonly-field"
                          readOnly
                          type="date"
                          value={returnAssetForm.dateOfIssue}
                        />
                      </label>

                      <label className="field">
                        <span>Return Date</span>
                        <input
                          name="returnDate"
                          onChange={handleReturnAssetFormChange}
                          type="date"
                          value={returnAssetForm.returnDate}
                        />
                      </label>

                      <label className="field">
                        <span>Condition at Return</span>
                        <select
                          name="conditionAtReturn"
                          onChange={handleReturnAssetFormChange}
                          value={returnAssetForm.conditionAtReturn}
                        >
                          <option value="Good">Good</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </label>

                      <label className="field asset-field-full">
                        <span>Remarks (Optional)</span>
                        <textarea
                          name="remarks"
                          onChange={handleReturnAssetFormChange}
                          placeholder="Enter remarks"
                          rows="5"
                          value={returnAssetForm.remarks}
                        />
                      </label>
                    </div>

                    {!isLoadingAssignedAssets && assignedAssets.length === 0 ? (
                      <p className="asset-empty-state">
                        No assigned assets are available yet. Use Assign Asset first, then return
                        it here.
                      </p>
                    ) : null}

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={
                        isSavingReturnAsset || isLoadingAssignedAssets || assignedAssets.length === 0
                      }
                      type="submit"
                    >
                      {isSavingReturnAsset ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "delete-asset" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>Delete Asset</h3>
                  </div>

                  <button
                    aria-label="Close delete asset dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleDeleteAsset}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Select Asset</span>
                        <select
                          name="assetId"
                          onChange={handleDeleteAssetFormChange}
                          value={deleteAssetForm.assetId}
                        >
                          <option value="">
                            {isLoadingDeletableAssets
                              ? "Loading assets..."
                              : deletableAssets.length === 0
                                ? "No assets available"
                                : "Select asset"}
                          </option>
                          {deletableAssets.map((asset) => (
                            <option key={asset.assetId} value={asset.assetId}>
                              {asset.assetDisplayId} - {asset.assetName}
                            </option>
                          ))}
                        </select>
                      </label>

                      {selectedDeleteAsset ? (
                        <label className="field asset-field-full">
                          <span>Current Status</span>
                          <input
                            className="readonly-field"
                            readOnly
                            type="text"
                            value={selectedDeleteAsset.status}
                          />
                        </label>
                      ) : null}

                      <label className="field asset-field-full">
                        <span>Reason for deletion (Optional)</span>
                        <textarea
                          name="reason"
                          onChange={handleDeleteAssetFormChange}
                          placeholder="Enter reason for deletion"
                          rows="5"
                          value={deleteAssetForm.reason}
                        />
                      </label>
                    </div>

                    <p className="asset-inline-warning">
                      Asset will be soft-deleted and hidden from active lists. It can be restored
                      from Deleted Assets History.
                    </p>

                    {!isLoadingDeletableAssets && deletableAssets.length === 0 ? (
                      <p className="asset-empty-state">
                        No active assets are available to delete right now.
                      </p>
                    ) : null}

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="danger-button"
                      disabled={
                        isDeletingAsset ||
                        isLoadingDeletableAssets ||
                        deletableAssets.length === 0 ||
                        !deleteAssetForm.assetId
                      }
                      type="submit"
                    >
                      {isDeletingAsset ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "restore-asset" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Reports</p>
                    <h3>Restore Asset</h3>
                  </div>

                  <button
                    aria-label="Close restore asset dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <div className="asset-modal-scroll">
                  <p className="asset-inline-success">
                    Restore "{activeModal.item?.assetName}"? It will become Available again.
                  </p>
                  {modalError ? <p className="message error-message">{modalError}</p> : null}
                </div>

                <div className="asset-modal-footer">
                  <button className="secondary-button" type="button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    disabled={isRestoringAsset}
                    type="button"
                    onClick={handleRestoreAsset}
                  >
                    {isRestoringAsset ? "Restoring..." : "Restore"}
                  </button>
                </div>
              </>
            ) : activeModal.key === "logout-confirm" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Session</p>
                    <h3>Confirm Logout</h3>
                  </div>

                  <button
                    aria-label="Close logout confirmation dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <div className="asset-modal-scroll">
                  <p className="asset-inline-warning">
                    Are you sure you want to log out of the Asset Portal?
                  </p>
                  <p className="asset-empty-state">
                    Any unsaved changes in open forms will be lost. You can sign in again anytime.
                  </p>
                </div>

                <div className="asset-modal-footer">
                  <button className="secondary-button" type="button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="primary-button primary-button-danger"
                    type="button"
                    onClick={handleConfirmLogout}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : activeModal.key === "add-category" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Admin Control</p>
                    <h3>Add Category</h3>
                  </div>

                  <button
                    aria-label="Close add category dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleSaveCategory}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Category Name</span>
                        <input
                          name="name"
                          onChange={handleCategoryFormChange}
                          placeholder="Enter category name"
                          type="text"
                          value={categoryForm.name}
                        />
                      </label>

                      {categoryNameConflict ? (
                        <div className="asset-field-full">
                          <p className="asset-inline-error">
                            Category name already exists. Use a different category name.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <p className="asset-empty-state">
                      Saved categories will automatically appear in the category dropdown for Add
                      New Asset and Bulk Add Assets.
                    </p>

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={isSavingCategory || Boolean(categoryNameConflict)}
                      type="submit"
                    >
                      {isSavingCategory ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "add-section" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Admin Control</p>
                    <h3>{sectionForm.id ? "Edit Section" : "Add Section"}</h3>
                  </div>

                  <button
                    aria-label="Close add section dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleSaveSection}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Section Name</span>
                        <input
                          name="sectionName"
                          onChange={handleSectionFormChange}
                          placeholder="Enter section name"
                          type="text"
                          value={sectionForm.sectionName}
                        />
                      </label>

                      {sectionNameConflict ? (
                        <div className="asset-field-full">
                          <p className="asset-inline-error">
                            Section name already exists. Use a different section name.
                          </p>
                        </div>
                      ) : null}

                      <label className="field asset-field-full">
                        <span>Section Code (Optional)</span>
                        <input
                          name="sectionCode"
                          onChange={handleSectionFormChange}
                          placeholder="Enter section code"
                          type="text"
                          value={sectionForm.sectionCode}
                        />
                      </label>

                      <label className="field asset-field-full">
                        <span>Description (Optional)</span>
                        <textarea
                          name="description"
                          onChange={handleSectionFormChange}
                          placeholder="Enter description"
                          rows="5"
                          value={sectionForm.description}
                        />
                      </label>
                    </div>

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={isSavingSection || Boolean(sectionNameConflict)}
                      type="submit"
                    >
                      {isSavingSection ? "Saving..." : sectionForm.id ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "add-seat" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Admin Control</p>
                    <h3>{seatNumberForm.id ? "Edit Seat Number" : "Add Seat Number"}</h3>
                  </div>

                  <button
                    aria-label="Close add seat number dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form className="asset-form" onSubmit={handleSaveSeatNumber}>
                  <div className="asset-modal-scroll">
                    <div className="asset-form-grid">
                      <label className="field asset-field-full">
                        <span>Seat Number</span>
                        <input
                          name="seatNumber"
                          onChange={handleSeatNumberFormChange}
                          placeholder="Enter seat number"
                          type="text"
                          value={seatNumberForm.seatNumber}
                        />
                      </label>

                      {seatNumberConflict ? (
                        <div className="asset-field-full">
                          <p className="asset-inline-error">
                            Seat number already exists under {seatNumberConflict.sectionName}. Use
                            a unique seat number.
                          </p>
                        </div>
                      ) : null}

                      <label className="field asset-field-full">
                        <span>Section</span>
                        <select
                          name="sectionId"
                          onChange={handleSeatNumberFormChange}
                          value={seatNumberForm.sectionId}
                        >
                          <option value="">
                            {isLoadingSections
                              ? "Loading sections..."
                              : sections.length === 0
                                ? "No sections available"
                                : "Select section"}
                          </option>
                          {sections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {getSectionOptionLabel(section)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field asset-field-full">
                        <span>Description (Optional)</span>
                        <textarea
                          name="description"
                          onChange={handleSeatNumberFormChange}
                          placeholder="Enter description"
                          rows="5"
                          value={seatNumberForm.description}
                        />
                      </label>
                    </div>

                    {!isLoadingSections && sections.length === 0 ? (
                      <p className="asset-empty-state">
                        No sections are available yet. Add a section first, then save seat numbers
                        under that section.
                      </p>
                    ) : null}

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={
                        isSavingSeatNumber ||
                        isLoadingSections ||
                        sections.length === 0 ||
                        Boolean(seatNumberConflict)
                      }
                      type="submit"
                    >
                      {isSavingSeatNumber ? "Saving..." : seatNumberForm.id ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : activeModal.key === "delete-section" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Admin Control</p>
                    <h3>Delete Section</h3>
                  </div>

                  <button
                    aria-label="Close delete section dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <div className="asset-modal-scroll">
                  <p className="asset-inline-warning">
                    Delete section "{activeModal.item?.sectionName}"? If seat numbers still belong
                    to this section, deletion will be blocked.
                  </p>
                  {modalError ? <p className="message error-message">{modalError}</p> : null}
                </div>

                <div className="asset-modal-footer">
                  <button className="secondary-button" type="button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    disabled={isSavingSection}
                    type="button"
                    onClick={handleDeleteSection}
                  >
                    {isSavingSection ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            ) : activeModal.key === "delete-seat" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Admin Control</p>
                    <h3>Delete Seat Number</h3>
                  </div>

                  <button
                    aria-label="Close delete seat number dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <div className="asset-modal-scroll">
                  <p className="asset-inline-warning">
                    Delete seat number "{activeModal.item?.seatNumber}" from{" "}
                    {activeModal.item?.sectionName}?
                  </p>
                  {modalError ? <p className="message error-message">{modalError}</p> : null}
                </div>

                <div className="asset-modal-footer">
                  <button className="secondary-button" type="button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    disabled={isSavingSeatNumber}
                    type="button"
                    onClick={handleDeleteSeatNumber}
                  >
                    {isSavingSeatNumber ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            ) : activeModal.key === "admin-profile" ? (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Admin Control</p>
                    <h3>Admin Profile</h3>
                  </div>

                  <button
                    aria-label="Close admin profile dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <form
                  className="asset-form"
                  onSubmit={adminProfileTab === "name" ? handleSaveAdminName : handleSaveAdminPassword}
                >
                  <div className="asset-modal-scroll">
                    <div className="admin-profile-tabs" role="tablist" aria-label="Admin profile actions">
                      <button
                        className={
                          adminProfileTab === "name"
                            ? "admin-profile-tab admin-profile-tab-active"
                            : "admin-profile-tab"
                        }
                        type="button"
                        onClick={() => setAdminProfileTab("name")}
                      >
                        Change Name
                      </button>
                      <button
                        className={
                          adminProfileTab === "password"
                            ? "admin-profile-tab admin-profile-tab-active"
                            : "admin-profile-tab"
                        }
                        type="button"
                        onClick={() => setAdminProfileTab("password")}
                      >
                        Change Password
                      </button>
                    </div>

                    {adminProfileTab === "name" ? (
                      <div className="asset-form-grid">
                        <label className="field asset-field-full">
                          <span>New Name</span>
                          <input
                            name="newName"
                            onChange={handleAdminNameFormChange}
                            placeholder="Enter new admin name"
                            type="text"
                            value={adminNameForm.newName}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="asset-form-grid">
                        <label className="field asset-field-full">
                          <span>Current Password</span>
                          <input
                            name="currentPassword"
                            onChange={handleAdminPasswordFormChange}
                            placeholder="Enter current password"
                            type="password"
                            value={adminPasswordForm.currentPassword}
                          />
                        </label>

                        {modalError ? (
                          <div className="asset-field-full">
                            <p className="asset-inline-error">{modalError}</p>
                          </div>
                        ) : null}

                        <label className="field asset-field-full">
                          <span>New Password</span>
                          <input
                            name="newPassword"
                            onChange={handleAdminPasswordFormChange}
                            placeholder="Enter new password"
                            type="password"
                            value={adminPasswordForm.newPassword}
                          />
                        </label>

                        <label className="field asset-field-full">
                          <span>Confirm New Password</span>
                          <input
                            name="confirmNewPassword"
                            onChange={handleAdminPasswordFormChange}
                            placeholder="Confirm new password"
                            type="password"
                            value={adminPasswordForm.confirmNewPassword}
                          />
                        </label>
                      </div>
                    )}

                    {adminProfileTab === "name" && modalError ? (
                      <p className="message error-message">{modalError}</p>
                    ) : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={
                        adminProfileTab === "name"
                          ? isSavingAdminName || adminNameForm.newName.trim() === (user?.username ?? "").trim()
                          : isSavingAdminPassword ||
                            !adminPasswordForm.currentPassword ||
                            !adminPasswordForm.newPassword ||
                            !adminPasswordForm.confirmNewPassword
                      }
                      type="submit"
                    >
                      {adminProfileTab === "name"
                        ? isSavingAdminName
                          ? "Saving..."
                          : "Save"
                        : isSavingAdminPassword
                          ? "Saving..."
                          : "Save"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>{activeModal.title}</h3>
                    <p className="auth-modal-copy">
                      This action card is ready in the main view. We can design its workflow next.
                    </p>
                  </div>

                  <button
                    aria-label="Close action dialog"
                    className="modal-close-button"
                    type="button"
                    onClick={closeModal}
                  >
                    X
                  </button>
                </div>

                <div className="asset-modal-footer">
                  <button className="primary-button" type="button" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
