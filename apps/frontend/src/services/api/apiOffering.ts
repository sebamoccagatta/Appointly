import { apiFetch } from "./apiClient";

export type OfferingStatus = "ACTIVE" | "INACTIVE";

export type Offering = {
    id: string;
    name: string;
    durationMinutes: number;
    status: OfferingStatus;
};

export type OfferingsListResponse = {
    items: Offering[];
    total: number;
    page: number;
    pageSize: number;
};

export async function fetchOfferings() {
    return apiFetch<Offering[]>("/offerings");
}

export async function createOffering(data: {
    name: string;
    durationMinutes: number;
}) {
    return apiFetch<Offering>("/offerings", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateOffering(
    id: string,
    data: {
        name?: string;
        durationMinutes?: number;
        status?: OfferingStatus;
    }
) {
    return apiFetch<Offering>(`/offerings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}
