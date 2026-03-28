import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://gaming-platform-backend-wp7e.onrender.com/api",
});

export default API;