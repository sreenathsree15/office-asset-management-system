import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const MESSAGE_TIMEOUT_MS = 5000;

const ACTION_CARDS = [
  {
    key: "new-asset",
    icon: "+",
    title: "New Asset",
    description: "Add a single new asset to the inventory."
  },
  {
    key: "bulk-add",
    icon: "++",
    title: "Bulk Add Assets",
    description: "Add multiple assets with auto-generated serial numbers."
  },
  {
    key: "edit-asset",
    icon: "ED",
    title: "Edit Asset",
    description: "Update asset details, status, and serial information."
  },
  {
    key: "return-asset",
    icon: "R",
    title: "Return Asset",
    description: "Process asset returns from employees."
  },
  {
    key: "mark-expired",
    icon: "EX",
    title: "Mark as Expired",
    description: "Mark an asset as expired or out of warranty."
  },
  {
    key: "mark-damaged",
    icon: "!",
    title: "Mark as Damaged",
    description: "Report asset damage and severity."
  },
  {
    key: "assign-asset",
    icon: "A",
    title: "Assign Asset",
    description: "Assign an asset to an employee or section."
  }
];

const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", type: "static" },
  { key: "asset-management", label: "Asset Management", type: "active" },
  { key: "admin-control", label: "Admin Control", type: "static" },
  { key: "reports", label: "Reports", type: "static" },
  { key: "logout", label: "Logout", type: "logout" }
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
  dateOfIssue: getTodayDateString(),
  status: "Assigned",
  remarks: ""
});

const createEmptyReturnAssetForm = () => ({
  assetId: "",
  category: "",
  assignedTo: "",
  section: "",
  dateOfIssue: "",
  returnDate: getTodayDateString(),
  conditionAtReturn: "Good",
  remarks: ""
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

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [assetSummary, setAssetSummary] = useState({
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0,
    damagedAssets: 0,
    expiredAssets: 0
  });
  const [isLoadingEditableAssets, setIsLoadingEditableAssets] = useState(false);
  const [isLoadingActiveAssets, setIsLoadingActiveAssets] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingAvailableAssets, setIsLoadingAvailableAssets] = useState(false);
  const [isLoadingAssignedAssets, setIsLoadingAssignedAssets] = useState(false);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [isSavingBulkAssets, setIsSavingBulkAssets] = useState(false);
  const [isSavingEditAsset, setIsSavingEditAsset] = useState(false);
  const [isSavingAssignAsset, setIsSavingAssignAsset] = useState(false);
  const [isSavingDamagedAsset, setIsSavingDamagedAsset] = useState(false);
  const [isSavingExpiredAsset, setIsSavingExpiredAsset] = useState(false);
  const [isSavingReturnAsset, setIsSavingReturnAsset] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [assetForm, setAssetForm] = useState(createEmptyAssetForm);
  const [bulkAssetForm, setBulkAssetForm] = useState(createEmptyBulkAssetForm);
  const [editAssetForm, setEditAssetForm] = useState(createEmptyEditAssetForm);
  const [assignAssetForm, setAssignAssetForm] = useState(createEmptyAssignAssetForm);
  const [returnAssetForm, setReturnAssetForm] = useState(createEmptyReturnAssetForm);
  const [damagedAssetForm, setDamagedAssetForm] = useState(createEmptyDamagedAssetForm);
  const [expiredAssetForm, setExpiredAssetForm] = useState(createEmptyExpiredAssetForm);
  const [editableAssets, setEditableAssets] = useState([]);
  const [activeAssets, setActiveAssets] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assignedAssets, setAssignedAssets] = useState([]);
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
    activeModal?.key === "mark-damaged" ||
    activeModal?.key === "mark-expired" ||
    activeModal?.key === "return-asset";
  const isSerialNumberChanged =
    editAssetForm.assetId &&
    editAssetForm.serialNumber.trim() !== editAssetForm.originalSerialNumber.trim();
  const isUnusualEditStatusChange = shouldConfirmUnusualStatusChange(
    editAssetForm.originalStatus,
    editAssetForm.status
  );

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

    if (activeModal) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [activeModal]);

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      setIsLoadingCategories(true);

      try {
        const categoryResponse = await fetch(`${API_BASE_URL}/api/categories`, {
          method: "GET",
          headers: authHeaders
        });

        const categoryPayload = await parseResponse(categoryResponse);
        const summaryResponse = await fetch(`${API_BASE_URL}/api/assets/summary`, {
          method: "GET",
          headers: authHeaders
        });
        const summaryPayload = await parseResponse(summaryResponse);

        if (isMounted) {
          setCategories(Array.isArray(categoryPayload) ? categoryPayload : []);
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
        }
      }
    };

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [user?.token, user?.tokenType]);

  const openModal = async (card) => {
    setModalError("");
    setActiveModal(card);

    if (card.key === "new-asset") {
      setAssetForm(createEmptyAssetForm());
    }

    if (card.key === "bulk-add") {
      setBulkAssetForm(createEmptyBulkAssetForm());
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
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalError("");
    setIsSavingAsset(false);
    setIsSavingBulkAssets(false);
    setIsSavingEditAsset(false);
    setIsSavingAssignAsset(false);
    setIsSavingDamagedAsset(false);
    setIsSavingExpiredAsset(false);
    setIsSavingReturnAsset(false);
    setEditAssetForm(createEmptyEditAssetForm());
    setEditStatusConfirmed(false);
    setSerialAvailability({
      isChecking: false,
      available: true,
      message: ""
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
        category: selectedAsset?.categoryName ?? ""
      }));

      return;
    }

    setAssignAssetForm((current) => ({ ...current, [name]: value }));
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
        category: selectedAsset?.categoryName ?? ""
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

  const handleSaveAsset = async (event) => {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    setModalError("");
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
      await fetchAssetSummary();
      closeModal();
      setPageNotice(`Asset "${payload.assetName}" added successfully.`);
      setAssetForm(createEmptyAssetForm());
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

      await fetchAssetSummary();
      closeModal();
      setPageNotice(`${assetCount} assets added successfully. Serial numbers were generated automatically.`);
      setBulkAssetForm(createEmptyBulkAssetForm());
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
          dateOfIssue: assignAssetForm.dateOfIssue,
          remarks: assignAssetForm.remarks
        })
      });

      const payload = await parseResponse(response);
      await fetchAssetSummary();
      closeModal();
      setPageNotice(payload.message ?? "Asset assigned successfully.");
      setAssignAssetForm(createEmptyAssignAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingAssignAsset(false);
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
      await fetchAssetSummary();
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
      await fetchAssetSummary();
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
      await fetchAssetSummary();
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
      await fetchAssetSummary();
      closeModal();
      setPageNotice(payload.message ?? "Asset marked as expired successfully.");
      setExpiredAssetForm(createEmptyExpiredAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingExpiredAsset(false);
    }
  };

  return (
    <main className="asset-shell">
      {pageError || pageNotice ? (
        <div className="asset-toast-stack">
          {pageError ? <p className="message error-message">{pageError}</p> : null}
          {pageNotice ? <p className="message success-message">{pageNotice}</p> : null}
        </div>
      ) : null}

      <div className="asset-layout">
        <aside className="asset-sidebar">
          <div className="asset-sidebar-brand">
            <div>
              <h2>Asset Portal</h2>
              <p>{user?.username}</p>
            </div>
            <span className="asset-sidebar-chevron">&lt;</span>
          </div>

          <nav className="asset-sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.key}
                className={
                  item.type === "active"
                    ? "asset-sidebar-item asset-sidebar-item-active"
                    : "asset-sidebar-item"
                }
                type="button"
                onClick={item.type === "logout" ? logout : undefined}
              >
                <span className="asset-sidebar-icon">
                  {item.key === "dashboard"
                    ? "D"
                    : item.key === "asset-management"
                      ? "AM"
                      : item.key === "admin-control"
                        ? "AC"
                        : item.key === "reports"
                          ? "RP"
                          : "LO"}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="asset-content">
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

          <section className="asset-actions-grid">
            {ACTION_CARDS.map((card) => (
              <button
                key={card.key}
                className="asset-action-card"
                type="button"
                onClick={() => openModal(card)}
              >
                <span className="asset-action-icon">{card.icon}</span>
                <strong>{card.title}</strong>
                <span>{card.description}</span>
              </button>
            ))}
          </section>
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
                        <input
                          name="section"
                          onChange={handleAssignAssetFormChange}
                          placeholder="Enter section"
                          type="text"
                          value={assignAssetForm.section}
                        />
                      </label>

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

                    {modalError ? <p className="message error-message">{modalError}</p> : null}
                  </div>

                  <div className="asset-modal-footer">
                    <button className="secondary-button" type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="primary-button"
                      disabled={
                        isSavingAssignAsset || isLoadingAvailableAssets || availableAssets.length === 0
                      }
                      type="submit"
                    >
                      {isSavingAssignAsset ? "Saving..." : "Save"}
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
