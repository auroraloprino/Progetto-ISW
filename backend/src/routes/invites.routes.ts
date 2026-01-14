import { Router } from "express";
import { ObjectId } from "mongodb";
import { dbService } from "../database";
import type { AuthRequest } from "../middleware/requireAuth";

export const invitesRouter = Router();

invitesRouter.get("/", async (req: AuthRequest, res) => {
  const uid = new ObjectId(req.userId);
  const invites = dbService.getDb().collection("invites");

  const list = await invites
    .find({ recipientId: uid, status: "pending" })
    .toArray();

  res.json(
    list.map((i: any) => ({
      id: i._id.toString(),
      type: i.type,
      itemId: i.itemId.toString(),
      itemName: i.itemName,
      senderId: i.senderId.toString(),
      senderName: i.senderName,
      role: i.role,
      createdAt: i.createdAt,
    }))
  );
});

invitesRouter.post("/", async (req: AuthRequest, res) => {
  const { type, itemId, identifier, role } = req.body ?? {};
  if (!type || !itemId || !identifier) return res.status(400).json({ error: "Missing fields" });

  if (!ObjectId.isValid(itemId)) {
    return res.status(400).json({ error: "Invalid item ID" });
  }

  const users = dbService.getDb().collection("users");
  const recipient = await users.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!recipient) return res.status(404).json({ error: "User not found" });

  const sender = await users.findOne({ _id: new ObjectId(req.userId) });
  if (!sender) return res.status(404).json({ error: "Sender not found" });

  let itemName = "";
  if (type === "tag") {
    const tags = dbService.getDb().collection("tags");
    const tag = await tags.findOne({ _id: new ObjectId(itemId) });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    itemName = tag.name;
  } else if (type === "board") {
    const boards = dbService.getDb().collection("boards");
    const board = await boards.findOne({ _id: new ObjectId(itemId) });
    if (!board) return res.status(404).json({ error: "Board not found" });
    itemName = board.title;
  }

  const invites = dbService.getDb().collection("invites");
  const result = await invites.insertOne({
    type,
    itemId: new ObjectId(itemId),
    itemName,
    senderId: new ObjectId(req.userId),
    senderName: sender.username,
    recipientId: recipient._id,
    role: role || null,
    status: "pending",
    createdAt: new Date(),
  });

  res.json({ ok: true, inviteId: result.insertedId.toString() });
});

invitesRouter.post("/:id/accept", async (req: AuthRequest, res) => {
  const inviteId = req.params.id;
  const invites = dbService.getDb().collection("invites");
  const invite = await invites.findOne({ _id: new ObjectId(inviteId) });

  if (!invite) return res.status(404).json({ error: "Invite not found" });
  if (!invite.recipientId.equals(new ObjectId(req.userId))) {
    return res.status(403).json({ error: "Not your invite" });
  }

if (invite.type === "tag") {
  const tags = dbService.getDb().collection("tags");

  await tags.updateOne(
    { _id: invite.itemId },
    {
      $addToSet: {
        sharedWith: {
          userId: invite.recipientId,
          role: invite.role || "editor",
        },
      },
    }
  );
} else if (invite.type === "board") {
  const boards = dbService.getDb().collection("boards");
  await boards.updateOne(
    { _id: invite.itemId },
    { $addToSet: { members: { userId: invite.recipientId, role: invite.role } } }
  );
}

  await invites.updateOne(
    { _id: new ObjectId(inviteId) },
    { $set: { status: "accepted" } }
  );

  res.json({ ok: true });
});

invitesRouter.post("/:id/reject", async (req: AuthRequest, res) => {
  const inviteId = req.params.id;
  const invites = dbService.getDb().collection("invites");
  const invite = await invites.findOne({ _id: new ObjectId(inviteId) });

  if (!invite) return res.status(404).json({ error: "Invite not found" });
  if (!invite.recipientId.equals(new ObjectId(req.userId))) {
    return res.status(403).json({ error: "Not your invite" });
  }

  await invites.updateOne(
    { _id: new ObjectId(inviteId) },
    { $set: { status: "rejected" } }
  );

  res.json({ ok: true });
});
