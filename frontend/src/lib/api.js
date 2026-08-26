import axios from "axios";

// Create an instance with dynamic baseURL (supports local dev and Docker Nginx proxy)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export default api;