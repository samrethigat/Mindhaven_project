import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login/patient";
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: any, fallback = "Something went wrong") {
  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error" || !error?.response) {
    return "Backend connection error. Please ensure your backend server is deployed and VITE_API_URL is configured.";
  }
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
}
