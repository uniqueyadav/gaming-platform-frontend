import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserMd,
  FaUsers,
  FaClipboardList,
  FaEnvelopeOpenText,
} from "react-icons/fa";

function Adsidenav() {
  const location = useLocation();

  const links = [
    { to: "/dashboard", icon: <FaTachometerAlt />, text: "Dashboard" },
    { to: "/charitymanagement", icon: <FaUserMd />, text: "Charity Management" },
    { to: "/drawmanagement", icon: <FaUsers />, text: "Draw Management" },
    { to: "/reportsanalytics", icon: <FaClipboardList />, text: "Report & Analytics" },
    { to: "/usermanagement", icon: <FaUserMd />, text: "User Management" },
    { to: "/winnersmanagement", icon: <FaEnvelopeOpenText />, text: "Winner Management" },
  ];

  return (
    <div
      className="col-md-2 d-flex flex-column p-0 shadow-sm"
      style={{
        background: "linear-gradient(180deg, #0077b6 0%, #0096c7 100%)",
        minHeight: "92vh",
        color: "white",
      }}
    >
      <div className="text-center py-4 border-bottom border-light">
        <h5 className="fw-bold mb-0 text-white">Admin Panel</h5>
      </div>

      <ul className="nav flex-column mt-3">
        {links.map((link, index) => (
          <li key={link.to} className="nav-item my-1">
            <Link
              to={link.to}
              className={`nav-link d-flex align-items-center gap-3 px-4 py-2 fw-semibold rounded-2 ${
                location.pathname === link.to ? "active-link" : "text-white"
              }`}
              style={{
                transition: "all 0.3s ease",
                textDecoration: "none",
              }}
            >
              <span className="fs-5">{link.icon}</span>
              <span>{link.text}</span>
            </Link>
          </li>
        ))}
      </ul>

      <style>{`
        .nav-link:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff !important;
          transform: translateX(3px);
        }
        .active-link {
          background: rgba(255, 255, 255, 0.25);
          color: #fff !important;
          box-shadow: inset 3px 0 0 #ffd60a;
        }
      `}</style>
    </div>
  );
}

export default Adsidenav;
