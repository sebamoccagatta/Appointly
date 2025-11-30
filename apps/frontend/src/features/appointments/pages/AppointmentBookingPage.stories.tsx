import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/store";
import AppointmentBookingPage from "./AppointmentBookingPage";

function withAppProviders(StoryComponent: React.ComponentType) {
    const client = new QueryClient();
    return (
        <MemoryRouter initialEntries={["/admin/appointments/new"]}>
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

const meta: Meta<typeof AppointmentBookingPage> = {
    title: "Admin/Appointments/AppointmentBookingPage",
    component: AppointmentBookingPage,
    decorators: [
        (Story) => withAppProviders(Story),
    ],
};

export default meta;

type Story = StoryObj<typeof AppointmentBookingPage>;

export const Default: Story = {};
