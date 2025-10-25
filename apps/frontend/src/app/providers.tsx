import { type PropsWithChildren, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function AppProviders({ children }: PropsWithChildren) {
    const client = useMemo(() => new QueryClient(), []);

    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}