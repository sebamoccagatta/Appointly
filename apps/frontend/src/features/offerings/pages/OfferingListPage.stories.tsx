import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/store";
import OfferingListPage from "./OfferingListPage";

function withAppProviders(StoryComponent: React.ComponentType) {
    const client = new QueryClient();
    return (
        <MemoryRouter initialEntries={["/admin/offerings"]}>
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

const meta: Meta<typeof OfferingListPage> = {
    title: "Admin/Offerings/OfferingListPage",
    component: OfferingListPage,
    decorators: [
        (Story) => withAppProviders(Story),
    ],
};

export default meta;

type Story = StoryObj<typeof OfferingListPage>;

export const Default: Story = {};
