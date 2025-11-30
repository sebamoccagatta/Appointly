import { apiFetch } from "./apiClient";

export type SlotDTO = {
    start: string; // "HH:MM"
    end: string;   // "HH:MM"
};

export type AvailabilityDTO = {
    date: string;         // "YYYY-MM-DD"
    offeringId: string;
    timezone: string;
    bufferMinutes: number;
    slots: SlotDTO[];
};

export async function fetchAvailability(params: {
    date: string;       // "YYYY-MM-DD"
    offeringId: string;
}) {
    const search = new URLSearchParams();
    search.set("date", params.date);
    search.set("offeringId", params.offeringId);

    return apiFetch<AvailabilityDTO>(`/availability?${search.toString()}`);
}