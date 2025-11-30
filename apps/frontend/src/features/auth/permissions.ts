export const can = {
    manageUsers: (role: string) => role === "ADMIN",

    editUserWithoutRole: (role: string) =>
        role === "ADMIN" || role === "ASSISTANT",

    editOwnData: () => true,

    viewDashboardStats: (role: string) =>
        role === "ADMIN" || role === "ASSISTANT",

    viewAllAppointments: (role: string) =>
        role === "ADMIN" || role === "ASSISTANT",

    viewOwnAppointments: () => true,
};
