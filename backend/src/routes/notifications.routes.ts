import { Router } from "express";
import { ObjectId } from "mongodb";
import { dbService } from "../database";
import type { AuthRequest } from "../middleware/requireAuth";

export const notificationsRouter = Router();

notificationsRouter.get("/", async (req: AuthRequest, res) => {
  const notifications = dbService.getDb().collection("notifications");
  const userId = new ObjectId(req.userId);

  const list = await notifications
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(
    list.map((n: any) => ({
      id: n.id,
      eventId: n.eventId,
      title: n.title,
      message: n.message,
      datetime: n.datetime,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
    }))
  );
});

notificationsRouter.put("/:id/read", async (req: AuthRequest, res) => {
  const notifications = dbService.getDb().collection("notifications");
  const userId = new ObjectId(req.userId);
  const notificationId = req.params.id;

  await notifications.updateOne(
    { userId, id: notificationId },
    { $set: { read: true } }
  );

  res.json({ ok: true });
});

notificationsRouter.put("/mark-all-read", async (req: AuthRequest, res) => {
  const notifications = dbService.getDb().collection("notifications");
  const userId = new ObjectId(req.userId);

  await notifications.updateMany({ userId, read: false }, { $set: { read: true } });

  res.json({ ok: true });
});

notificationsRouter.delete("/:id", async (req: AuthRequest, res) => {
  const notifications = dbService.getDb().collection("notifications");
  const userId = new ObjectId(req.userId);
  const notificationId = req.params.id;

  await notifications.deleteOne({ userId, id: notificationId });

  res.json({ ok: true });
});

notificationsRouter.delete("/", async (req: AuthRequest, res) => {
  const notifications = dbService.getDb().collection("notifications");
  const userId = new ObjectId(req.userId);

  await notifications.deleteMany({ userId });

  res.json({ ok: true });
});

notificationsRouter.post("/sync", async (req: AuthRequest, res) => {
  const { notifications: clientNotifications } = req.body ?? {};
  if (!Array.isArray(clientNotifications)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const notifications = dbService.getDb().collection("notifications");
  const userId = new ObjectId(req.userId);

  await notifications.deleteMany({ userId });

  if (clientNotifications.length > 0) {
    const docs = clientNotifications.map((n: any) => ({
      userId,
      id: n.id,
      eventId: n.eventId,
      title: n.title,
      message: n.message,
      datetime: new Date(n.datetime),
      type: n.type,
      read: n.read,
      createdAt: new Date(n.createdAt),
    }));

    await notifications.insertMany(docs);
  }

  res.json({ ok: true });
});
