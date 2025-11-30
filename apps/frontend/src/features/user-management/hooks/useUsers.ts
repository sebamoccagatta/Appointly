import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchUsers,
    createUser,
    updateUser,
    updateUserStatus,
    resetUserPassword,
    type UserListItem,
    type UserRole,
    type UserStatus,
} from "../../../services/api/apiUser";

export function useUsersList(params: {
    page: number;
    pageSize: number;
    q?: string;
    role?: UserRole | "ALL";
}) {
    return useQuery({
        queryKey: ["users", params],
        queryFn: () => fetchUsers(params),
    });
}

export function useUserMutations() {
    const qc = useQueryClient();

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["users"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateUser,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["users"] });
        },
    });

    const statusMutation = useMutation({
        mutationFn: updateUserStatus,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["users"] });
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: (id: string) => resetUserPassword(id),
    });

    return {
        createMutation,
        updateMutation,
        statusMutation,
        resetPasswordMutation,
    };
}

export type { UserListItem, UserRole, UserStatus };
