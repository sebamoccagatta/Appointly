import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/store";
import CustomersListPage from "./CustomersListPage";

function withAppProviders(StoryComponent: React.ComponentType) {
    const client = new QueryClient();
    return (
        <MemoryRouter initialEntries={["/admin/customers"]}>
            <QueryClientProvider client={client}>
                <AuthProvider>
                    <div className="bg-slate-950 min-h-screen p-6">
                        <StoryComponent />
                    </div>
                </AuthProvider>
            </QueryClientProvider>
        </MemoryRouter>
    );
}

const meta: Meta<typeof CustomersListPage> = {
    title: "Admin/Customers/CustomersListPage",
    component: CustomersListPage,
    decorators: [
        (Story) => withAppProviders(Story),
    ],
};

export default meta;

type Story = StoryObj<typeof CustomersListPage>;

export const Default: Story = {};
