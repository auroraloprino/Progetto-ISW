import { Router } from "express";
import { ObjectId } from "mongodb";
import { dbService } from "../database";
import type { AuthRequest } from "../middleware/requireAuth";

export const transactionsRouter = Router();

transactionsRouter.get("/", async (req: AuthRequest, res) => {
  const tx = dbService.getDb().collection("transactions");
  const userId = new ObjectId(req.userId);

  const items = await tx.find({ userId }).sort({ date: -1 }).toArray();
  res.json(
    items.map((t: any) => ({
      id: t._id.toString(),
      type: t.type,
      description: t.description,
      amount: t.amount,
      date: t.date,
    }))
  );
});

transactionsRouter.post("/", async (req: AuthRequest, res) => {
  const { type, description, amount, date } = req.body ?? {};
  if (!type || !description || typeof amount !== "number" || !date) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const tx = dbService.getDb().collection("transactions");
  const userId = new ObjectId(req.userId);

  const result = await tx.insertOne({
    userId,
    type,
    description,
    amount,
    date: new Date(date),
    createdAt: new Date(),
  });

  const created = await tx.findOne({ _id: result.insertedId });

  res.json({
    id: created!._id.toString(),
    type: created!.type,
    description: created!.description,
    amount: created!.amount,
    date: created!.date,
  });
});

transactionsRouter.put("/:id", async (req: AuthRequest, res) => {
  const { description, amount, date } = req.body ?? {};
  if (typeof description !== "string" || typeof amount !== "number" || !date) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const tx = dbService.getDb().collection("transactions");
  const userId = new ObjectId(req.userId);
  const id = new ObjectId(req.params.id);

  const existing = await tx.findOne({ _id: id, userId });
  if (!existing) return res.status(404).json({ error: "Transaction not found" });

  await tx.updateOne(
    { _id: id, userId },
    { $set: { description, amount, date: new Date(date) } }
  );

  const updated = await tx.findOne({ _id: id });

  res.json({
    id: updated!._id.toString(),
    type: updated!.type,
    description: updated!.description,
    amount: updated!.amount,
    date: updated!.date,
  });
});

transactionsRouter.delete("/:id", async (req: AuthRequest, res) => {
  const tx = dbService.getDb().collection("transactions");
  const userId = new ObjectId(req.userId);
  const id = new ObjectId(req.params.id);

  const result = await tx.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Transaction not found" });

  res.json({ ok: true });
});