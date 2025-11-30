import { http } from "../../lib/http";

export type Role = "ADMIN" | "USER" | "ASSISTANT";
export type User = { id: string; name: string; email: string; role: Role };
export type LoginResponse = {
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number;
};
export type RegisterResponse = { id: string; name: string; email: string; role: "USER" | "ADMIN" | "ASSISTANT" };

export async function loginApi(input: { email: string; password: string; }): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>("/auth/login", input);
    return data;
}

export async function registerApi(input: { name: string; email: string; password: string }): Promise<RegisterResponse> {
    const { data } = await http.post<RegisterResponse>("/auth/register", input);
    return data;
}

export async function getMeApi(): Promise<User> {
    const { data } = await http.get<User>("/auth/me");
    return data;
}