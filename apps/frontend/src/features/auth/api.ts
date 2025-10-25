import { http } from "../../lib/http";

export type Role = "ADMIN" | "USER" | "ASSISTANT";
export type UserDTO = { id: string; name: string; email: string; role: Role; };
export type LoginResponse = { token: string; user: UserDTO; };

export async function loginApi(input: { email: string; password: string; }): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>("/auth/login", input);
    return data;
}