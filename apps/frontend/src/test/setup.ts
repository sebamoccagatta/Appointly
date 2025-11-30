import "@testing-library/jest-dom";
import { setupServer } from "msw/node";
import { handlers } from "./msw/handlers";

const server = setupServer(...handlers);

// MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
