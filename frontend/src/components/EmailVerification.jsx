import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { CheckCircle, XCircle, Loader } from "lucide-react";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await authAPI.verifyEmail(token);

      if (response.data.success) {
        setStatus("success");
        setMessage(response.data.message);
        setUserInfo(response.data.data.user);
      } else {
        setStatus("error");
        setMessage(response.data.message || "Email verification failed");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Email verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === "verifying" && (
            <>
              <Loader className="mx-auto h-16 w-16 text-indigo-600 animate-spin" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verifying Your Email</h2>
              <p className="mt-2 text-sm text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verified Successfully!</h2>
              <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-md">
                <p className="text-green-700 text-sm">{message}</p>
              </div>
              {userInfo && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-300 rounded-md">
                  <p className="text-indigo-700 text-sm">
                    Welcome, <span className="font-medium">{userInfo.name}</span>! Your account is now active.
                  </p>
                </div>
              )}
              <div className="mt-6">
                <Link
                  to="/dashboard"
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Dashboard
                </Link>
              </div>
              <div className="mt-4">
                <Link to="/login" className="text-indigo-600 hover:text-indigo-500 text-sm">
                  Or sign in to your account
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verification Failed</h2>
              <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-md">
                <p className="text-red-700 text-sm">{message}</p>
              </div>
              <div className="mt-6 space-y-4">
                <Link
                  to="/register"
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Register Again
                </Link>
                <Link to="/login" className="text-indigo-600 hover:text-indigo-500 text-sm block text-center">
                  Already have an account? Sign in
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">Having trouble? Please contact support for assistance.</p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
