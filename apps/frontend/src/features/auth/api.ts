import { http } from "../../lib/http";

export type Role = "ADMIN" | "USER" | "ASSISTANT";
export type UserDTO = { id: string; name: string; email: string; role: Role; };
export type LoginResponse = { token: string; user: UserDTO; };
export type RegisterResponse = { id: string; name: string; email: string; role: "USER" | "ADMIN" | "ASSISTANT" };

export async function loginApi(input: { email: string; password: string; }): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>("/auth/login", input);
    return data;
}

export async function registerApi(input: { name: string; email: string; password: string }): Promise<RegisterResponse> {
    const { data } = await http.post<RegisterResponse>("/auth/register", input);
    return data;
}