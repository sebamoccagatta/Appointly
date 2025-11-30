import { apiFetch } from "./apiClient";

export type CustomerDTO = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export async function fetchCustomers(params?: { q?: string }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);

    const qs = search.toString();
    const url = qs ? `/customers?${qs}` : "/customers";

    return apiFetch<CustomerDTO[]>(url);
}

export async function createCustomer(input: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
}) {
    return apiFetch<CustomerDTO>("/customers", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function updateCustomer(input: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
}) {
    const { id, ...data } = input;

    return apiFetch<CustomerDTO>(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}
