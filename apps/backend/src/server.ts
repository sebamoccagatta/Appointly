import "dotenv/config";
import { buildApp } from "./app.js";

const app = buildApp();

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`HTTP server running on http://${host}:${port}`);
  })
  .catch((err) => {
    app.log.error(err, "Failed to start server");
    process.exit(1);
  });