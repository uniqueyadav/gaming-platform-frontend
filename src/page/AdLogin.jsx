import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../utils/api.js";
import { isAdminAuthenticated, setAdminSession } from "../utils/adminAuth.js";

function Adlogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  async function adlog(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage("");

    try {
      const admin = {
        email: email.trim(),
        password,
      };

      const response = await API.post("/admin/login", admin);
      const message = response.data?.msg;

      if (message === "Success") {
        setAdminSession(response.data?.value?.email || admin.email);
        toast.success("Login successful");
        setEmail("");
        setPassword("");
        setStatusMessage("");
        navigate("/dashboard", { replace: true });
        return;
      }

      setStatusMessage(message || "Invalid credentials");
      toast.error(message || "Invalid credentials");
    } catch (error) {
      const message =
        error.response?.data?.msg || "Server error. Please try again later.";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg border-0" style={{ maxWidth: "400px", width: "100%", borderRadius: "15px" }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-dark">Admin Login</h2>
            <p className="text-muted small">Welcome back! Please login to continue</p>
          </div>

          <form onSubmit={adlog}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary">Email Address</label>
              <input
                type="email"
                className="form-control form-control-lg shadow-sm"
                placeholder="admin@example.com"
                style={{ fontSize: "0.9rem", borderRadius: "10px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-secondary">Password</label>
              <input
                type="password"
                className="form-control form-control-lg shadow-sm"
                placeholder="••••••••"
                style={{ fontSize: "0.9rem", borderRadius: "10px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {statusMessage && (
              <div className="alert alert-danger py-2 text-center small border-0 mb-3" role="alert">
                {statusMessage}
              </div>
            )}

            <button 
              className="btn btn-primary btn-lg w-100 shadow-sm fw-bold" 
              type="submit" 
              disabled={submitting}
              style={{ borderRadius: "10px", transition: "0.3s" }}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : null}
              {submitting ? "Checking..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Adlogin;