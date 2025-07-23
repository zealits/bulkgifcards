import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { dashboardAPI, giftCardAPI } from "../services/api";
import {
  Upload,
  FileSpreadsheet,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Eye,
  Trash2,
  Users,
  BarChart3,
  Gift,
  Send,
  DollarSign,
  MessageSquare,
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [emailLists, setEmailLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Gift card modal state
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [giftCardStep, setGiftCardStep] = useState(1);
  const [giftCardData, setGiftCardData] = useState({
    amount: "",
    message: "Congratulations! Enjoy your gift card!",
    selectedEmails: [],
  });

  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDashboardData();

    // Prevent default drag behaviors on the entire window
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const preventDefaultDrops = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add event listeners to prevent default file drops
    window.addEventListener("dragenter", preventDefaults, false);
    window.addEventListener("dragover", preventDefaults, false);
    window.addEventListener("drop", preventDefaultDrops, false);

    return () => {
      // Cleanup event listeners
      window.removeEventListener("dragenter", preventDefaults, false);
      window.removeEventListener("dragover", preventDefaults, false);
      window.removeEventListener("drop", preventDefaultDrops, false);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, listsResponse] = await Promise.all([dashboardAPI.getStats(), dashboardAPI.getEmailLists()]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (listsResponse.data.success) {
        setEmailLists(listsResponse.data.data.emailLists);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid Excel file (.xlsx, .xls) or CSV file");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      const response = await dashboardAPI.uploadFile(formData);

      if (response.data.success) {
        setSuccess(`Successfully processed ${response.data.data.validEmails} email addresses from ${file.name}`);
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    await processFile(file);
    e.target.value = ""; // Clear file input
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const viewEmailList = async (listId) => {
    try {
      const response = await dashboardAPI.getEmails(listId);
      if (response.data.success) {
        setSelectedList(response.data.data.listInfo);
        setEmails(response.data.data.emails);
      }
    } catch (error) {
      setError("Failed to load email list");
    }
  };

  const deleteEmailList = async (listId) => {
    if (!window.confirm("Are you sure you want to delete this email list?")) {
      return;
    }

    try {
      const response = await dashboardAPI.deleteEmailList(listId);
      if (response.data.success) {
        setSuccess("Email list deleted successfully");
        fetchDashboardData();
        if (selectedList && selectedList.id === listId) {
          setSelectedList(null);
          setEmails([]);
        }
      }
    } catch (error) {
      setError("Failed to delete email list");
    }
  };

  // Gift card functions
  const openGiftCardModal = () => {
    if (!selectedList || emails.length === 0) {
      setError("Please select an email list first");
      return;
    }
    setShowGiftCardModal(true);
    setGiftCardStep(1);
    setGiftCardData({
      amount: "",
      message: "Congratulations! Enjoy your gift card!",
      selectedEmails: [],
    });
  };

  const closeGiftCardModal = () => {
    setShowGiftCardModal(false);
    setGiftCardStep(1);
    setGiftCardData({
      amount: "",
      message: "Congratulations! Enjoy your gift card!",
      selectedEmails: [],
    });
  };

  const handleGiftCardSend = async () => {
    if (!selectedList || giftCardData.selectedEmails.length === 0 || !giftCardData.amount) {
      setError("Please fill in all required fields");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const response = await giftCardAPI.sendGiftCards({
        emailListId: selectedList.id,
        selectedEmails: giftCardData.selectedEmails,
        amount: parseFloat(giftCardData.amount),
        message: giftCardData.message,
      });

      if (response.data.success) {
        setSuccess(
          `Successfully sent ${
            response.data.data.successful
          } gift cards worth $${response.data.data.totalAmount.toFixed(2)}`
        );
        closeGiftCardModal();
        fetchDashboardData(); // Refresh data
      } else {
        setError(response.data.message || "Failed to send gift cards");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send gift cards");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">Giftogram Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">{error}</div>}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md">{success}</div>
        )}

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Uploads</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUploads}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Mail className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Emails</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalValidEmails}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Gift className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Gift Cards Sent</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.giftCards?.totalGiftCards || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Gift Card Value</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${stats.giftCards?.totalGiftCardAmount?.toFixed(2) || "0.00"}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Sent Emails</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.sentEmails}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Emails</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingEmails}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <XCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Failed Emails</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.failedEmails}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Excel File</h3>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                  isDragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
                } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && document.getElementById("file-upload").click()}
              >
                <Upload
                  className={`mx-auto h-12 w-12 transition-colors duration-200 ${
                    isDragOver ? "text-indigo-500" : "text-gray-400"
                  }`}
                />
                <div className="mt-4">
                  <span
                    className={`mt-2 block text-sm font-medium transition-colors duration-200 ${
                      isDragOver ? "text-indigo-900" : "text-gray-900"
                    }`}
                  >
                    {uploading
                      ? "Uploading..."
                      : isDragOver
                      ? "Drop your file here"
                      : "Drag and drop or click to upload"}
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p
                    className={`mt-1 text-sm transition-colors duration-200 ${
                      isDragOver ? "text-indigo-600" : "text-gray-500"
                    }`}
                  >
                    Excel (.xlsx, .xls) or CSV files only
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Uploads */}
            {stats?.recentUploads && stats.recentUploads.length > 0 && (
              <div className="mt-6 bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Uploads</h3>
                <div className="space-y-3">
                  {stats.recentUploads.map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{upload.fileName}</p>
                        <p className="text-sm text-gray-500">{upload.validEmails} emails</p>
                      </div>
                      <button
                        onClick={() => viewEmailList(upload.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email Lists and Details */}
          <div className="lg:col-span-2">
            {!selectedList ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Email Lists</h3>
                {emailLists.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No email lists found. Upload an Excel file to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {emailLists.map((list) => (
                      <div
                        key={list._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{list.fileName}</h4>
                          <p className="text-sm text-gray-500">
                            {list.validEmails} emails • Uploaded {new Date(list.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewEmailList(list._id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteEmailList(list._id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{selectedList.fileName}</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={openGiftCardModal}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Gift className="h-4 w-4 mr-1" />
                      Send Gift Cards
                    </button>
                    <button onClick={() => setSelectedList(null)} className="text-gray-500 hover:text-gray-700">
                      ← Back to Lists
                    </button>
                  </div>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Emails:</span> {selectedList.totalEmails}
                    </div>
                    <div>
                      <span className="font-medium">Valid Emails:</span> {selectedList.validEmails}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <h4 className="font-medium text-gray-900 mb-3">Email Addresses</h4>
                  <div className="max-h-96 overflow-y-auto">
                    {emails.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No emails found in this list.</p>
                    ) : (
                      <div className="space-y-2">
                        {emails.map((email, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{email.email}</p>
                              {email.name && <p className="text-sm text-gray-500">{email.name}</p>}
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                email.status === "sent"
                                  ? "bg-green-100 text-green-800"
                                  : email.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {email.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gift Card Modal */}
      {showGiftCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <Gift className="h-6 w-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Send Gift Cards</h2>
              </div>
              <button onClick={closeGiftCardModal} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="text-sm text-gray-600 mb-4">
                  Sending gift cards to emails from: <span className="font-medium">{selectedList?.fileName}</span>
                  {" • "}
                  <span className="font-medium">{emails.length}</span> total emails available
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Gift Card Amount (per recipient)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="0.01"
                      value={giftCardData.amount}
                      onChange={(e) => setGiftCardData((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="50.00"
                      className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Enter amount between $1 and $1000</p>
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Personal Message
                  </label>
                  <textarea
                    value={giftCardData.message}
                    onChange={(e) => setGiftCardData((prev) => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    placeholder="Add a personal message..."
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Email Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Recipients ({giftCardData.selectedEmails.length} selected)
                    </label>
                    <button
                      onClick={() => {
                        const allEmails = emails.map((e) => e.email);
                        setGiftCardData((prev) => ({
                          ...prev,
                          selectedEmails: prev.selectedEmails.length === emails.length ? [] : allEmails,
                        }));
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {giftCardData.selectedEmails.length === emails.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                    {emails.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={giftCardData.selectedEmails.includes(email.email)}
                          onChange={() => {
                            setGiftCardData((prev) => ({
                              ...prev,
                              selectedEmails: prev.selectedEmails.includes(email.email)
                                ? prev.selectedEmails.filter((e) => e !== email.email)
                                : [...prev.selectedEmails, email.email],
                            }));
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{email.email}</span>
                          </div>
                          {email.name && <div className="text-sm text-gray-500 ml-6">{email.name}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Cost Summary */}
                {giftCardData.amount && giftCardData.selectedEmails.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ${(parseFloat(giftCardData.amount || 0) * giftCardData.selectedEmails.length).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ${giftCardData.amount} × {giftCardData.selectedEmails.length} recipients
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <button
                onClick={closeGiftCardModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>

              <button
                onClick={handleGiftCardSend}
                disabled={uploading || !giftCardData.amount || giftCardData.selectedEmails.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <Clock className="animate-spin h-4 w-4 mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Gift Cards
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
