export const UserRole = {
    ADMIN: 'ADMIN',
    USER: 'USER',
    ASSISTANT: 'ASSISTANT'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}