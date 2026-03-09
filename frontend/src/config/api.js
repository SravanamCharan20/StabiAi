const LOCAL_API_URL = "http://localhost:9000";
const PRODUCTION_API_URL = "https://stabiai.onrender.com";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD ? PRODUCTION_API_URL : LOCAL_API_URL);
