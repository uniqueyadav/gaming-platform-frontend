import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaBullseye,
  FaChartPie,
  FaCheckCircle,
  FaEdit,
  FaGolfBall,
  FaHandHoldingHeart,
  FaSignOutAlt,
  FaTrophy,
  FaUserCog,
} from "react-icons/fa";
import API from "../../utils/api";
import {
  clearUserSession,
  getUserSession,
  setUserSession,
} from "../utils/userAuth";

const navItems = [
  { id: "overview", label: "Overview", icon: <FaChartPie /> },
  { id: "scores", label: "Scores", icon: <FaGolfBall /> },
  { id: "charity", label: "Charity", icon: <FaHandHoldingHeart /> },
  { id: "participation", label: "Participation", icon: <FaTrophy /> },
  { id: "profile", label: "Profile", icon: <FaUserCog /> },
];

const emptyForm = {
  _id: "",
  fullName: "",
  email: "",
  phone: "",
  membershipLevel: "Standard",
  handicap: 0,
  subscriptionPlan: "Monthly",
  subscriptionStatus: "active",
  subscriptionEndDate: "",
  contribution: {
    charityId: "",
    charityName: "",
    contributionPercentage: 10,
    independentDonationAmount: 0,
    contributionNotes: "",
  },
  golfScores: [
    { courseName: "", score: "", playedAt: "" },
    { courseName: "", score: "", playedAt: "" },
    { courseName: "", score: "", playedAt: "" },
  ],
};

function normalizeUser(user) {
  const scores = [...(user.golfScores || [])];
  while (scores.length < 3) {
    scores.push({ courseName: "", score: "", playedAt: "" });
  }

  return {
    _id: user._id || "",
    fullName: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    membershipLevel: user.membershipLevel || "Standard",
    handicap: user.handicap ?? 0,
    subscriptionPlan: user.subscriptionPlan || "Monthly",
    subscriptionStatus: user.subscriptionStatus || "active",
    subscriptionEndDate: user.subscriptionEndDate
      ? new Date(user.subscriptionEndDate).toISOString().split("T")[0]
      : "",
    contribution: {
      charityId: user.contribution?.charityId || "",
      charityName: user.contribution?.charityName || "",
      contributionPercentage: user.contribution?.contributionPercentage ?? 10,
      independentDonationAmount:
        user.contribution?.independentDonationAmount ?? 0,
      contributionNotes: user.contribution?.contributionNotes || "",
    },
    golfScores: scores.slice(0, 3).map((score) => ({
      courseName: score.courseName || "",
      score: score.score ?? "",
      playedAt: score.playedAt
        ? new Date(score.playedAt).toISOString().split("T")[0]
        : "",
    })),
  };
}

function formatDate(value) {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function UserDash() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [form, setForm] = useState(emptyForm);
  const [charities, setCharities] = useState([]);
  const [drawData, setDrawData] = useState(null);
  const [winnerEntries, setWinnerEntries] = useState([]);
  const [proofDraft, setProofDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const session = getUserSession();
    if (!session?._id) {
      navigate("/login", { replace: true });
      return;
    }

    //loadDashboard(session);
  }, [navigate]);

  async function loadDashboard(session = getUserSession()) {
    if (!session?._id) {
      return;
    }

    try {
      setLoading(true);
      const [userResponse, charitiesResponse, drawResponse, winnersResponse] =
        await Promise.all([
          API.get(`/users/${session._id}`),
          API.get("/charities?status=active"),
          API.get("/draws"),
          API.get(`/winners?search=${encodeURIComponent(session.email || "")}`),
        ]);

      const user = userResponse.data?.value;
      const winnerList = (winnersResponse.data?.value || []).filter(
        (entry) =>
          entry.userId?._id === session._id ||
          entry.email?.toLowerCase() === session.email?.toLowerCase()
      );

      setForm(normalizeUser(user || emptyForm));
      setUserSession(user || session);
      setCharities(charitiesResponse.data?.value || []);
      setDrawData(drawResponse.data?.value || null);
      setWinnerEntries(winnerList);
      setProofDraft(
        winnerList.reduce((acc, entry) => {
          acc[entry._id] = {
            proofScreenshotUrl: entry.proofScreenshotUrl || "",
            submissionNotes: entry.submissionNotes || "",
          };
          return acc;
        }, {})
      );
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  const dashboardSummary = useMemo(() => {
    const enteredDraws =
      winnerEntries.length ||
      form.golfScores.filter((score) => score.courseName || score.score).length;

    return {
      enteredDraws,
      approvedWins: winnerEntries.filter(
        (entry) => entry.eligibilityStatus === "approved"
      ).length,
      activeScoreCount: form.golfScores.filter(
        (score) => score.courseName || score.score || score.playedAt
      ).length,
      selectedCharity:
        form.contribution.charityName ||
        charities.find((charity) => charity._id === form.contribution.charityId)
          ?.name ||
        "Not selected",
      renewalDate: form.subscriptionEndDate
        ? formatDate(form.subscriptionEndDate)
        : "Set after first renewal",
      nextDrawDate: drawData?.metrics?.nextScheduledDate
        ? formatDate(drawData.metrics.nextScheduledDate)
        : "Awaiting schedule",
    };
  }, [charities, drawData, form, winnerEntries]);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleContributionChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      contribution: {
        ...prev.contribution,
        [name]: value,
      },
    }));
  }

  function handleScoreChange(index, field, value) {
    setForm((prev) => {
      const golfScores = [...prev.golfScores];
      golfScores[index] = { ...golfScores[index], [field]: value };
      return { ...prev, golfScores };
    });
  }

  async function handleSaveProfile(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        handicap: Number(form.handicap) || 0,
        contribution: {
          ...form.contribution,
          contributionPercentage:
            Math.max(10, Number(form.contribution.contributionPercentage)) || 10,
          independentDonationAmount:
            Math.max(0, Number(form.contribution.independentDonationAmount)) || 0,
        },
        golfScores: form.golfScores.filter(
          (score) => score.courseName || score.score || score.playedAt
        ),
      };

      const response = await API.put(`/users/${form._id}`, payload);
      const updatedUser = response.data?.value;
      setForm(normalizeUser(updatedUser));
      setUserSession(updatedUser);
      toast.success("Dashboard details updated");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleProofSubmit(winnerId) {
    const proofPayload = proofDraft[winnerId];

    if (!proofPayload?.proofScreenshotUrl) {
      toast.error("Proof screenshot URL is required");
      return;
    }

    try {
      await API.patch(`/winners/${winnerId}/submission`, proofPayload);
      toast.success("Winner proof submitted");
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Unable to submit proof");
    }
  }

  // if (loading) {
  //   return (
  //     <div className="user-dashboard-page centered-state">
  //       <div className="loader-card">Loading your member dashboard...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="user-dashboard-page">
      <aside className="user-sidenav">
        <div>
          <div className="brand-mark">GC</div>
          <h2>Golfer Hub</h2>
          <p>Manage subscription, scores, draws, and charity impact.</p>
        </div>

        <nav className="nav-stack">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? "active" : ""}
              onClick={() => setActiveSection(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="side-profile-card">
          <small>Logged in as</small>
          <strong>{form.fullName}</strong>
          <span>{form.email}</span>
          <button
            type="button"
            className="side-logout"
            onClick={() => {
              clearUserSession();
              navigate("/login", { replace: true });
            }}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      <main className="user-dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <div className="eyebrow">UserDash</div>
            <h1>
              Subscription status:{" "}
              <span className="status-pill">{form.subscriptionStatus}</span>
            </h1>
            <p>
              Renewal date {dashboardSummary.renewalDate} | Upcoming draw{" "}
              {dashboardSummary.nextDrawDate}
            </p>
          </div>
          <button className="primary-action slim" type="button" onClick={handleSaveProfile}>
            <FaEdit />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </header>

        <section className="dashboard-card-grid">
          <article className="metric-card">
            <span>Selected charity</span>
            <strong>{dashboardSummary.selectedCharity}</strong>
            <p>{form.contribution.contributionPercentage}% contribution</p>
          </article>
          <article className="metric-card">
            <span>Draws entered</span>
            <strong>{dashboardSummary.enteredDraws}</strong>
            <p>Monthly draw-based prize pool access</p>
          </article>
          <article className="metric-card">
            <span>Scores on file</span>
            <strong>{dashboardSummary.activeScoreCount}</strong>
            <p>Stableford entries ready for edits</p>
          </article>
          <article className="metric-card">
            <span>Winnings summary</span>
            <strong>{dashboardSummary.approvedWins}</strong>
            <p>Approved winning records</p>
          </article>
        </section>

        <form onSubmit={handleSaveProfile}>
          {(activeSection === "overview" || activeSection === "scores") && (
            <section className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h3>Score entry and edit interface</h3>
                  <p>Enter your latest Stableford rounds to stay draw ready.</p>
                </div>
                <FaGolfBall className="panel-icon" />
              </div>

              <div className="stacked-grid">
                {form.golfScores.map((score, index) => (
                  <div className="score-editor" key={`${index}-${score.playedAt}`}>
                    <label>
                      Course
                      <input
                        value={score.courseName}
                        onChange={(event) =>
                          handleScoreChange(index, "courseName", event.target.value)
                        }
                        placeholder="Course name"
                      />
                    </label>
                    <label>
                      Stableford score
                      <input
                        type="number"
                        min="0"
                        value={score.score}
                        onChange={(event) =>
                          handleScoreChange(index, "score", event.target.value)
                        }
                        placeholder="36"
                      />
                    </label>
                    <label>
                      Played on
                      <input
                        type="date"
                        value={score.playedAt}
                        onChange={(event) =>
                          handleScoreChange(index, "playedAt", event.target.value)
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(activeSection === "overview" || activeSection === "charity") && (
            <section className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h3>Selected charity and contribution percentage</h3>
                  <p>Choose the charity receiving a portion of your subscription.</p>
                </div>
                <FaHandHoldingHeart className="panel-icon" />
              </div>

              <div className="form-grid two-column">
                <label>
                  Charity recipient
                  <select
                    name="charityId"
                    value={form.contribution.charityId}
                    onChange={handleContributionChange}
                  >
                    <option value="">Choose a charity</option>
                    {charities.map((charity) => (
                      <option key={charity._id} value={charity._id}>
                        {charity.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Contribution percentage
                  <input
                    type="number"
                    min="10"
                    name="contributionPercentage"
                    value={form.contribution.contributionPercentage}
                    onChange={handleContributionChange}
                  />
                </label>
                <label>
                  Independent donation amount
                  <input
                    type="number"
                    min="0"
                    name="independentDonationAmount"
                    value={form.contribution.independentDonationAmount}
                    onChange={handleContributionChange}
                  />
                </label>
                <label>
                  Notes
                  <input
                    name="contributionNotes"
                    value={form.contribution.contributionNotes}
                    onChange={handleContributionChange}
                    placeholder="Any giving preference"
                  />
                </label>
              </div>

              <div className="charity-showcase-grid">
                {charities.slice(0, 3).map((charity) => (
                  <article
                    key={charity._id}
                    className={`charity-card ${
                      form.contribution.charityId === charity._id ? "selected" : ""
                    }`}
                  >
                    <h4>{charity.name}</h4>
                    <p>{charity.shortDescription || charity.description}</p>
                    <span>{charity.category}</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(activeSection === "overview" || activeSection === "participation") && (
            <section className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h3>Participation summary</h3>
                  <p>
                    View draws entered, upcoming draws, winnings, and submit proof if
                    you win.
                  </p>
                </div>
                <FaTrophy className="panel-icon" />
              </div>

              <div className="participation-grid">
                <div className="participation-card">
                  <div className="participation-label">Upcoming draw</div>
                  <strong>{dashboardSummary.nextDrawDate}</strong>
                  <p>
                    Jackpot {drawData?.currentDraw?.jackpotAmount ?? 0} | Participants{" "}
                    {drawData?.metrics?.totalParticipants ?? 0}
                  </p>
                </div>
                <div className="participation-card">
                  <div className="participation-label">Current draw mechanics</div>
                  <strong>{drawData?.currentDraw?.drawType || "5-number-match"}</strong>
                  <p>{drawData?.currentDraw?.logicType || "random"} selection logic</p>
                </div>
                <div className="participation-card">
                  <div className="participation-label">Latest winning numbers</div>
                  <strong>
                    {(drawData?.currentDraw?.numbers || []).join(", ") || "Not published"}
                  </strong>
                  <p>Monthly draw-based prize pools stay synced from admin runs.</p>
                </div>
              </div>

              <div className="winner-proof-list">
                {winnerEntries.length === 0 ? (
                  <div className="empty-state-card">
                    <FaBullseye />
                    <p>No winner records yet. Keep your scores updated for the next draw.</p>
                  </div>
                ) : (
                  winnerEntries.map((entry) => (
                    <article className="winner-card" key={entry._id}>
                      <div className="winner-card-top">
                        <div>
                          <h4>
                            {entry.drawMonth} | {entry.matchCount} number match
                          </h4>
                          <p>
                            Eligibility {entry.eligibilityStatus} | Payout{" "}
                            {entry.payoutStatus}
                          </p>
                        </div>
                        <span className="winner-badge">
                          <FaCheckCircle />
                          {entry.submissionStatus}
                        </span>
                      </div>

                      <div className="winner-meta">
                        Winning numbers: {(entry.winningNumbers || []).join(", ") || "NA"}
                      </div>

                      <div className="form-grid two-column">
                        <label>
                          Proof screenshot URL
                          <input
                            value={proofDraft[entry._id]?.proofScreenshotUrl || ""}
                            onChange={(event) =>
                              setProofDraft((prev) => ({
                                ...prev,
                                [entry._id]: {
                                  ...prev[entry._id],
                                  proofScreenshotUrl: event.target.value,
                                },
                              }))
                            }
                            placeholder="https://..."
                          />
                        </label>
                        <label>
                          Submission notes
                          <input
                            value={proofDraft[entry._id]?.submissionNotes || ""}
                            onChange={(event) =>
                              setProofDraft((prev) => ({
                                ...prev,
                                [entry._id]: {
                                  ...prev[entry._id],
                                  submissionNotes: event.target.value,
                                },
                              }))
                            }
                            placeholder="Short proof note"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() => handleProofSubmit(entry._id)}
                      >
                        Upload winner proof
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {(activeSection === "overview" || activeSection === "profile") && (
            <section className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h3>Manage profile & settings</h3>
                  <p>Update membership, plan details, and personal profile fields.</p>
                </div>
                <FaUserCog className="panel-icon" />
              </div>

              <div className="form-grid two-column">
                <label>
                  Full name
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleFieldChange}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFieldChange}
                    required
                  />
                </label>
                <label>
                  Phone
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleFieldChange}
                  />
                </label>
                <label>
                  Membership level
                  <select
                    name="membershipLevel"
                    value={form.membershipLevel}
                    onChange={handleFieldChange}
                  >
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Elite</option>
                  </select>
                </label>
                <label>
                  Subscription plan
                  <select
                    name="subscriptionPlan"
                    value={form.subscriptionPlan}
                    onChange={handleFieldChange}
                  >
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </label>
                <label>
                  Subscription status
                  <select
                    name="subscriptionStatus"
                    value={form.subscriptionStatus}
                    onChange={handleFieldChange}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label>
                  Renewal date
                  <input
                    type="date"
                    name="subscriptionEndDate"
                    value={form.subscriptionEndDate}
                    onChange={handleFieldChange}
                  />
                </label>
                <label>
                  Handicap
                  <input
                    type="number"
                    min="0"
                    name="handicap"
                    value={form.handicap}
                    onChange={handleFieldChange}
                  />
                </label>
              </div>
            </section>
          )}
        </form>
      </main>
    </div>
  );
}

export default UserDash;
