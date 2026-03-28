import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaBullseye,
  FaChartLine,
  FaCogs,
  FaDice,
  FaPlayCircle,
  FaTrophy,
  FaUpload,
} from "react-icons/fa";
import API from "../../../utils/api";
import Adsidenav from "./Adsidenav";

const pageHeaderStyle = {
  minHeight: "9vh",
  background: "linear-gradient(90deg, #0f5132, #1b7f5a)",
  color: "white",
};

const initialForm = {
  drawMonth: new Date().toISOString().slice(0, 7),
  drawType: "5-number-match",
  logicType: "random",
  requestedRuns: 6,
  notes: "",
};

const drawTypeMeta = {
  "5-number-match": {
    title: "5-Number Match",
    subtitle: "Jackpot tier with monthly rollover support",
    badge: "Grand Prize",
  },
  "4-number-match": {
    title: "4-Number Match",
    subtitle: "Secondary reward bracket for near-perfect entries",
    badge: "Elite Tier",
  },
  "3-number-match": {
    title: "3-Number Match",
    subtitle: "Entry-level winner band for broader recognition",
    badge: "Core Tier",
  },
};

function formatDate(value) {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function DrawManagement() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [history, setHistory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // async function loadDraws(drawMonth = form.drawMonth) {
  //   try {
  //     setLoading(true);
  //     const response = await API.get(`/draws?drawMonth=${drawMonth}`);
  //     const payload = response.data?.value || {};
  //     const draw = payload.currentDraw || null;

  //     setCurrentDraw(draw);
  //     setHistory(payload.history || []);
  //     setTickets(payload.tickets || []);
  //     setMetrics(payload.metrics || {});

  //     if (draw) {
  //       setForm((prev) => ({
  //         ...prev,
  //         drawMonth: draw.drawMonth || prev.drawMonth,
  //         drawType: draw.drawType || prev.drawType,
  //         logicType: draw.logicType || prev.logicType,
  //         notes: draw.notes || "",
  //       }));
  //     }
  //   } catch (error) {
  //     toast.error(error.response?.data?.msg || "Failed to load draw data");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    if (isAuthenticated !== "true") {
      navigate("/admin");
      return;
    }

    // loadDraws(initialForm.drawMonth);
  }, [navigate]);

  const publishedDraw = useMemo(
    () => history.find((draw) => draw.status === "published") || null,
    [history]
  );

  const winnerSummary = useMemo(() => {
    if (!currentDraw?.winners?.length) {
      return [
        { matchCount: 5, winners: 0 },
        { matchCount: 4, winners: 0 },
        { matchCount: 3, winners: 0 },
      ];
    }

    return [5, 4, 3].map((matchCount) => {
      const bucket = currentDraw.winners.find(
        (winner) => winner.matchCount === matchCount
      );

      return {
        matchCount,
        winners: bucket?.winners || 0,
      };
    });
  }, [currentDraw]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSimulate() {
    try {
      setSimulating(true);
      const response = await API.post("/draws/simulate", {
        drawMonth: form.drawMonth,
        drawType: form.drawType,
        logicType: form.logicType,
        requestedRuns: Number(form.requestedRuns) || 1,
        notes: form.notes,
      });

      setCurrentDraw(response.data?.value?.currentDraw || null);
      toast.success("Simulation completed");
      await loadDraws(form.drawMonth);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }

  async function handlePublish() {
    try {
      setPublishing(true);
      const response = await API.post("/draws/publish", {
        drawMonth: form.drawMonth,
        drawType: form.drawType,
        logicType: form.logicType,
        notes: form.notes,
        useSimulation: true,
      });

      toast.success(response.data?.value?.announcement || "Draw published");
      await loadDraws(form.drawMonth);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to publish draw");
    } finally {
      setPublishing(false);
    }
  }

  const lastSimulation = currentDraw?.lastSimulation;
  const activeType = drawTypeMeta[form.drawType];

  return (
    <div style={{ minHeight: "100vh", background: "#edf6f2", overflowX: "hidden" }}>
      <div
        className="row g-0 align-items-center px-4 mx-0"
        style={pageHeaderStyle}
      >
        <div className="col-md-8">
          <h2 className="mb-1">Draw Management</h2>
          <p className="mb-0 opacity-75">
            Configure random or algorithm-powered monthly draws, run simulations,
            and publish official results
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
                  <p className="text-muted mb-2">Monthly Cadence</p>
                  <h4 className="mb-1">Once / Month</h4>
                  <small className="text-muted">
                    Scheduled: {formatDate(currentDraw?.scheduledFor)}
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Current Jackpot</p>
                  <h4 className="mb-1 text-success">
                    {formatCurrency(currentDraw?.jackpotAmount)}
                  </h4>
                  <small className="text-muted">
                    Rollover: {formatCurrency(currentDraw?.rolloverAmount)}
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Participants</p>
                  <h4 className="mb-1">{metrics.totalParticipants ?? 0}</h4>
                  <small className="text-muted">
                    Algorithm ready: {metrics.algorithmReady ? "Yes" : "No"}
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Last Published</p>
                  <h4 className="mb-1">
                    {publishedDraw?.drawMonth || "Not published"}
                  </h4>
                  <small className="text-muted">
                    Status: {currentDraw?.status || "draft"}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-xl-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: 54,
                        height: 54,
                        background: "#dff5e9",
                        color: "#1b7f5a",
                      }}
                    >
                      <FaCogs />
                    </div>
                    <div>
                      <h4 className="mb-1">Custom Draw Engine</h4>
                      <p className="text-muted mb-0">
                        {activeType.title}: {activeType.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Draw Month</label>
                      <input
                        className="form-control"
                        type="month"
                        name="drawMonth"
                        value={form.drawMonth}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Draw Type</label>
                      <select
                        className="form-select"
                        name="drawType"
                        value={form.drawType}
                        onChange={handleChange}
                      >
                        <option value="5-number-match">5-Number Match</option>
                        <option value="4-number-match">4-Number Match</option>
                        <option value="3-number-match">3-Number Match</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Draw Logic</label>
                      <select
                        className="form-select"
                        name="logicType"
                        value={form.logicType}
                        onChange={handleChange}
                      >
                        <option value="random">
                          Random generation
                        </option>
                        <option value="algorithmic">
                          Algorithmic weighted logic
                        </option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Simulation Runs</label>
                      <input
                        className="form-control"
                        type="number"
                        min="1"
                        max="24"
                        name="requestedRuns"
                        value={form.requestedRuns}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Admin Notes</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Add month-specific rules, announcements, or draw context"
                      />
                    </div>
                  </div>

                  <div className="row g-3 mt-2">
                    <div className="col-sm-6">
                      <button
                        type="button"
                        className="btn btn-outline-success w-100"
                        onClick={handleSimulate}
                        disabled={simulating || loading}
                      >
                        <FaPlayCircle className="me-2" />
                        {simulating ? "Running..." : "Run Simulation"}
                      </button>
                    </div>
                    <div className="col-sm-6">
                      <button
                        type="button"
                        className="btn btn-success w-100"
                        onClick={handlePublish}
                        disabled={publishing || loading}
                      >
                        <FaUpload className="me-2" />
                        {publishing ? "Publishing..." : "Publish Results"}
                      </button>
                    </div>
                  </div>

                  <div
                    className="rounded-4 p-3 mt-4"
                    style={{ background: "#f4fbf7", border: "1px solid #d7eee2" }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">Active Winner Band</div>
                        <div className="text-muted small">{activeType.badge}</div>
                      </div>
                      <span className="badge text-bg-light border px-3 py-2">
                        {form.logicType === "algorithmic"
                          ? "Most / least frequent scores"
                          : "Lottery-style random"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-7">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h4 className="mb-1">Simulation Preview</h4>
                      <p className="text-muted mb-0">
                        Test the draw before official monthly publish
                      </p>
                    </div>
                    <span className="badge bg-light text-dark border">
                      {currentDraw?.status || "draft"}
                    </span>
                  </div>

                  {loading ? (
                    <p className="text-muted mb-0">Loading draw engine...</p>
                  ) : lastSimulation ? (
                    <>
                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <FaDice className="text-success" />
                              <h6 className="mb-0">Generated Numbers</h6>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                              {lastSimulation.numbers?.map((number) => (
                                <span
                                  key={number}
                                  className="badge rounded-pill text-bg-success px-3 py-2"
                                >
                                  {number}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="border rounded-4 p-3 h-100">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <FaChartLine className="text-primary" />
                              <h6 className="mb-0">Simulation Trends</h6>
                            </div>
                            <div className="small text-muted mb-2">
                              {lastSimulation.requestedRuns} runs executed on{" "}
                              {formatDate(lastSimulation.generatedAt)}
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                              {(lastSimulation.topTrendingNumbers || []).map((number) => (
                                <span
                                  key={number}
                                  className="badge rounded-pill text-bg-light border px-3 py-2"
                                >
                                  {number}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 text-center h-100">
                            <div className="text-muted small mb-1">
                              5-Match Triggers
                            </div>
                            <h4 className="mb-0">
                              {lastSimulation.distribution?.fiveMatch || 0}
                            </h4>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 text-center h-100">
                            <div className="text-muted small mb-1">
                              4-Match Triggers
                            </div>
                            <h4 className="mb-0">
                              {lastSimulation.distribution?.fourMatch || 0}
                            </h4>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 text-center h-100">
                            <div className="text-muted small mb-1">
                              3-Match Triggers
                            </div>
                            <h4 className="mb-0">
                              {lastSimulation.distribution?.threeMatch || 0}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-4 p-4 bg-light">
                      <p className="mb-2 fw-semibold">No simulation yet</p>
                      <p className="mb-0 text-muted">
                        Run a pre-analysis simulation to preview the monthly draw
                        before publishing it.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h4 className="mb-1">Published Results</h4>
                      <p className="text-muted mb-0">
                        Admin controlled release with jackpot rollover logic
                      </p>
                    </div>
                    <FaTrophy className="text-warning fs-4" />
                  </div>

                  <div className="row g-3 mb-4">
                    {winnerSummary.map((item) => (
                      <div className="col-md-4" key={item.matchCount}>
                        <div className="border rounded-4 p-3 h-100">
                          <div className="text-muted small mb-1">
                            {item.matchCount}-Number Match Winners
                          </div>
                          <h4 className="mb-0">{item.winners}</h4>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="rounded-4 p-3"
                    style={{ background: "#fff8e8", border: "1px solid #f4ddb2" }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <FaBullseye className="mt-1 text-warning" />
                      <div>
                        <div className="fw-semibold mb-1">Rollover Policy</div>
                        <div className="text-muted small">
                          {winnerSummary.find((item) => item.matchCount === 5)?.winners
                            ? "A 5-match winner exists, so the next month starts with the base jackpot."
                            : "No 5-match winner yet, so the jackpot carries forward to the next monthly draw."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-xl-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h4 className="mb-1">User Ticket Preview</h4>
                  <p className="text-muted mb-4">
                    Algorithm mode derives each ticket from player scores,
                    handicap, averages, and score spread
                  </p>

                  <div className="d-grid gap-3">
                    {tickets.slice(0, 6).map((ticket) => (
                      <div
                        key={ticket.userId}
                        className="border rounded-4 p-3 d-flex justify-content-between align-items-center flex-wrap gap-3"
                      >
                        <div>
                          <div className="fw-semibold">{ticket.fullName}</div>
                          <div className="text-muted small">Derived 5-number ticket</div>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {(ticket.ticketNumbers || []).map((number) => (
                            <span
                              key={`${ticket.userId}-${number}`}
                              className="badge rounded-pill text-bg-light border px-3 py-2"
                            >
                              {number}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h4 className="mb-1">Recent Draw History</h4>
                  <p className="text-muted mb-4">
                    Quick view of previous monthly simulations and published runs
                  </p>

                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Logic</th>
                          <th>Status</th>
                          <th>Jackpot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <tr key={item._id}>
                            <td>
                              <div className="fw-semibold">{item.drawMonth}</div>
                              <div className="small text-muted">
                                {item.drawType?.replaceAll("-", " ")}
                              </div>
                            </td>
                            <td className="text-capitalize">{item.logicType}</td>
                            <td>
                              <span className="badge text-bg-light border text-capitalize">
                                {item.status}
                              </span>
                            </td>
                            <td>{formatCurrency(item.jackpotAmount)}</td>
                          </tr>
                        ))}
                        {!history.length && (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-4">
                              No draw history available yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DrawManagement;
