import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchOfferings,
    createOffering,
    updateOffering,
    type Offering,
    type OfferingStatus,
} from "../../../services/api/apiOffering";

const OFFERINGS_KEY = ["offerings"] as const;

export function useOfferingsList() {
    return useQuery({
        queryKey: OFFERINGS_KEY,
        queryFn: fetchOfferings,
    });
}

export function useCreateOffering() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createOffering,
        onSuccess: () => qc.invalidateQueries({ queryKey: OFFERINGS_KEY }),
    });
}

export function useUpdateOffering(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Offering>) => updateOffering(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: OFFERINGS_KEY }),
    });
}

export function useToggleOfferingStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: { id: string; status: OfferingStatus }) => {
            const nextStatus: OfferingStatus =
                input.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

            return updateOffering(input.id, { status: nextStatus });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: OFFERINGS_KEY }),
    });
}
