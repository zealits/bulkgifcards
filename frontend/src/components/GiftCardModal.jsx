import React, { useState, useEffect } from "react";
import { giftCardAPI } from "../services/api";
import { X, Gift, DollarSign, Mail, MessageSquare, Send, CheckCircle, AlertCircle, Loader } from "lucide-react";

const GiftCardModal = ({ isOpen, onClose, emailList, emails }) => {
  const [step, setStep] = useState(1); // 1: Setup, 2: Email Selection, 3: Confirmation, 4: Result
  const [formData, setFormData] = useState({
    amount: "",
    message: "Congratulations! Enjoy your gift card!",
    selectedEmails: [],
  });
  const [allSelected, setAllSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setStep(1);
      setFormData({
        amount: "",
        message: "Congratulations! Enjoy your gift card!",
        selectedEmails: [],
      });
      setAllSelected(false);
      setError("");
      setResult(null);
    }
  }, [isOpen]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData((prev) => ({ ...prev, amount: value }));
      setError("");
    }
  };

  const handleMessageChange = (e) => {
    setFormData((prev) => ({ ...prev, message: e.target.value }));
  };

  const handleEmailToggle = (email) => {
    setFormData((prev) => {
      const selectedEmails = prev.selectedEmails.includes(email)
        ? prev.selectedEmails.filter((e) => e !== email)
        : [...prev.selectedEmails, email];

      return { ...prev, selectedEmails };
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setFormData((prev) => ({ ...prev, selectedEmails: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedEmails: emails.map((email) => email.email),
      }));
    }
    setAllSelected(!allSelected);
  };

  const validateStep1 = () => {
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      setError("Please enter a valid amount");
      return false;
    }
    if (amount < 1) {
      setError("Amount must be at least $1");
      return false;
    }
    if (amount > 1000) {
      setError("Amount cannot exceed $1000");
      return false;
    }
    if (!formData.message.trim()) {
      setError("Please enter a message");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.selectedEmails.length === 0) {
      setError("Please select at least one email address");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");

    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSendGiftCards = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await giftCardAPI.sendGiftCards({
        emailListId: emailList.id,
        selectedEmails: formData.selectedEmails,
        amount: parseFloat(formData.amount),
        message: formData.message,
      });

      if (response.data.success) {
        setResult(response.data.data);
        setStep(4);
      } else {
        setError(response.data.message || "Failed to send gift cards");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send gift cards");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form after a delay to allow smooth modal transition
    setTimeout(() => {
      setStep(1);
      setFormData({
        amount: "",
        message: "Congratulations! Enjoy your gift card!",
        selectedEmails: [],
      });
      setError("");
      setResult(null);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Gift className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Send Gift Cards</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step >= stepNum ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stepNum < step || (stepNum === 4 && result) ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${step > stepNum ? "bg-indigo-600" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? "text-indigo-600" : "text-gray-500"}>Setup</span>
            <span className={step >= 2 ? "text-indigo-600" : "text-gray-500"}>Select Emails</span>
            <span className={step >= 3 ? "text-indigo-600" : "text-gray-500"}>Confirm</span>
            <span className={step >= 4 ? "text-indigo-600" : "text-gray-500"}>Complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Step 1: Setup */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gift Card Details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Gift Card Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="text"
                        value={formData.amount}
                        onChange={handleAmountChange}
                        placeholder="50.00"
                        className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Enter amount between $1 and $1000</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Personal Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={handleMessageChange}
                      rows={3}
                      placeholder="Add a personal message..."
                      className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">This message will be included with each gift card</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Email Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Select Recipients</h3>
                <button onClick={handleSelectAll} className="text-sm text-indigo-600 hover:text-indigo-800">
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                From: <span className="font-medium">{emailList.fileName}</span>
                {" • "}
                <span className="font-medium">{emails.length}</span> total emails
                {" • "}
                <span className="font-medium">{formData.selectedEmails.length}</span> selected
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                {emails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedEmails.includes(email.email)}
                      onChange={() => handleEmailToggle(email.email)}
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
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Confirm Gift Card Details</h3>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gift Card Amount:</span>
                  <span className="font-medium">${formData.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-medium">{formData.selectedEmails.length} emails</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-semibold text-lg">
                    ${(parseFloat(formData.amount) * formData.selectedEmails.length).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Message:</h4>
                <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-600">
                  {formData.message}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Recipients ({formData.selectedEmails.length}):
                </h4>
                <div className="max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-md">
                  {formData.selectedEmails.map((email, index) => (
                    <div key={index} className="px-3 py-2 border-b border-gray-100 last:border-b-0 text-sm">
                      {email}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 4 && result && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {result.successful > 0 ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <AlertCircle className="h-16 w-16 text-red-500" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {result.successful > 0 ? "Gift Cards Sent!" : "Sending Failed"}
                </h3>
                <p className="text-gray-600 mt-2">
                  {result.successful > 0
                    ? `Successfully sent ${result.successful} gift cards worth $${result.totalAmount.toFixed(2)}`
                    : "Unable to send gift cards. Please try again."}
                </p>
              </div>

              {result.failed > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800 text-sm">
                    {result.failed} gift cards failed to send. Please check the errors below.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-gray-900 mb-2">Summary:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Processed:</span>
                    <span>{result.totalProcessed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Successful:</span>
                    <span className="text-green-600">{result.successful}</span>
                  </div>
                  {result.failed > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-600">Failed:</span>
                      <span className="text-red-600">{result.failed}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          {step < 4 && (
            <>
              <button
                onClick={step === 1 ? handleClose : handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {step === 1 ? "Cancel" : "Back"}
              </button>

              <button
                onClick={step === 3 ? handleSendGiftCards : handleNext}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Sending...
                  </>
                ) : step === 3 ? (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Gift Cards
                  </>
                ) : (
                  "Next"
                )}
              </button>
            </>
          )}

          {step === 4 && (
            <button
              onClick={handleClose}
              className="ml-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftCardModal;
