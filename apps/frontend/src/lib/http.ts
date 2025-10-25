import axios from "axios";
import { ENV } from "./env";

const http = axios.create({
    baseURL: ENV.API_URL,
    withCredentials: false,
});

http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
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