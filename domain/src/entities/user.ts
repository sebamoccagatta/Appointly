export const UserRole = {
    ADMIN: "ADMIN",
    STAFF: "STAFF",
    CUSTOMER: "CUSTOMER"
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: 'ACTIVE' | 'INACTIVE';
    profile?: {
        name?: string;
        phone?: string;
    };
}
