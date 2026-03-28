import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaChartBar,
  FaDonate,
  FaGolfBall,
  FaLayerGroup,
  FaSyncAlt,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import API from "../../../utils/api";
import Adsidenav from "./Adsidenav";

const pageHeaderStyle = {
  minHeight: "9vh",
  background: "linear-gradient(90deg, #1d3557, #457b9d)",
  color: "white",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDateTime(value) {
  if (!value) {
    return "Not generated yet";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReportsAnalytics() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function loadReport(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setLoadError("");
      const response = await API.get("/reports/analytics");
      setReport(response.data?.value || null);
    } catch (error) {
      const message = error.response?.data?.msg || "Failed to load reports";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    if (isAuthenticated !== "true") {
      navigate("/admin");
      return;
    }

    loadReport(true);
  }, [navigate]);

  const overviewCards = useMemo(() => {
    const overview = report?.overview || {};
    const drawStats = report?.drawStatistics || {};

    return [
      {
        title: "Total Users",
        value: overview.totalUsers ?? 0,
        subtitle: "Registered golf members in the database",
        icon: <FaUsers />,
        color: "#1d4ed8",
        bg: "#e8f0ff",
      },
      {
        title: "Total Prize Pool",
        value: formatCurrency(overview.totalPrizePool),
        subtitle: "Combined jackpot amount across all draws",
        icon: <FaTrophy />,
        color: "#15803d",
        bg: "#eaf8ee",
      },
      {
        title: "Charity Contributions",
        value: formatCurrency(overview.totalCharityContribution),
        subtitle: "Projected giving plus direct donations",
        icon: <FaDonate />,
        color: "#b45309",
        bg: "#fff4df",
      },
      {
        title: "Draw Statistics",
        value: overview.totalDraws ?? 0,
        subtitle: `${drawStats.publishedDraws ?? 0} published draws tracked`,
        icon: <FaChartBar />,
        color: "#7c3aed",
        bg: "#f2ebff",
      },
    ];
  }, [report]);

  const contributionRows = report?.charityContributionTotals || [];
  const drawStats = report?.drawStatistics || {};

  return (
    <div style={{ minHeight: "100vh", background: "#f3f6fb", overflowX: "hidden" }}>
      <div className="row g-0 align-items-center px-4 mx-0" style={pageHeaderStyle}>
        <div className="col-md-8">
          <h2 className="mb-1">Reports & Analytics</h2>
          <p className="mb-0 opacity-75">
            Live admin reporting for users, prize pools, charity giving, and draw performance
          </p>
        </div>
        <div className="col-md-4 text-md-end mt-3 mt-md-0">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => loadReport(false)}
            disabled={loading || refreshing}
          >
            <FaSyncAlt className="me-2" />
            {refreshing ? "Refreshing..." : "Refresh Report"}
          </button>
        </div>
      </div>

      <div className="row g-0 mx-0">
        <Adsidenav />

        <div className="col-md-10 p-4 p-lg-5">
          {!!loadError && (
            <div className="alert alert-danger" role="alert">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 text-muted">Loading analytics dashboard...</div>
            </div>
          ) : (
            <>
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                      <h4 className="mb-1">Database Snapshot</h4>
                      <p className="text-muted mb-0">
                        Last generated: {formatDateTime(report?.generatedAt)}
                      </p>
                    </div>
                    <span className="badge text-bg-light border px-3 py-2">
                      <FaLayerGroup className="me-2" />
                      MongoDB connected metrics
                    </span>
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                {overviewCards.map((card) => (
                  <div className="col-md-6 col-xl-3" key={card.title}>
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start gap-3">
                          <div>
                            <p className="text-muted mb-2">{card.title}</p>
                            <h3 className="mb-2">{card.value}</h3>
                            <small className="text-muted">{card.subtitle}</small>
                          </div>
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: 52,
                              height: 52,
                              background: card.bg,
                              color: card.color,
                              fontSize: 20,
                            }}
                          >
                            {card.icon}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-4">
                <div className="col-xl-7">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <FaDonate className="text-warning fs-4" />
                        <div>
                          <h4 className="mb-1">Charity Contribution Totals</h4>
                          <p className="text-muted mb-0">
                            Supporters, projected subscription share, and direct donations by charity
                          </p>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <table className="table align-middle">
                          <thead>
                            <tr>
                              <th>Charity</th>
                              <th>Supporters</th>
                              <th>Projected</th>
                              <th>Direct</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contributionRows.map((row) => (
                              <tr key={row.charityId || row.charityName}>
                                <td>
                                  <div className="fw-semibold">{row.charityName}</div>
                                </td>
                                <td>{row.supporterCount}</td>
                                <td>{formatCurrency(row.projectedContribution)}</td>
                                <td>{formatCurrency(row.directDonationTotal)}</td>
                                <td className="fw-semibold">
                                  {formatCurrency(row.overallContribution)}
                                </td>
                              </tr>
                            ))}
                            {!contributionRows.length && (
                              <tr>
                                <td colSpan="5" className="text-center text-muted py-4">
                                  No contribution records available yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-5">
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <FaGolfBall className="text-success fs-4" />
                        <div>
                          <h4 className="mb-1">Draw Statistics</h4>
                          <p className="text-muted mb-0">
                            Summary of draw lifecycle and jackpot performance
                          </p>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Published</div>
                            <h4 className="mb-0">{drawStats.publishedDraws ?? 0}</h4>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Simulated</div>
                            <h4 className="mb-0">{drawStats.simulatedDraws ?? 0}</h4>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Draft</div>
                            <h4 className="mb-0">{drawStats.draftDraws ?? 0}</h4>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Participants</div>
                            <h4 className="mb-0">{drawStats.totalParticipants ?? 0}</h4>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Winner Count</div>
                            <h4 className="mb-0">{drawStats.totalWinnerCount ?? 0}</h4>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Latest Draw</div>
                            <h4 className="mb-0">{drawStats.latestDrawMonth || "N/A"}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="mb-1">Prize Pool Insights</h4>
                      <p className="text-muted mb-4">
                        Quick look at average and peak jackpot values stored in the system
                      </p>

                      <div className="border rounded-4 p-3 mb-3">
                        <div className="text-muted small mb-1">Average Jackpot</div>
                        <h4 className="mb-0 text-primary">
                          {formatCurrency(drawStats.averageJackpot)}
                        </h4>
                      </div>

                      <div className="border rounded-4 p-3">
                        <div className="text-muted small mb-1">Highest Jackpot</div>
                        <h4 className="mb-0 text-success">
                          {formatCurrency(drawStats.highestJackpot)}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsAnalytics;
