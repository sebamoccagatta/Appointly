import type { Meta, StoryObj } from "@storybook/react";
import { DashboardLayout } from "./DashboardLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/store";
import { MemoryRouter } from "react-router-dom";

const meta: Meta<typeof DashboardLayout> = {
    title: "Dashboard/Layout",
    component: DashboardLayout,
    decorators: [
        (Story) => {
            const client = new QueryClient();
            return (
                <MemoryRouter initialEntries={["/dashboard"]}>
                    <QueryClientProvider client={client}>
                        <AuthProvider>
                            <div className="min-h-screen">
                                <Story />
                            </div>
                        </AuthProvider>
                    </QueryClientProvider>
                </MemoryRouter>
            );
        },
    ],
};
export default meta;

type Story = StoryObj<typeof DashboardLayout>;
export const Default: Story = {
    args: {
        children: <div className="p-6">Contenido</div>,
    },
};
