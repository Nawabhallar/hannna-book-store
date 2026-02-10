const getBaseUrl = () => {
    // Read backend URL from Vite environment variable VITE_BACKEND_URL.
    // If not set, fall back to localhost:5000 for local development.
    return import.meta.env.VITE_BACKEND_URL || "http://159.223.34.53:5000";
}

export default getBaseUrl;