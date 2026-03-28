import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaEdit,
  FaGlobe,
  FaHeart,
  FaImage,
  FaPlus,
  FaSave,
  FaSearch,
  FaStar,
  FaTrash,
} from "react-icons/fa";
import API from "../../../utils/api";
import Adsidenav from "./Adsidenav";

const pageHeaderStyle = {
  minHeight: "9vh",
  background: "linear-gradient(90deg, #6b8f1a, #305f1f)",
  color: "white",
};

const emptyForm = {
  _id: "",
  name: "",
  slug: "",
  category: "Community",
  shortDescription: "",
  description: "",
  impactSummary: "",
  website: "",
  contactEmail: "",
  location: "",
  status: "active",
  isFeatured: false,
  tags: "",
  images: "",
  media: "",
  upcomingEvents: [
    { title: "", eventDate: "", location: "", description: "" },
    { title: "", eventDate: "", location: "", description: "" },
  ],
};

function normalizeForm(charity) {
  const events = [...(charity.upcomingEvents || [])];
  while (events.length < 2) {
    events.push({ title: "", eventDate: "", location: "", description: "" });
  }

  return {
    _id: charity._id || "",
    name: charity.name || "",
    slug: charity.slug || "",
    category: charity.category || "Community",
    shortDescription: charity.shortDescription || "",
    description: charity.description || "",
    impactSummary: charity.impactSummary || "",
    website: charity.website || "",
    contactEmail: charity.contactEmail || "",
    location: charity.location || "",
    status: charity.status || "active",
    isFeatured: Boolean(charity.isFeatured),
    tags: (charity.tags || []).join(", "),
    images: (charity.images || []).join(", "),
    media: (charity.media || []).join(", "),
    upcomingEvents: events.slice(0, 2).map((event) => ({
      title: event.title || "",
      eventDate: event.eventDate
        ? new Date(event.eventDate).toISOString().split("T")[0]
        : "",
      location: event.location || "",
      description: event.description || "",
    })),
  };
}

function formatDate(value) {
  if (!value) {
    return "Date TBD";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CharityManagement() {
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  async function fetchCharities(activeId = selectedId) {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (categoryFilter) {
        params.set("category", categoryFilter);
      }

      const response = await API.get(`/charities?${params.toString()}`);
      const charityList = response.data?.value || [];

      setCharities(charityList);
      setCategories(response.data?.meta?.categories || []);

      if (charityList.length > 0) {
        const chosenId = activeId || charityList[0]._id;
        const matched =
          charityList.find((charity) => charity._id === chosenId) || charityList[0];
        setSelectedId(matched._id);
        setForm(normalizeForm(matched));
      } else {
        setSelectedId("");
        setForm(emptyForm);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to load charities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    if (isAuthenticated !== "true") {
      navigate("/admin");
      return;
    }

    fetchCharities();
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCharities();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  const summary = useMemo(() => {
    const activeCount = charities.filter((charity) => charity.status === "active").length;
    const featured = charities.find((charity) => charity.isFeatured);
    const upcomingEvents = charities.reduce(
      (sum, charity) => sum + (charity.upcomingEvents || []).length,
      0
    );

    return {
      total: charities.length,
      activeCount,
      featuredName: featured?.name || "Not selected",
      upcomingEvents,
    };
  }, [charities]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleEventChange(index, field, value) {
    setForm((prev) => {
      const upcomingEvents = [...prev.upcomingEvents];
      upcomingEvents[index] = {
        ...upcomingEvents[index],
        [field]: value,
      };

      return { ...prev, upcomingEvents };
    });
  }

  function handleSelectCharity(charity) {
    setSelectedId(charity._id);
    setForm(normalizeForm(charity));
  }

  function handleNewCharity() {
    setSelectedId("");
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      upcomingEvents: form.upcomingEvents.filter(
        (item) => item.title || item.eventDate || item.location || item.description
      ),
    };

    try {
      if (selectedId) {
        await API.put(`/charities/${selectedId}`, payload);
        toast.success("Charity updated successfully");
      } else {
        await API.post("/charities", payload);
        toast.success("Charity created successfully");
      }

      await fetchCharities(selectedId || "");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save charity");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this charity profile?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      await API.delete(`/charities/${id}`);
      toast.success("Charity deleted successfully");
      await fetchCharities();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to delete charity");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7ef", overflowX: "hidden" }}>
      <div className="row g-0 align-items-center px-4 mx-0" style={pageHeaderStyle}>
        <div className="col-md-8">
          <h2 className="mb-1">Charity Management</h2>
          <p className="mb-0 opacity-75">
            Add, edit, delete charity profiles and manage spotlight content, media,
            and event listings
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
                  <p className="text-muted mb-2">Directory Profiles</p>
                  <h3 className="mb-0">{summary.total}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Active Charities</p>
                  <h3 className="mb-0">{summary.activeCount}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Featured Spotlight</p>
                  <h6 className="mb-0">{summary.featuredName}</h6>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">Upcoming Events</p>
                  <h3 className="mb-0">{summary.upcomingEvents}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 className="mb-1">Charity Directory</h4>
                      <p className="text-muted mb-0">Search and filter profiles</p>
                    </div>
                    <button type="button" className="btn btn-success" onClick={handleNewCharity}>
                      <FaPlus className="me-2" />
                      New
                    </button>
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
                          placeholder="Search name, cause, or tag"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Category Filter</label>
                      <select
                        className="form-select"
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                      >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <p className="text-muted mb-0">Loading charity profiles...</p>
                  ) : (
                    <div className="d-grid gap-3">
                      {charities.map((charity) => (
                        <div
                          key={charity._id}
                          className={`border rounded-4 p-3 ${
                            selectedId === charity._id ? "bg-success-subtle border-success" : "bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            className="btn text-start w-100 p-0 border-0 bg-transparent"
                            onClick={() => handleSelectCharity(charity)}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-3">
                              <div>
                                <div className="fw-bold">{charity.name}</div>
                                <div className="small text-muted">{charity.category}</div>
                                <div className="small text-muted mt-1">
                                  {charity.shortDescription || "No short description yet"}
                                </div>
                              </div>
                              {charity.isFeatured && <FaStar className="text-warning mt-1" />}
                            </div>
                          </button>

                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <span className="badge text-bg-light border text-capitalize">
                              {charity.status}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(charity._id)}
                              disabled={deletingId === charity._id}
                            >
                              <FaTrash className="me-1" />
                              {deletingId === charity._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))}

                      {!charities.length && (
                        <div className="rounded-4 p-4 bg-light text-muted">
                          No charities found for the current search/filter.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-xl-8">
              <form className="card border-0 shadow-sm" onSubmit={handleSubmit}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h4 className="mb-1">
                        {selectedId ? "Edit Charity Profile" : "Create Charity Profile"}
                      </h4>
                      <p className="text-muted mb-0">
                        Manage charity content, media links, and public-facing event data
                      </p>
                    </div>
                    <span className="badge bg-light text-dark border">
                      <FaEdit className="me-2" />
                      {selectedId ? "Editing" : "New Charity"}
                    </span>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Charity Name</label>
                      <input
                        className="form-control"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Slug</label>
                      <input
                        className="form-control"
                        name="slug"
                        value={form.slug}
                        onChange={handleChange}
                        placeholder="auto-generated if left blank"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Category</label>
                      <input
                        className="form-control"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Location</label>
                      <input
                        className="form-control"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Short Description</label>
                      <input
                        className="form-control"
                        name="shortDescription"
                        value={form.shortDescription}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <div className="form-check form-switch border rounded-4 px-4 py-3 w-100">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isFeatured"
                          name="isFeatured"
                          checked={form.isFeatured}
                          onChange={handleChange}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="isFeatured">
                          Featured spotlight charity
                        </label>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Full Description</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Impact Summary</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        name="impactSummary"
                        value={form.impactSummary}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">
                        <FaGlobe className="me-2 text-success" />
                        Website
                      </label>
                      <input
                        className="form-control"
                        name="website"
                        value={form.website}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Email</label>
                      <input
                        className="form-control"
                        type="email"
                        name="contactEmail"
                        value={form.contactEmail}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Tags</label>
                      <input
                        className="form-control"
                        name="tags"
                        value={form.tags}
                        onChange={handleChange}
                        placeholder="education, health, youth"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">
                        <FaImage className="me-2 text-success" />
                        Image URLs
                      </label>
                      <input
                        className="form-control"
                        name="images"
                        value={form.images}
                        onChange={handleChange}
                        placeholder="Comma separated image URLs"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Media URLs</label>
                      <input
                        className="form-control"
                        name="media"
                        value={form.media}
                        onChange={handleChange}
                        placeholder="Videos, galleries, press links"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <FaCalendarAlt className="text-success" />
                      <h5 className="mb-0">Upcoming Events</h5>
                    </div>

                    <div className="row g-3">
                      {form.upcomingEvents.map((event, index) => (
                        <div className="col-12" key={index}>
                          <div className="border rounded-4 p-3 bg-light">
                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label">Event Title</label>
                                <input
                                  className="form-control"
                                  value={event.title}
                                  onChange={(e) =>
                                    handleEventChange(index, "title", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label">Date</label>
                                <input
                                  className="form-control"
                                  type="date"
                                  value={event.eventDate}
                                  onChange={(e) =>
                                    handleEventChange(index, "eventDate", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-5">
                                <label className="form-label">Location</label>
                                <input
                                  className="form-control"
                                  value={event.location}
                                  onChange={(e) =>
                                    handleEventChange(index, "location", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-12">
                                <label className="form-label">Description</label>
                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={event.description}
                                  onChange={(e) =>
                                    handleEventChange(index, "description", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-4 p-3 mb-4" style={{ background: "#f1f8e8" }}>
                    <div className="d-flex align-items-start gap-3">
                      <FaHeart className="mt-1 text-danger" />
                      <div>
                        <div className="fw-semibold mb-1">Directory profile preview</div>
                        <div className="small text-muted mb-2">
                          Public profile will show description, image/media links, and events like golf days.
                        </div>
                        <div className="fw-semibold">{form.name || "Charity name"}</div>
                        <div className="text-muted small">{form.category || "Category"}</div>
                        <div className="small mt-2">
                          Next event:{" "}
                          {form.upcomingEvents[0]?.title
                            ? `${form.upcomingEvents[0].title} - ${formatDate(
                                form.upcomingEvents[0].eventDate
                              )}`
                            : "No event added yet"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button className="btn btn-success px-4" disabled={saving}>
                      <FaSave className="me-2" />
                      {saving ? "Saving..." : "Save Charity"}
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

export default CharityManagement;
