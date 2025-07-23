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
  TrendingUp,
  Activity,
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  Calendar,
} from "lucide-react";
import studieshqlogo from "../assets/studieshqlogo.png";

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
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter emails based on search term
  const filteredEmails = emails.filter(
    (email) =>
      email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.name && email.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={studieshqlogo} alt="StudiesHQ Logo" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-800">Gift Card Management</h1>
                <p className="text-sm text-slate-500">Streamline your gift card distribution</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-slate-100 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-slate-700 font-medium">{user?.name}</span>
              </div>
              <button
                onClick={fetchDashboardData}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Enhanced Stats Section */}
        {stats && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Overview</h2>
              <p className="text-slate-600">Monitor your gift card distribution performance and email management</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Enhanced Stats Cards */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Total</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.totalUploads}</h3>
                  <p className="text-sm text-slate-600">Files Uploaded</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Gift className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Delivered</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.giftCards?.totalGiftCards || 0}</h3>
                  <p className="text-sm text-slate-600">Gift Cards Sent</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Revenue</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">
                    ${stats.giftCards?.totalGiftCardAmount?.toFixed(2) || "0.00"}
                  </h3>
                  <p className="text-sm text-slate-600">Total Value Distributed</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Active</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">{emailLists.length}</h3>
                  <p className="text-sm text-slate-600">Email Lists</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* File Upload Section - Enhanced */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center mb-4">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-slate-800">Upload Email List</h3>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50 scale-105"
                    : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && document.getElementById("file-upload").click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Clock className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-sm font-medium text-slate-700">Processing file...</p>
                  </div>
                ) : (
                  <>
                    <Upload
                      className={`mx-auto h-12 w-12 mb-4 transition-colors duration-200 ${
                        isDragOver ? "text-blue-500" : "text-slate-400"
                      }`}
                    />
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">
                      {isDragOver ? "Drop your file here" : "Upload Excel or CSV"}
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">Drag and drop or click to browse</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                      <FileText className="h-3 w-3 mr-1" />
                      .xlsx, .xls, .csv
                    </div>
                  </>
                )}

                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Recent Uploads - Enhanced */}
            {stats?.recentUploads && stats.recentUploads.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Recent Uploads</h3>
                  <Activity className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-3">
                  {stats.recentUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{upload.fileName}</p>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {upload.validEmails} emails
                        </div>
                      </div>
                      <button
                        onClick={() => viewEmailList(upload.id)}
                        className="ml-3 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email Lists and Details - Enhanced */}
          <div className="xl:col-span-3">
            {!selectedList ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Email Lists Management</h3>
                      <p className="text-slate-600 mt-1">Manage and organize your email distribution lists</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 font-medium">
                        {emailLists.length} Lists
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {emailLists.length === 0 ? (
                    <div className="text-center py-12">
                      <FileSpreadsheet className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-slate-800 mb-2">No Email Lists Yet</h4>
                      <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                        Upload your first Excel or CSV file to start managing email lists and sending gift cards.
                      </p>
                      <button
                        onClick={() => document.getElementById("file-upload").click()}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload First File
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {emailLists.map((list) => (
                        <div
                          key={list._id}
                          className="flex items-center justify-between p-6 border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-200 transition-all group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 text-lg">{list.fileName}</h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="inline-flex items-center text-sm text-slate-600">
                                  <Mail className="h-4 w-4 mr-1" />
                                  {list.validEmails} emails
                                </span>
                                <span className="inline-flex items-center text-sm text-slate-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(list.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewEmailList(list._id)}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </button>
                            <button
                              onClick={() => deleteEmailList(list._id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* List Header */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedList(null)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          ←
                        </button>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">{selectedList.fileName}</h3>
                          <p className="text-slate-600 mt-1">Manage emails and send gift cards</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={openGiftCardModal}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors font-medium"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Send Gift Cards
                      </button>
                    </div>
                  </div>
                </div>

                {/* List Stats */}
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{selectedList.totalEmails}</div>
                      <div className="text-sm text-slate-600">Total Emails</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedList.validEmails}</div>
                      <div className="text-sm text-slate-600">Valid Emails</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{filteredEmails.length}</div>
                      <div className="text-sm text-slate-600">Shown</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">
                        {emails.filter((e) => e.status === "sent").length}
                      </div>
                      <div className="text-sm text-slate-600">Gift Cards Sent</div>
                    </div>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search emails..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="text-sm text-slate-500">
                      {filteredEmails.length} of {emails.length} emails
                    </div>
                  </div>
                </div>

                {/* Email List */}
                <div className="p-6">
                  {filteredEmails.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">
                        {searchTerm ? "No emails match your search" : "No emails found in this list"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredEmails.map((email, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Mail className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{email.email}</p>
                              {email.name && <p className="text-sm text-slate-500">{email.name}</p>}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              email.status === "sent"
                                ? "bg-green-100 text-green-700"
                                : email.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {email.status === "sent" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {email.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                            {email.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {email.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Gift Card Modal */}
      {showGiftCardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Send Gift Cards</h2>
                  <p className="text-sm text-slate-600">Distribute gift cards to your email list</p>
                </div>
              </div>
              <button
                onClick={closeGiftCardModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-sm text-blue-800">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    <span className="font-medium">{selectedList?.fileName}</span>
                    <span className="mx-2">•</span>
                    <span>{emails.length} total emails available</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Gift Card Amount (per recipient)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="0.01"
                      value={giftCardData.amount}
                      onChange={(e) => setGiftCardData((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="50.00"
                      className="w-full pl-8 pr-4 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Enter amount between $1 and $1000</p>
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Personal Message
                  </label>
                  <textarea
                    value={giftCardData.message}
                    onChange={(e) => setGiftCardData((prev) => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    placeholder="Add a personal message..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Email Selection */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-slate-700">
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
                      className="text-sm font-medium text-green-600 hover:text-green-700 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      {giftCardData.selectedEmails.length === emails.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                    {emails.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center p-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
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
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-slate-400 mr-2" />
                            <span className="text-sm font-medium text-slate-800">{email.email}</span>
                          </div>
                          {email.name && <div className="text-sm text-slate-500 ml-6">{email.name}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Cost Summary */}
                {giftCardData.amount && giftCardData.selectedEmails.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-700 font-medium">Total Cost:</span>
                      <span className="text-2xl font-bold text-green-700">
                        ${(parseFloat(giftCardData.amount || 0) * giftCardData.selectedEmails.length).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      ${giftCardData.amount} × {giftCardData.selectedEmails.length} recipients
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={closeGiftCardModal}
                className="px-6 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleGiftCardSend}
                disabled={uploading || !giftCardData.amount || giftCardData.selectedEmails.length === 0}
                className="px-6 py-3 text-sm font-semibold text-white bg-green-600 border border-transparent rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                {uploading ? (
                  <>
                    <Clock className="animate-spin h-4 w-4 mr-2" />
                    Sending Gift Cards...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send {giftCardData.selectedEmails.length} Gift Cards
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
