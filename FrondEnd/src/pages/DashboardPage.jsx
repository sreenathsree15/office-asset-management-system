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
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [isSavingBulkAssets, setIsSavingBulkAssets] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [assetForm, setAssetForm] = useState(createEmptyAssetForm);
  const [bulkAssetForm, setBulkAssetForm] = useState(createEmptyBulkAssetForm);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [modalError, setModalError] = useState("");
  const isAssetFormModal = activeModal?.key === "new-asset" || activeModal?.key === "bulk-add";

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

    const loadCategories = async () => {
      setIsLoadingCategories(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
          method: "GET",
          headers: {
            Authorization: `${user?.tokenType ?? "Bearer"} ${user?.token ?? ""}`
          }
        });

        const payload = await parseResponse(response);

        if (isMounted) {
          setCategories(Array.isArray(payload) ? payload : []);
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

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [user?.token, user?.tokenType]);

  const openModal = (card) => {
    setModalError("");
    setActiveModal(card);

    if (card.key === "new-asset") {
      setAssetForm(createEmptyAssetForm());
    }

    if (card.key === "bulk-add") {
      setBulkAssetForm(createEmptyBulkAssetForm());
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalError("");
    setIsSavingAsset(false);
    setIsSavingBulkAssets(false);
  };

  const handleAssetFormChange = (event) => {
    const { name, value } = event.target;
    setAssetForm((current) => ({ ...current, [name]: value }));
  };

  const handleBulkAssetFormChange = (event) => {
    const { name, value } = event.target;
    setBulkAssetForm((current) => ({ ...current, [name]: value }));
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

      closeModal();
      setPageNotice(`${assetCount} assets added successfully. Serial numbers were generated automatically.`);
      setBulkAssetForm(createEmptyBulkAssetForm());
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSavingBulkAssets(false);
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
            ) : (
              <>
                <div className="asset-modal-header">
                  <div>
                    <p className="auth-modal-caption">Asset Management</p>
                    <h3>{activeModal.title}</h3>
                    <p className="auth-modal-copy">
                      {activeModal.key === "bulk-add"
                        ? "The bulk asset workflow is the next form we can design and connect."
                        : "This action card is ready in the main view. We can design its workflow next."}
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
