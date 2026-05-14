import React, { useState } from "react";
import {
  FiDownload,
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiRefreshCw,
  FiArrowLeft,
  FiDownloadCloud,
  FiPackage,
} from "react-icons/fi";
import "./BulkImportUpdate.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Define interfaces for type safety
interface BulkUpdateResult {
  hasErrors?: boolean;
  updatedCount?: number;
  notFoundCount?: number;
  errorCount?: number;
  totalRows?: number;
  summaryReport?: string;
  errors?: Array<{
    row: number;
    message: string;
  }>;
  warnings?: Array<{
    row: number;
    message: string;
  }>;
}

interface BulkImportUpdateProps {
  onBack: () => void;
}

const BulkImportUpdate: React.FC<BulkImportUpdateProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<"export" | "import" | "template" | "bulk-upload" | "bulk-upload-template">("export");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<BulkUpdateResult | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = useState<BulkUpdateResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBulkFile, setSelectedBulkFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [bulkDragActive, setBulkDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setSelectedFile(file);
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setExportProgress(0);

      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/products/export/excel`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export products");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `Products_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportProgress(100);
      setTimeout(() => setExportProgress(0), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/products/bulk-update/template`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Product_Bulk_Update_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadResult(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/products/bulk-update/excel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to process bulk update");
      }

      setUploadResult(result.details || result);
      
      // Clear selected file on success
      if (!result.details?.hasErrors) {
        setSelectedFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleBulkDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setBulkDragActive(true);
    } else if (e.type === "dragleave") {
      setBulkDragActive(false);
    }
  };

  const handleBulkDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setBulkDragActive(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetBulkFile(file);
  };

  const validateAndSetBulkFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setSelectedBulkFile(file);
  };

  const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    validateAndSetBulkFile(file);
  };

  const handleDownloadBulkUploadTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/products/bulk-upload/template`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download bulk upload template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Product_Bulk_Upload_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedBulkFile) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setBulkUploadResult(null);

      const formData = new FormData();
      formData.append("file", selectedBulkFile);

      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE_URL}/products/bulk-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to process bulk upload");
      }

      setBulkUploadResult(result.details || result);
      
      if (!result.details?.hasErrors) {
        setSelectedBulkFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const clearBulkFile = () => {
    setSelectedBulkFile(null);
    setError(null);
  };

  return (
    <div className="bulk-import-update">
      <div className="bulk-header">
        <button className="back-button" onClick={onBack}>
          <FiArrowLeft /> Back to Dashboard
        </button>
        <h1>
          <FiPackage /> Bulk Product Operations
        </h1>
      </div>

      <div className="bulk-tabs">
        <button
          className={`tab-btn ${activeTab === "export" ? "active" : ""}`}
          onClick={() => setActiveTab("export")}
        >
          <FiDownloadCloud /> Export Products
        </button>
        <button
          className={`tab-btn ${activeTab === "import" ? "active" : ""}`}
          onClick={() => setActiveTab("import")}
        >
          <FiUpload /> Bulk Update
        </button>
        <button
          className={`tab-btn ${activeTab === "template" ? "active" : ""}`}
          onClick={() => setActiveTab("template")}
        >
          <FiFileText /> Download Template
        </button>
        <button
          className={`tab-btn ${activeTab === "bulk-upload" ? "active" : ""}`}
          onClick={() => setActiveTab("bulk-upload")}
        >
          <FiUpload /> Bulk Upload New
        </button>
        <button
          className={`tab-btn ${activeTab === "bulk-upload-template" ? "active" : ""}`}
          onClick={() => setActiveTab("bulk-upload-template")}
        >
          <FiFileText /> Upload Template
        </button>
      </div>

      <div className="bulk-content">
        {/* Export Tab */}
        {activeTab === "export" && (
          <div className="export-section">
            <div className="info-card">
              <FiInfo className="info-icon" />
              <div className="info-text">
                <h3>Export Products to Excel</h3>
                <p>
                  Download all products with their details including brand, category,
                  subcategory, pricing, and inventory information.
                </p>
              </div>
            </div>

            <div className="export-actions">
              <button
                className="export-btn"
                onClick={handleExport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="spin" /> Exporting...
                  </>
                ) : (
                  <>
                    <FiDownload /> Export Products
                  </>
                )}
              </button>

              {exportProgress > 0 && exportProgress < 100 && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exportProgress}%` }} />
                </div>
              )}
            </div>

            <div className="export-info">
              <h4>Export includes:</h4>
              <ul>
                <li>Product ID, SKU, Name</li>
                <li>Brand, Category, Subcategory</li>
                <li>Price, Discounted Price, Stock Quantity</li>
                <li>Featured, Redemption, Active status</li>
                <li>Created Date</li>
              </ul>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === "import" && (
          <div className="import-section">
            <div className="info-card">
              <FiInfo className="info-icon" />
              <div className="info-text">
                <h3>Bulk Update Products</h3>
                <p>
                  Upload an Excel file to update multiple products at once.
                  Products are identified by SKU or Product ID.
                </p>
              </div>
            </div>

            <div
              className={`upload-area ${dragActive ? "drag-active" : ""} ${
                selectedFile ? "file-selected" : ""
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!selectedFile ? (
                <>
                  <FiUpload className="upload-icon" />
                  <p>Drag & drop your Excel file here or</p>
                  <label className="browse-btn">
                    Browse Files
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                  <p className="file-hint">Supported formats: .xlsx, .xls (Max 10MB)</p>
                </>
              ) : (
                <div className="selected-file">
                  <FiFileText className="file-icon" />
                  <div className="file-info">
                    <p className="file-name">{selectedFile.name}</p>
                    <p className="file-size">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button className="clear-file" onClick={clearFile}>
                    <FiXCircle />
                  </button>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="upload-actions">
                <button
                  className="upload-btn"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <FiRefreshCw className="spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <FiUpload /> Upload & Update Products
                    </>
                  )}
                </button>
                <button className="preview-btn" onClick={() => setActiveTab("template")}>
                  <FiFileText /> Need Template?
                </button>
              </div>
            )}

            {error && (
              <div className="error-message">
                <FiAlertCircle /> {error}
              </div>
            )}

            {uploadResult && (
              <div className="upload-result">
                <h3>
                  {uploadResult.hasErrors ? (
                    <>
                      <FiAlertCircle className="warning-icon" /> Update Completed with Issues
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="success-icon" /> Update Successful
                    </>
                  )}
                </h3>

                <div className="result-stats">
                  <div className="stat-item success">
                    <span className="stat-label">Updated:</span>
                    <span className="stat-value">{uploadResult.updatedCount || 0}</span>
                  </div>
                  <div className="stat-item warning">
                    <span className="stat-label">Not Found:</span>
                    <span className="stat-value">{uploadResult.notFoundCount || 0}</span>
                  </div>
                  <div className="stat-item error">
                    <span className="stat-label">Errors:</span>
                    <span className="stat-value">{uploadResult.errorCount || 0}</span>
                  </div>
                  <div className="stat-item total">
                    <span className="stat-label">Total Processed:</span>
                    <span className="stat-value">{uploadResult.totalRows || 0}</span>
                  </div>
                </div>

                {uploadResult.summaryReport && (
                  <div className="summary-report">
                    <h4>Summary Report</h4>
                    <p>{uploadResult.summaryReport}</p>
                  </div>
                )}

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="error-details">
                    <h4>Error Details</h4>
                    <div className="error-list">
                      {uploadResult.errors.map((error, index) => (
                        <div key={index} className="error-item">
                          <FiXCircle className="error-icon" />
                          <span>Row {error.row}: {error.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                  <div className="warning-details">
                    <h4>Warnings</h4>
                    <div className="warning-list">
                      {uploadResult.warnings.map((warning, index) => (
                        <div key={index} className="warning-item">
                          <FiAlertCircle className="warning-icon" />
                          <span>Row {warning.row}: {warning.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Template Tab */}
        {activeTab === "template" && (
          <div className="template-section">
            <div className="info-card">
              <FiInfo className="info-icon" />
              <div className="info-text">
                <h3>Bulk Update Template</h3>
                <p>
                  Download a template with the correct format for bulk updating products.
                  The template includes instructions and examples.
                </p>
              </div>
            </div>

            <div className="template-actions">
              <button
                className="template-btn"
                onClick={handleDownloadTemplate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FiDownload /> Download Template
                  </>
                )}
              </button>
            </div>

            <div className="template-guide">
              <h4>Template Guide</h4>
              <div className="guide-grid">
                <div className="guide-item">
                  <h5>Required Columns</h5>
                  <p>Provide either:</p>
                  <ul>
                    <li>Product ID</li>
                    <li>SKU</li>
                  </ul>
                </div>

                <div className="guide-item">
                  <h5>Updatable Fields</h5>
                  <ul>
                    <li>Product Name</li>
                    <li>Brand</li>
                    <li>Price</li>
                    <li>Discounted Price</li>
                    <li>Stock Quantity</li>
                    <li>Is Featured?</li>
                    <li>Is Redemption?</li>
                    <li>Is Active?</li>
                  </ul>
                </div>

                <div className="guide-item">
                  <h5>Boolean Values</h5>
                  <p>Accepted formats:</p>
                  <ul>
                    <li>Yes / No</li>
                    <li>Y / N</li>
                    <li>True / False</li>
                    <li>1 / 0</li>
                    <li>✓ / ✗</li>
                  </ul>
                </div>

                <div className="guide-item">
                  <h5>Important Notes</h5>
                  <ul>
                    <li>Leave cells empty to keep existing values</li>
                    <li>For Discounted Price, empty = keep current</li>
                    <li>Brand names must match exactly</li>
                    <li>SKU is case-insensitive</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload New Products Tab */}
        {activeTab === "bulk-upload" && (
          <div className="import-section">
            <div className="info-card">
              <FiInfo className="info-icon" />
              <div className="info-text">
                <h3>Bulk Upload New Products</h3>
                <p>
                  Upload an Excel file to create multiple new products at once.
                  Each row in the Excel file will create a new product.
                </p>
              </div>
            </div>

            <div
              className={`upload-area ${bulkDragActive ? "drag-active" : ""} ${
                selectedBulkFile ? "file-selected" : ""
              }`}
              onDragEnter={handleBulkDrag}
              onDragLeave={handleBulkDrag}
              onDragOver={handleBulkDrag}
              onDrop={handleBulkDrop}
            >
              {!selectedBulkFile ? (
                <>
                  <FiUpload className="upload-icon" />
                  <p>Drag & drop your Excel file here or</p>
                  <label className="browse-btn">
                    Browse Files
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleBulkFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                  <p className="file-hint">Supported formats: .xlsx, .xls (Max 10MB)</p>
                </>
              ) : (
                <div className="selected-file">
                  <FiFileText className="file-icon" />
                  <div className="file-info">
                    <p className="file-name">{selectedBulkFile.name}</p>
                    <p className="file-size">
                      {(selectedBulkFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button className="clear-file" onClick={clearBulkFile}>
                    <FiXCircle />
                  </button>
                </div>
              )}
            </div>

            {selectedBulkFile && (
              <div className="upload-actions">
                <button
                  className="upload-btn"
                  onClick={handleBulkUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <FiRefreshCw className="spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <FiUpload /> Upload New Products
                    </>
                  )}
                </button>
                <button className="preview-btn" onClick={() => setActiveTab("bulk-upload-template")}>
                  <FiFileText /> Need Template?
                </button>
              </div>
            )}

            {error && (
              <div className="error-message">
                <FiAlertCircle /> {error}
              </div>
            )}

            {bulkUploadResult && (
              <div className="upload-result">
                <h3>
                  {bulkUploadResult.hasErrors ? (
                    <>
                      <FiAlertCircle className="warning-icon" /> Upload Completed with Issues
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="success-icon" /> Upload Successful
                    </>
                  )}
                </h3>

                <div className="result-stats">
                  <div className="stat-item success">
                    <span className="stat-label">Created:</span>
                    <span className="stat-value">{bulkUploadResult.updatedCount || 0}</span>
                  </div>
                  <div className="stat-item error">
                    <span className="stat-label">Errors:</span>
                    <span className="stat-value">{bulkUploadResult.errorCount || 0}</span>
                  </div>
                  <div className="stat-item total">
                    <span className="stat-label">Total Processed:</span>
                    <span className="stat-value">{bulkUploadResult.totalRows || 0}</span>
                  </div>
                </div>

                {bulkUploadResult.summaryReport && (
                  <div className="summary-report">
                    <h4>Summary Report</h4>
                    <p>{bulkUploadResult.summaryReport}</p>
                  </div>
                )}

                {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                  <div className="error-details">
                    <h4>Error Details</h4>
                    <div className="error-list">
                      {bulkUploadResult.errors.map((error, index) => (
                        <div key={index} className="error-item">
                          <FiXCircle className="error-icon" />
                          <span>Row {error.row}: {error.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bulkUploadResult.warnings && bulkUploadResult.warnings.length > 0 && (
                  <div className="warning-details">
                    <h4>Warnings</h4>
                    <div className="warning-list">
                      {bulkUploadResult.warnings.map((warning, index) => (
                        <div key={index} className="warning-item">
                          <FiAlertCircle className="warning-icon" />
                          <span>Row {warning.row}: {warning.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bulk Upload Template Tab */}
        {activeTab === "bulk-upload-template" && (
          <div className="template-section">
            <div className="info-card">
              <FiInfo className="info-icon" />
              <div className="info-text">
                <h3>Bulk Upload Template</h3>
                <p>
                  Download a template with the correct format for uploading new products in bulk.
                  The template includes instructions and examples.
                </p>
              </div>
            </div>

            <div className="template-actions">
              <button
                className="template-btn"
                onClick={handleDownloadBulkUploadTemplate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FiDownload /> Download Upload Template
                  </>
                )}
              </button>
            </div>

            <div className="template-guide">
              <h4>Upload Template Guide</h4>
              <div className="guide-grid">
                <div className="guide-item">
                  <h5>Required Columns</h5>
                  <p>All of these are required:</p>
                  <ul>
                    <li>Product Name</li>
                    <li>SKU</li>
                    <li>Brand</li>
                    <li>Category</li>
                    <li>Subcategory</li>
                    <li>Price</li>
                  </ul>
                </div>

                <div className="guide-item">
                  <h5>Optional Fields</h5>
                  <ul>
                    <li>Discounted Price</li>
                    <li>Stock Quantity</li>
                    <li>Description</li>
                    <li>Weight</li>
                    <li>Dimensions</li>
                    <li>Warranty Period</li>
                  </ul>
                </div>

                <div className="guide-item">
                  <h5>Flag Fields</h5>
                  <ul>
                    <li>Is Featured?</li>
                    <li>Is Redemption?</li>
                    <li>Is Active?</li>
                  </ul>
                </div>

                <div className="guide-item">
                  <h5>Boolean Values</h5>
                  <p>Accepted formats:</p>
                  <ul>
                    <li>Yes / No</li>
                    <li>Y / N</li>
                    <li>True / False</li>
                    <li>1 / 0</li>
                    <li>✓ / ✗</li>
                  </ul>
                </div>

                <div className="guide-item">
                  <h5>Important Notes</h5>
                  <ul>
                    <li>Brand, Category, and Subcategory names must match exactly</li>
                    <li>SKU must be unique across your catalog</li>
                    <li>Price should be a numeric value</li>
                    <li>Stock Quantity defaults to 0 if not provided</li>
                    <li>Featured and Active default to False if not provided</li>
                  </ul>
                </div>

                <div className="guide-item">
                  <h5>File Requirements</h5>
                  <ul>
                    <li>Format: Excel (.xlsx or .xls)</li>
                    <li>Maximum size: 10MB</li>
                    <li>First row must contain column headers</li>
                    <li>Data starts from row 2</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportUpdate;