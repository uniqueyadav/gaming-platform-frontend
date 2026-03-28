import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaChartLine,
  FaGolfBall,
  FaHandHoldingHeart,
  FaUsers,
} from "react-icons/fa";
import API from "../../utils/api";
import { getUserSession, setUserSession } from "../utils/userAuth";

const initialSignupForm = {
  fullName: "",
  email: "",
  phone: "",
  membershipLevel: "Standard",
  handicap: 18,
  subscriptionPlan: "Monthly",
  subscriptionStatus: "active",
  subscriptionEndDate: "",
  contribution: {
    charityId: "",
    contributionPercentage: 10,
    independentDonationAmount: 0,
    contributionNotes: "",
  },
  golfScores: [{ courseName: "", score: "", playedAt: "" }],
};

const highlightCards = [
  {
    title: "Platform concept",
    text: "Explore listed charities, understand draw mechanics, and subscribe with a monthly or yearly plan.",
    icon: <FaHandHoldingHeart />,
  },
  {
    title: "Golf-first participation",
    text: "Enter Stableford scores, keep your latest rounds updated, and stay eligible for draw-based prize pools.",
    icon: <FaGolfBall />,
  },
  {
    title: "Member journey",
    text: "Support a charity, manage profile settings, track entries, and upload winner proof from one dashboard.",
    icon: <FaChartLine />,
  },
];

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [charities, setCharities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getUserSession()?._id) {
      navigate("/userdashboard", { replace: true });
      return;
    }

    // loadData();
  }, [navigate]);

  // async function loadData() {
  //   try {
  //     setLoading(true);
  //     const [charityResponse, usersResponse] = await Promise.all([
  //       API.get("/charities?status=active"),
  //       API.get("/users"),
  //     ]);

  //     setCharities(charityResponse.data?.value || []);
  //     setUsers(usersResponse.data?.value || []);
  //   } catch (error) {
  //     toast.error(error.response?.data?.msg || "Unable to load platform data");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  const platformSummary = useMemo(() => {
    const totalCharities = charities.length;
    const totalMembers = users.length;
    const activeSubscribers = users.filter(
      (user) => user.subscriptionStatus === "active"
    ).length;

    return { totalCharities, totalMembers, activeSubscribers };
  }, [charities, users]);

  function handleSignupChange(event) {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleContributionChange(event) {
    const { name, value } = event.target;
    setSignupForm((prev) => ({
      ...prev,
      contribution: {
        ...prev.contribution,
        [name]: value,
      },
    }));
  }

  function handleScoreChange(index, field, value) {
    setSignupForm((prev) => {
      const golfScores = [...prev.golfScores];
      golfScores[index] = { ...golfScores[index], [field]: value };
      return { ...prev, golfScores };
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await API.get("/users");
      const matchingUser = (response.data?.value || []).find(
        (user) => user.email?.toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (!matchingUser) {
        toast.error("Member not found. Please create your subscription profile.");
        setMode("signup");
        setSignupForm((prev) => ({
          ...prev,
          email: loginEmail.trim().toLowerCase(),
        }));
        return;
      }

      setUserSession(matchingUser);
      toast.success("Login successful");
      navigate("/userdashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.msg || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const renewalDate = new Date();
      renewalDate.setMonth(
        renewalDate.getMonth() +
          (signupForm.subscriptionPlan === "Yearly" ? 12 : 1)
      );

      const payload = {
        ...signupForm,
        email: signupForm.email.trim().toLowerCase(),
        handicap: Number(signupForm.handicap) || 0,
        subscriptionStatus: "active",
        subscriptionEndDate: renewalDate.toISOString(),
        contribution: {
          ...signupForm.contribution,
          contributionPercentage: Math.max(
            10,
            Number(signupForm.contribution.contributionPercentage) || 10
          ),
          independentDonationAmount: Math.max(
            0,
            Number(signupForm.contribution.independentDonationAmount) || 0
          ),
        },
        golfScores: signupForm.golfScores.filter(
          (score) => score.courseName || score.score || score.playedAt
        ),
      };

      const response = await API.post("/users", payload);
      const createdUser = response.data?.value;

      if (!createdUser?._id) {
        throw new Error("Invalid user response");
      }

      setUserSession(createdUser);
      toast.success("Subscription activated successfully");
      navigate("/userdashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.msg || "Unable to create profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="member-auth-page">
      <section className="member-auth-shell">
        <div className="member-auth-hero">
          <div className="eyebrow">Golf Charity Prize Platform</div>
          <h1>Play your best round. Back a charity. Enter monthly prize draws.</h1>
          <p>
            View the platform concept, subscribe to the service, choose your charity,
            and keep your Stableford scores ready for the next draw cycle.
          </p>

          <div className="summary-grid">
            <div className="summary-card">
              <span>Active charities</span>
              <strong>{loading ? "--" : platformSummary.totalCharities}</strong>
            </div>
            <div className="summary-card">
              <span>Members onboard</span>
              <strong>{loading ? "--" : platformSummary.totalMembers}</strong>
            </div>
            <div className="summary-card">
              <span>Live subscriptions</span>
              <strong>{loading ? "--" : platformSummary.activeSubscribers}</strong>
            </div>
          </div>

          <div className="highlight-list">
            {highlightCards.map((item) => (
              <article className="highlight-card" key={item.title}>
                <div className="highlight-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="member-auth-panel">
          <div className="auth-switch">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Member Login
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              Join & Subscribe
            </button>
          </div>

          {mode === "login" ? (
            <form className="member-form" onSubmit={handleLogin}>
              <div>
                <h2>Welcome back</h2>
                <p>
                  Existing members can access their subscription dashboard using
                  the registered email.
                </p>
              </div>

              <label>
                Registered email
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="member@example.com"
                  required
                />
              </label>
              <div className="draw-mechanics-card">
                <div className="draw-mechanics-row">
                  <FaCalendarAlt />
                  <span>Monthly draw-based prize pools</span>
                </div>
                <div className="draw-mechanics-row">
                  <FaGolfBall />
                  <span>Stableford score entry and editing</span>
                </div>
                <div className="draw-mechanics-row">
                  <FaUsers />
                  <span>Charity contribution linked to your subscription</span>
                </div>
              </div>

              <button className="primary-action" type="submit" disabled={submitting}>
                {submitting ? "Checking member..." : "Continue to UserDash"}
                <FaArrowRight />
              </button>
            </form>
          ) : (
            <form className="member-form" onSubmit={handleSignup}>
              <div>
                <h2>Create your member profile</h2>
                <p>
                  Subscribe monthly or yearly, select a charity, and add your latest
                  Stableford round before heading into the dashboard.
                </p>
              </div>

              <div className="form-grid two-column">
                <label>
                  Full name
                  <input
                    name="fullName"
                    value={signupForm.fullName}
                    onChange={handleSignupChange}
                    placeholder="Rahul Sharma"
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={signupForm.email}
                    onChange={handleSignupChange}
                    placeholder="member@example.com"
                    required
                  />
                </label>
                <label>
                  Phone
                  <input
                    name="phone"
                    value={signupForm.phone}
                    onChange={handleSignupChange}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label>
                  Membership
                  <select
                    name="membershipLevel"
                    value={signupForm.membershipLevel}
                    onChange={handleSignupChange}
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
                    value={signupForm.subscriptionPlan}
                    onChange={handleSignupChange}
                  >
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </label>
                <label>
                  Handicap
                  <input
                    type="number"
                    min="0"
                    name="handicap"
                    value={signupForm.handicap}
                    onChange={handleSignupChange}
                  />
                </label>
              </div>

              <div className="form-section-title">Select charity recipient</div>
              <div className="form-grid two-column">
                <label>
                  Charity
                  <select
                    name="charityId"
                    value={signupForm.contribution.charityId}
                    onChange={handleContributionChange}
                  >
                    <option value="">Choose an active charity</option>
                    <option value="">Fairway Futures</option>
                    <option value="">Greens for Good</option>
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
                    value={signupForm.contribution.contributionPercentage}
                    onChange={handleContributionChange}
                  />
                </label>
                <label>
                  Independent donation
                  <input
                    type="number"
                    min="0"
                    name="independentDonationAmount"
                    value={signupForm.contribution.independentDonationAmount}
                    onChange={handleContributionChange}
                  />
                </label>
                <label>
                  Contribution note
                  <input
                    name="contributionNotes"
                    value={signupForm.contribution.contributionNotes}
                    onChange={handleContributionChange}
                    placeholder="Optional message or preference"
                  />
                </label>
              </div>

              <div className="form-section-title">Latest Stableford score</div>
              <div className="form-grid three-column">
                <label>
                  Course name
                  <input
                    value={signupForm.golfScores[0].courseName}
                    onChange={(event) =>
                      handleScoreChange(0, "courseName", event.target.value)
                    }
                    placeholder="Royal County Club"
                  />
                </label>
                <label>
                  Score
                  <input
                    type="number"
                    min="0"
                    value={signupForm.golfScores[0].score}
                    onChange={(event) =>
                      handleScoreChange(0, "score", event.target.value)
                    }
                    placeholder="36"
                  />
                </label>
                <label>
                  Played on
                  <input
                    type="date"
                    value={signupForm.golfScores[0].playedAt}
                    onChange={(event) =>
                      handleScoreChange(0, "playedAt", event.target.value)
                    }
                  />
                </label>
              </div>

              <button className="primary-action" type="submit" disabled={submitting}>
                {submitting ? "Creating profile..." : "Subscribe & Open UserDash"}
                <FaArrowRight />
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default Login;
