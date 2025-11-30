import type { Meta, StoryObj } from "@storybook/react";
import { LoginForm } from "./LoginForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/store";
import { MemoryRouter } from "react-router-dom";

const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
  decorators: [
    (Story) => {
      const client = new QueryClient();
      return (
        <MemoryRouter initialEntries={["/login"]}>
          <QueryClientProvider client={client}>
            <AuthProvider>
              <div style={{ maxWidth: 360, margin: "2rem auto" }}>
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

type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};
export const WithError: Story = {
  args: {
  },
};
export const Loading: Story = {
  args: {
  },
};
