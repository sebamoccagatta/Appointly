import type { Meta, StoryObj } from "@storybook/react";
import { RegisterForm } from "./RegisterForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/store";
import { MemoryRouter } from "react-router-dom";

const meta: Meta<typeof RegisterForm> = {
    title: "Auth/RegisterForm",
    component: RegisterForm,
    decorators: [
        (Story) => {
            const client = new QueryClient();
            return (
                <MemoryRouter initialEntries={["/register"]}>
                    <QueryClientProvider client={client}>
                        <AuthProvider>
                            <div style={{ maxWidth: 420, margin: "2rem auto" }}>
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

type Story = StoryObj<typeof RegisterForm>;
export const Default: Story = {};
export const Loading: Story = {};
export const WithError: Story = {};
