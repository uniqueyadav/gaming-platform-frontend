import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaClipboardCheck,
  FaMoneyCheckAlt,
  FaSearch,
  FaTimesCircle,
  FaTrophy,
  FaUpload,
} from "react-icons/fa";
import API from "../../../utils/api";
import Adsidenav from "./Adsidenav";
import { isAdminAuthenticated } from "../../utils/adminAuth";

const pageHeaderStyle = {
  minHeight: "9vh",
  background: "linear-gradient(90deg, #7c2d12, #c2410c)",
  color: "white",
};

const emptyForm = {
  proofScreenshotUrl: "",
  submissionNotes: "",
  reviewNotes: "",
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
    return "Not available";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WinnersManagement() {
  const navigate = useNavigate();
  const [winners, setWinners] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    eligibilityStatus: "",
    payoutStatus: "",
    drawMonth: "",
  });
  const [drawMonths, setDrawMonths] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pendingReview: 0,
    approved: 0,
    paid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function loadWinners(activeId = selectedId) {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (String(value || "").trim()) {
          params.set(key, String(value).trim());
        }
      });

      const response = await API.get(`/winners?${params.toString()}`);
      const winnerList = response.data?.value || [];

      setWinners(winnerList);
      setDrawMonths(response.data?.meta?.drawMonths || []);
      setSummary(
        response.data?.meta?.summary || {
          total: 0,
          pendingReview: 0,
          approved: 0,
          paid: 0,
        }
      );

      if (winnerList.length > 0) {
        const currentId = activeId || winnerList[0]._id;
        const matched = winnerList.find((winner) => winner._id === currentId) || winnerList[0];
        setSelectedId(matched._id);
      } else {
        setSelectedId("");
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to load winners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin", { replace: true });
      return;
    }

    loadWinners();
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWinners();
    }, 250);

    return () => clearTimeout(timer);
  }, [filters.search, filters.eligibilityStatus, filters.payoutStatus, filters.drawMonth]);

  const selectedWinner = useMemo(
    () => winners.find((winner) => winner._id === selectedId) || null,
    [winners, selectedId]
  );

  useEffect(() => {
    if (!selectedWinner) {
      setForm(emptyForm);
      return;
    }

    setForm({
      proofScreenshotUrl: selectedWinner.proofScreenshotUrl || "",
      submissionNotes: selectedWinner.submissionNotes || "",
      reviewNotes: selectedWinner.reviewNotes || "",
    });
  }, [selectedWinner]);

  async function handleSubmissionSave() {
    if (!selectedWinner) {
      return;
    }

    try {
      setSavingSubmission(true);
      await API.patch(`/winners/${selectedWinner._id}/submission`, {
        proofScreenshotUrl: form.proofScreenshotUrl,
        submissionNotes: form.submissionNotes,
      });
      toast.success("Proof submission saved");
      await loadWinners(selectedWinner._id);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save proof submission");
    } finally {
      setSavingSubmission(false);
    }
  }

  async function handleReview(status) {
    if (!selectedWinner) {
      return;
    }

    try {
      setSavingReview(true);
      await API.patch(`/winners/${selectedWinner._id}/review`, {
        eligibilityStatus: status,
        reviewNotes: form.reviewNotes,
      });
      toast.success(
        status === "approved" ? "Winner approved successfully" : "Winner rejected successfully"
      );
      await loadWinners(selectedWinner._id);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update review");
    } finally {
      setSavingReview(false);
    }
  }

  async function handlePayout(status) {
    if (!selectedWinner) {
      return;
    }

    try {
      setSavingPayout(true);
      await API.patch(`/winners/${selectedWinner._id}/payout`, {
        payoutStatus: status,
      });
      toast.success(status === "paid" ? "Payout marked as completed" : "Payout reset to pending");
      await loadWinners(selectedWinner._id);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update payout");
    } finally {
      setSavingPayout(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff7ed", overflowX: "hidden" }}>
      <div className="row g-0 align-items-center px-4 mx-0" style={pageHeaderStyle}>
        <div className="col-md-8">
          <h2 className="mb-1">Winners Management</h2>
          <p className="mb-0 opacity-75">
            View full winners list, verify golf score submissions, and mark payouts
            as completed
          </p>
        </div>
      </div>

      <div className="row g-0 mx-0">
        <Adsidenav />

        <div className="col-md-10 p-4 p-lg-5">
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Total Winners</p>
                  <h3 className="mb-0">{summary.total}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Pending Eligibility</p>
                  <h3 className="mb-0">{summary.pendingReview}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Approved</p>
                  <h3 className="mb-0">{summary.approved}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Paid Out</p>
                  <h3 className="mb-0">{summary.paid}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-xl-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 className="mb-1">Winner Queue</h4>
                      <p className="text-muted mb-0">Published draw winners synced from database</p>
                    </div>
                    <FaTrophy className="text-warning fs-4" />
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label">Search</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaSearch />
                        </span>
                        <input
                          className="form-control"
                          placeholder="Search by winner name or email"
                          value={filters.search}
                          onChange={(event) =>
                            setFilters((prev) => ({ ...prev, search: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Eligibility</label>
                      <select
                        className="form-select"
                        value={filters.eligibilityStatus}
                        onChange={(event) =>
                          setFilters((prev) => ({
                            ...prev,
                            eligibilityStatus: event.target.value,
                          }))
                        }
                      >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Payout</label>
                      <select
                        className="form-select"
                        value={filters.payoutStatus}
                        onChange={(event) =>
                          setFilters((prev) => ({
                            ...prev,
                            payoutStatus: event.target.value,
                          }))
                        }
                      >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Draw Month</label>
                      <select
                        className="form-select"
                        value={filters.drawMonth}
                        onChange={(event) =>
                          setFilters((prev) => ({ ...prev, drawMonth: event.target.value }))
                        }
                      >
                        <option value="">All draw months</option>
                        {drawMonths.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <p className="text-muted mb-0">Loading winners list...</p>
                  ) : (
                    <div className="d-grid gap-3">
                      {winners.map((winner) => (
                        <button
                          key={winner._id}
                          type="button"
                          className={`btn text-start border rounded-4 p-3 ${
                            selectedId === winner._id ? "btn-warning-subtle border-warning" : "btn-light"
                          }`}
                          onClick={() => setSelectedId(winner._id)}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div>
                              <div className="fw-bold">{winner.fullName}</div>
                              <div className="small text-muted">{winner.email}</div>
                              <div className="small mt-1">
                                {winner.drawMonth} | {winner.matchCount}-Number Match
                              </div>
                            </div>
                            <span className="badge text-bg-light border">
                              {winner.payoutStatus}
                            </span>
                          </div>
                          <div className="small mt-2 text-muted">
                            Eligibility: {winner.eligibilityStatus} | Submission:{" "}
                            {winner.submissionStatus}
                          </div>
                        </button>
                      ))}

                      {!winners.length && (
                        <div className="rounded-4 p-4 bg-light text-muted">
                          No winners found for the selected filters.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-xl-7">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  {selectedWinner ? (
                    <>
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                        <div>
                          <h4 className="mb-1">{selectedWinner.fullName}</h4>
                          <p className="text-muted mb-0">
                            Winner detail, proof verification, and payout control
                          </p>
                        </div>
                        <span className="badge bg-light text-dark border px-3 py-2">
                          {selectedWinner.drawMonth} | {selectedWinner.matchCount}-Match
                        </span>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Prize Amount</div>
                            <h5 className="mb-0">{formatCurrency(selectedWinner.payoutAmount)}</h5>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Eligibility</div>
                            <h5 className="mb-0 text-capitalize">
                              {selectedWinner.eligibilityStatus}
                            </h5>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="text-muted small mb-1">Payout State</div>
                            <h5 className="mb-0 text-capitalize">{selectedWinner.payoutStatus}</h5>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-4 p-3 mb-4" style={{ background: "#fff4e6" }}>
                        <div className="fw-semibold mb-2">Winning Ticket Snapshot</div>
                        <div className="small text-muted mb-2">
                          Winning Numbers: {(selectedWinner.winningNumbers || []).join(", ") || "N/A"}
                        </div>
                        <div className="small text-muted">
                          Ticket Numbers: {(selectedWinner.ticketNumbers || []).join(", ") || "N/A"}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <FaUpload className="text-primary" />
                          <h5 className="mb-0">Proof Upload</h5>
                        </div>
                        <p className="text-muted small">
                          Screenshot of scores from the golf platform is required for eligibility verification.
                        </p>
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label">Proof Screenshot URL</label>
                            <input
                              className="form-control"
                              placeholder="Paste screenshot image URL"
                              value={form.proofScreenshotUrl}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  proofScreenshotUrl: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Submission Notes</label>
                            <textarea
                              className="form-control"
                              rows="3"
                              placeholder="Optional notes about the score screenshot"
                              value={form.submissionNotes}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  submissionNotes: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-3">
                          <div className="small text-muted">
                            Submitted: {formatDateTime(selectedWinner.submittedAt)}
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSubmissionSave}
                            disabled={savingSubmission}
                          >
                            <FaUpload className="me-2" />
                            {savingSubmission ? "Saving..." : "Save Submission"}
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <FaClipboardCheck className="text-success" />
                          <h5 className="mb-0">Admin Review</h5>
                        </div>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Add approval or rejection notes"
                          value={form.reviewNotes}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, reviewNotes: event.target.value }))
                          }
                        />
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-3">
                          <div className="small text-muted">
                            Reviewed: {formatDateTime(selectedWinner.reviewedAt)}
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleReview("rejected")}
                              disabled={savingReview}
                            >
                              <FaTimesCircle className="me-2" />
                              Reject
                            </button>
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => handleReview("approved")}
                              disabled={savingReview}
                            >
                              <FaCheckCircle className="me-2" />
                              {savingReview ? "Saving..." : "Approve"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-4 p-4" style={{ background: "#f9fafb" }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <FaMoneyCheckAlt className="text-warning" />
                          <h5 className="mb-0">Payment State</h5>
                        </div>
                        <p className="text-muted small mb-3">
                          Payment flow: Pending to Paid. Only approved winners can be marked as paid.
                        </p>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                          <div className="small text-muted">
                            Paid At: {formatDateTime(selectedWinner.paidAt)}
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => handlePayout("pending")}
                              disabled={savingPayout}
                            >
                              Set Pending
                            </button>
                            <button
                              type="button"
                              className="btn btn-warning"
                              onClick={() => handlePayout("paid")}
                              disabled={
                                savingPayout || selectedWinner.eligibilityStatus !== "approved"
                              }
                            >
                              {savingPayout ? "Updating..." : "Mark Paid"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {!!selectedWinner.userId?.golfScores?.length && (
                        <div className="mt-4">
                          <h5 className="mb-3">Recent Score Snapshot</h5>
                          <div className="table-responsive">
                            <table className="table align-middle">
                              <thead>
                                <tr>
                                  <th>Course</th>
                                  <th>Score</th>
                                  <th>Played On</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedWinner.userId.golfScores.slice(0, 5).map((score, index) => (
                                  <tr key={`${score.courseName}-${index}`}>
                                    <td>{score.courseName || "N/A"}</td>
                                    <td>{score.score ?? 0}</td>
                                    <td>{formatDateTime(score.playedAt)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-4 p-5 bg-light text-muted text-center">
                      Select a winner from the list to review proof and manage payout.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WinnersManagement;
