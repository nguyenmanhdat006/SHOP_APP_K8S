import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});
delete API.defaults.headers.common["Authorization"];
export default API;
