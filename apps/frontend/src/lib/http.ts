import axios from "axios";
import { ENV } from "./env";

const http = axios.create({
    baseURL: ENV.API_URL,
    withCredentials: false,
});

http.interceptors.request.use((config) => {
    const raw = localStorage.getItem("auth");
    if (raw) {
        const parsed = JSON.parse(raw) as { token?: string };
        if (parsed.token) config.headers.Authorization = `Bearer ${parsed.token}`;
    }
    return config;
});

http.interceptors.response.use(
    (res) => res,
    (err) => {
        return Promise.reject(err);
    }
)

export { http };