import "dotenv/config";
import http from "http";
import app from "./app";
import { initSockets } from "./sockets";
import { startOverdueChecker } from "./jobs/overdueChecker";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSockets(httpServer);
startOverdueChecker();

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
