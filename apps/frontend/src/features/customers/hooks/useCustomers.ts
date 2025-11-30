import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchCustomers,
    createCustomer,
    updateCustomer,
    type CustomerDTO,
} from "../../../services/api/apiCustomers";

const CUSTOMERS_KEY = ["customers"] as const;

export function useCustomersList(q?: string) {
    return useQuery<CustomerDTO[]>({
        queryKey: q ? [...CUSTOMERS_KEY, { q }] : CUSTOMERS_KEY,
        queryFn: () => fetchCustomers(q ? { q } : undefined),
    });
}

export function useCreateCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CUSTOMERS_KEY });
        },
    });
}

export function useUpdateCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateCustomer,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CUSTOMERS_KEY });
        },
    });
}
