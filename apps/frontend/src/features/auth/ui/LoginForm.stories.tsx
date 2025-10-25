import type { Meta, StoryObj } from "@storybook/react";
import { LoginForm } from "./LoginForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/store";

const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
  decorators: [
    (Story) => {
      const client = new QueryClient();
      return (
        <QueryClientProvider client={client}>
          <AuthProvider>
            <div style={{ maxWidth: 360, margin: "2rem auto" }}>
              <Story />
            </div>
          </AuthProvider>
        </QueryClientProvider>
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
