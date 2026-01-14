import { Router } from "express";
import { ObjectId } from "mongodb";
import { dbService } from "../database";
import type { AuthRequest } from "../middleware/requireAuth";

export const boardsRouter = Router();

// helper: verifica che l'utente sia owner/editor
async function requireBoardWriteAccess(boardId: string, userId: string) {
  const boards = dbService.getDb().collection("boards");
  const board = await boards.findOne({ _id: new ObjectId(boardId) });
  if (!board) return { ok: false as const, status: 404, error: "Board not found" };

  const uid = new ObjectId(userId);
  const isOwner = board.ownerId?.equals(uid);
  const member = (board.members ?? []).find((m: any) => m.userId?.equals(uid));
  const role = isOwner ? "owner" : member?.role;

  if (role !== "owner" && role !== "editor") {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const, board };
}

// LISTA boards visibili (owner o member)
boardsRouter.get("/", async (req: AuthRequest, res) => {
  const uid = new ObjectId(req.userId);
  const boards = dbService.getDb().collection("boards");

  const list = await boards
    .find({
      $or: [{ ownerId: uid }, { "members.userId": uid }],
    })
    .sort({ updatedAt: -1 })
    .toArray();

  res.json(
    list.map((b: any) => ({
      id: b._id.toString(),
      slug: b.slug,
      title: b.title,
      ownerId: b.ownerId?.toString(),
      members: (b.members ?? []).map((m: any) => ({ userId: m.userId.toString(), role: m.role })),
      columns: b.columns ?? [],
    }))
  );
});

// CREA board
boardsRouter.post("/", async (req: AuthRequest, res) => {
  const { title, slug } = req.body ?? {};
  if (!title || !slug) return res.status(400).json({ error: "Missing fields" });

  const boards = dbService.getDb().collection("boards");
  const uid = new ObjectId(req.userId);

  const now = new Date();
  const result = await boards.insertOne({
    title,
    slug,
    ownerId: uid,
    members: [{ userId: uid, role: "owner" }],
    columns: [],
    createdAt: now,
    updatedAt: now,
  });

  const created = await boards.findOne({ _id: result.insertedId });

  res.json({
    id: created!._id.toString(),
    slug: created!.slug,
    title: created!.title,
    ownerId: created!.ownerId.toString(),
    members: created!.members.map((m: any) => ({ userId: m.userId.toString(), role: m.role })),
    columns: created!.columns ?? [],
  });
});

// UPDATE board intera (titolo/slug/columns/tasks)
boardsRouter.put("/:id", async (req: AuthRequest, res) => {
  const boardId = req.params.id;
  const check = await requireBoardWriteAccess(boardId, req.userId!);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const { title, slug, columns } = req.body ?? {};
  if (!title || !slug || !Array.isArray(columns)) return res.status(400).json({ error: "Invalid payload" });

  const boards = dbService.getDb().collection("boards");
  await boards.updateOne(
    { _id: new ObjectId(boardId) },
    {
      $set: { title, slug, columns, updatedAt: new Date() },
    }
  );

  const updated = await boards.findOne({ _id: new ObjectId(boardId) });

  res.json({
    id: updated!._id.toString(),
    slug: updated!.slug,
    title: updated!.title,
    ownerId: updated!.ownerId.toString(),
    members: (updated!.members ?? []).map((m: any) => ({ userId: m.userId.toString(), role: m.role })),
    columns: updated!.columns ?? [],
  });
});

// DELETE board (solo owner)
boardsRouter.delete("/:id", async (req: AuthRequest, res) => {
  const boards = dbService.getDb().collection("boards");
  const uid = new ObjectId(req.userId);
  const boardId = new ObjectId(req.params.id);

  const board = await boards.findOne({ _id: boardId });
  if (!board) return res.status(404).json({ error: "Board not found" });
  if (!board.ownerId.equals(uid)) return res.status(403).json({ error: "Only owner can delete" });

  await boards.deleteOne({ _id: boardId });
  res.json({ ok: true });
});

// AGGIUNGI membro (sharing) con username o email
boardsRouter.post("/:id/members", async (req: AuthRequest, res) => {
  const boardId = req.params.id;
  const check = await requireBoardWriteAccess(boardId, req.userId!);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const { identifier, role } = req.body ?? {};
  if (!identifier || !role) return res.status(400).json({ error: "Missing fields" });
  if (!["editor", "viewer"].includes(role)) return res.status(400).json({ error: "Role must be editor/viewer" });

  const users = dbService.getDb().collection("users");
  const user = await users.findOne({ $or: [{ email: identifier }, { username: identifier }] });
  if (!user) return res.status(404).json({ error: "User not found" });

  const boards = dbService.getDb().collection("boards");
  await boards.updateOne(
    { _id: new ObjectId(boardId) },
    { $addToSet: { members: { userId: user._id, role } } }
  );

  res.json({ ok: true });
});