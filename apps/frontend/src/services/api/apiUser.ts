import { apiFetch } from "./apiClient";

export type UserRole = "ADMIN" | "ASSISTANT" | "USER";
export type UserStatus = "ACTIVE" | "BLOCKED";

export type UserListItem = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
};

export type UsersListResponse = {
    items: UserListItem[];
    total: number;
    page: number;
    pageSize: number;
};

export async function fetchUsers(params: {
    page: number;
    pageSize: number;
    q?: string;
    role?: UserRole | "ALL";
}) {
    const search = new URLSearchParams();
    search.set("page", String(params.page));
    search.set("pageSize", String(params.pageSize));
    if (params.q) search.set("q", params.q);
    if (params.role && params.role !== "ALL") search.set("role", params.role);

    const qs = search.toString();
    return apiFetch<UsersListResponse>(`/users?${qs}`);
}

export async function createUser(input: {
    name: string;
    email: string;
    role?: UserRole;
}) {
    return apiFetch<{ user: UserListItem; initialPassword: string }>("/users", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function updateUser(input: {
    id: string;
    name?: string;
    email?: string;
    role?: UserRole;
}) {
    return apiFetch<UserListItem>(`/users/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
            name: input.name,
            email: input.email,
            role: input.role,
        }),
    });
}

export async function updateUserStatus(input: {
    id: string;
    status: UserStatus;
}) {
    return apiFetch<{ ok: boolean }>(`/users/${input.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: input.status }),
    });
}

export async function resetUserPassword(id: string) {
    return apiFetch<{ ok: boolean; message: string }>(
        `/users/${id}/reset-password`,
        {
            method: "POST",
        }
    );
}
