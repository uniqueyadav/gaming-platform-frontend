import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaStar, FaUserMd } from "react-icons/fa";
import API from "../../utils/api";
import Adsidenav from "./admin/Adsidenav";
import { clearAdminSession, isAdminAuthenticated } from "../utils/adminAuth";

function AdminDash() {
  const [featuredCharity, setFeaturedCharity] = useState(null);
  const navigate = useNavigate();

  async function getFeaturedCharity() {
    try {
      const response = await API.get("/charities/featured/spotlight");
      if (response.data?.msg === "Success") {
        setFeaturedCharity(response.data.value || null);
      }
    } catch (error) {
      console.error("Error fetching featured charity:", error);
    }
  }

  function validation() {
    if (!isAdminAuthenticated()) {
      navigate("/admin", { replace: true });
      return false;
    }

    return true;
  }

  useEffect(() => {
    if (!validation()) {
      return;
    }

    getFeaturedCharity();
  }, [navigate]);

  return (
    <>
      <div
        className="row align-items-center px-4"
        style={{
          height: "8vh",
          background: "linear-gradient(90deg, #2563eb, #1e3a8a)",
          color: "white",
        }}
      >
        <div className="col-md-3 fw-bold fs-4 d-flex align-items-center">
          <FaUserMd className="me-2 fs-4" />
          <span>Admin Dashboard</span>
        </div>
        <div className="col-md-2 ms-auto text-end">
          <button
            onClick={() => {
              clearAdminSession();
              navigate("/admin", { replace: true });
            }}
            className="btn btn-light fw-bold px-4 py-1 rounded-pill shadow-sm"
          >
            <FaSignOutAlt className="me-2" />
            Logout
          </button>
        </div>
      </div>

      <div className="row" style={{ minHeight: "92vh", background: "#f5f6fa" }}>
        <Adsidenav />

        <div className="col-md-10 p-5">
          <h3 className="text-center mb-4 fw-bold text-primary">
            Admin Dashboard Overview
          </h3>

          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="mb-1">Featured Charity Spotlight</h4>
                  <p className="text-muted mb-0">
                    Homepage-ready spotlight content for the active giving partner
                  </p>
                </div>
                <FaStar className="text-warning fs-4" />
              </div>

              {featuredCharity ? (
                <div className="row g-3 align-items-center">
                  <div className="col-lg-4">
                    <img
                      src={
                        featuredCharity.images?.[0] ||
                        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80"
                      }
                      alt={featuredCharity.name}
                      className="img-fluid rounded-4"
                      style={{ maxHeight: "220px", objectFit: "cover", width: "100%" }}
                    />
                  </div>
                  <div className="col-lg-8">
                    <span className="badge text-bg-light border mb-2">
                      {featuredCharity.category}
                    </span>
                    <h4>{featuredCharity.name}</h4>
                    <p className="text-muted mb-2">
                      {featuredCharity.shortDescription || featuredCharity.description}
                    </p>
                    <p className="mb-0">
                      <strong>Upcoming:</strong>{" "}
                      {featuredCharity.upcomingEvents?.[0]?.title || "No event listed yet"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0">No featured charity available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDash;
