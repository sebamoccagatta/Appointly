import { useQuery } from "@tanstack/react-query";
import {
    fetchAvailability,
    type AvailabilityDTO,
} from "../../../services/api/apiAvailability";

export function useAvailability(date: string | null, offeringId: string | null) {
    return useQuery<AvailabilityDTO>({
        queryKey: ["availability", { date, offeringId }],
        queryFn: () => fetchAvailability({ date: date!, offeringId: offeringId! }),
        enabled: Boolean(date && offeringId),
    });
}