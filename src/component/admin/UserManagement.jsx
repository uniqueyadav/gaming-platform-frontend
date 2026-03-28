import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaGolfBall,
  FaPlus,
  FaSave,
  FaUserCircle,
} from "react-icons/fa";
import API from "../../../utils/api.js";
import Adsidenav from "./Adsidenav";

const pageHeaderStyle = {
  minHeight: "9vh",
  background: "linear-gradient(90deg, #0f5132, #1b7f5a)",
  color: "white",
};

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

function normalizeForm(user) {
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

function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [charities, setCharities] = useState([]);
  const [loadError, setLoadError] = useState("");

  async function fetchUsers() {
    try {
      setLoading(true);
      setLoadError("");
      const response = await API.get("/users");
      const userList = response.data?.value || [];
      setUsers(userList);

      if (userList.length > 0) {
        const activeUserId = selectedId || userList[0]._id;
        const matchedUser =
          userList.find((user) => user._id === activeUserId) || userList[0];
        setSelectedId(matchedUser._id);
        setForm(normalizeForm(matchedUser));
      } else {
        setSelectedId("");
        setForm(emptyForm);
      }
    } catch (error) {
      const message = error.response?.data?.msg || "Failed to load users";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCharities() {
    try {
      const response = await API.get("/charities?status=active");
      setCharities(response.data?.value || []);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to load charities");
    }
  }

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    if (isAuthenticated !== "true") {
      navigate("/admin");
      return;
    }

    fetchUsers();
    fetchCharities();
  }, [navigate]);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const activeSubscriptions = users.filter(
      (user) => user.subscriptionStatus === "active"
    ).length;
    const allScores = users.flatMap((user) =>
      (user.golfScores || []).map((score) => Number(score.score) || 0)
    );
    const averageScore = allScores.length
      ? Math.round(
          allScores.reduce((sum, score) => sum + score, 0) / allScores.length
        )
      : 0;

    return { totalUsers, activeSubscriptions, averageScore };
  }, [users]);

  function handleSelectUser(user) {
    setSelectedId(user._id);
    setForm(normalizeForm(user));
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleScoreChange(index, field, value) {
    setForm((prev) => {
      const golfScores = [...prev.golfScores];
      golfScores[index] = {
        ...golfScores[index],
        [field]: value,
      };

      return { ...prev, golfScores };
    });
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

  function handleNewUser() {
    setSelectedId("");
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
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

      if (selectedId) {
        await API.put(`/users/${selectedId}`, payload);
        toast.success("User updated successfully");
      } else {
        await API.post("/users", payload);
        toast.success("User created successfully");
      }

      await fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eef4fb", overflowX: "hidden" }}>
      <div
        className="row g-0 align-items-center px-4 mx-0"
        style={pageHeaderStyle}
      >
        <div className="col-md-8">
          <h2 className="mb-1">User Management</h2>
          <p className="mb-0 opacity-75">
            View and edit user profiles, update golf scores, and manage subscriptions
          </p>
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

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Total Users</p>
                  <h3 className="mb-0">{summary.totalUsers}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Active Subscriptions</p>
                  <h3 className="mb-0">{summary.activeSubscriptions}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Average Golf Score</p>
                  <h3 className="mb-0">{summary.averageScore}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 className="mb-1">Users</h4>
                      <p className="text-muted mb-0">Select a profile to edit</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleNewUser}
                    >
                      <FaPlus className="me-2" />
                      New
                    </button>
                  </div>

                  {loading ? (
                    <p className="text-muted mb-0">Loading users...</p>
                  ) : (
                    <div className="d-grid gap-3">
                      {users.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className={`btn text-start border rounded-4 p-3 ${
                            selectedId === user._id
                              ? "btn-primary"
                              : "btn-light"
                          }`}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <FaUserCircle className="fs-3 mt-1" />
                            <div>
                              <div className="fw-bold">{user.fullName}</div>
                              <div className="small">{user.email}</div>
                              <div className="small">
                                {user.subscriptionPlan} | {user.subscriptionStatus}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <form className="card border-0 shadow-sm" onSubmit={handleSubmit}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h4 className="mb-1">
                        {selectedId ? "Edit User Profile" : "Create User Profile"}
                      </h4>
                      <p className="text-muted mb-0">
                        Update member details, golf scores, and subscription info
                      </p>
                    </div>
                    <span className="badge bg-info-subtle text-dark border">
                      <FaEdit className="me-2" />
                      {selectedId ? "Editing" : "New User"}
                    </span>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-control"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        className="form-control"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        className="form-control"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Membership</label>
                      <select
                        className="form-select"
                        name="membershipLevel"
                        value={form.membershipLevel}
                        onChange={handleChange}
                      >
                        <option>Standard</option>
                        <option>Premium</option>
                        <option>Elite</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Handicap</label>
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        name="handicap"
                        value={form.handicap}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <FaGolfBall className="text-success" />
                      <h5 className="mb-0">Edit Golf Scores</h5>
                    </div>

                    <div className="row g-3">
                      {form.golfScores.map((score, index) => (
                        <div className="col-12" key={index}>
                          <div className="border rounded-4 p-3 bg-light">
                            <div className="row g-3">
                              <div className="col-md-5">
                                <label className="form-label">
                                  Course Name
                                </label>
                                <input
                                  className="form-control"
                                  value={score.courseName}
                                  onChange={(event) =>
                                    handleScoreChange(
                                      index,
                                      "courseName",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label">Score</label>
                                <input
                                  className="form-control"
                                  type="number"
                                  min="0"
                                  value={score.score}
                                  onChange={(event) =>
                                    handleScoreChange(
                                      index,
                                      "score",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Played On</label>
                                <input
                                  className="form-control"
                                  type="date"
                                  value={score.playedAt}
                                  onChange={(event) =>
                                    handleScoreChange(
                                      index,
                                      "playedAt",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="mb-3">Manage Subscriptions</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Plan</label>
                        <select
                          className="form-select"
                          name="subscriptionPlan"
                          value={form.subscriptionPlan}
                          onChange={handleChange}
                        >
                          <option>Monthly</option>
                          <option>Quarterly</option>
                          <option>Annual</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          name="subscriptionStatus"
                          value={form.subscriptionStatus}
                          onChange={handleChange}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Renewal Date</label>
                        <input
                          className="form-control"
                          type="date"
                          name="subscriptionEndDate"
                          value={form.subscriptionEndDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="mb-3">Charity Contribution Model</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Selected Charity</label>
                        <select
                          className="form-select"
                          name="charityId"
                          value={form.contribution.charityId}
                          onChange={handleContributionChange}
                        >
                          <option value="">Select a charity</option>
                          {charities.map((charity) => (
                            <option key={charity._id} value={charity._id}>
                              {charity.name}
                            </option>
                          ))}
                        </select>
                        <div className="form-text">
                          User selects a charity at signup or profile creation.
                        </div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Contribution %</label>
                        <input
                          className="form-control"
                          type="number"
                          min="10"
                          name="contributionPercentage"
                          value={form.contribution.contributionPercentage}
                          onChange={handleContributionChange}
                        />
                        <div className="form-text">Minimum 10% of subscription fee.</div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Independent Donation</label>
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          name="independentDonationAmount"
                          value={form.contribution.independentDonationAmount}
                          onChange={handleContributionChange}
                        />
                        <div className="form-text">Separate from gameplay.</div>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Contribution Notes</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          name="contributionNotes"
                          value={form.contribution.contributionNotes}
                          onChange={handleContributionChange}
                          placeholder="Optional note for voluntary increase or one-time donation"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button className="btn btn-success px-4" disabled={saving}>
                      <FaSave className="me-2" />
                      {saving ? "Saving..." : "Save User"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
