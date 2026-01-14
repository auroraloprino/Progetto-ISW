import express from "express";
import cors from "cors";
import { dbService } from "./database";
import { authRouter } from "./routes/auth.routes";
import { boardsRouter } from "./routes/boards.routes";
import { calendarRouter } from "./routes/calendar.routes";
import { invitesRouter } from "./routes/invites.routes";
import { requireAuth } from "./middleware/requireAuth";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Chronio Backend API" });
});

app.use("/api/auth", authRouter);
app.use("/api/boards", requireAuth, boardsRouter);
app.use("/api/calendar", requireAuth, calendarRouter);
app.use("/api/invites", requireAuth, invitesRouter);

async function startServer() {
  try {
    await dbService.connect();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    process.on("SIGINT", async () => {
      console.log("Closing server...");
      await dbService.close();
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();