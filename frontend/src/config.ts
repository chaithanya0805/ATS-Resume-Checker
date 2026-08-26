const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not configured! Please configure it in your environment variables.");
}

export { API_BASE_URL };

