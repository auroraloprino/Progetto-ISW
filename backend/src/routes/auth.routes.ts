import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { dbService } from "../database";
import { ObjectId } from "mongodb";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { username, email, password } = req.body ?? {};
  if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });

  const users = dbService.getDb().collection("users");

  const existsEmail = await users.findOne({ email: String(email).toLowerCase() });
  if (existsEmail) return res.status(409).json({ error: "Email already used" });

  const existsUsername = await users.findOne({ username });
  if (existsUsername) return res.status(409).json({ error: "Username already used" });

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await users.insertOne({
    username,
    email: String(email).toLowerCase(),
    passwordHash,
    profileImage: null,
    createdAt: new Date(),
  });

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign({ userId: result.insertedId.toString() }, secret, { expiresIn: "7d" });

  res.json({ token });
});

authRouter.post("/login", async (req, res) => {
  const { identifier, password } = req.body ?? {};
  if (!identifier || !password) return res.status(400).json({ error: "Missing fields" });

  const users = dbService.getDb().collection("users");

  const user = await users.findOne({
    $or: [{ email: String(identifier).toLowerCase() }, { username: identifier }],
  });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign({ userId: user._id.toString() }, secret, { expiresIn: "7d" });

  res.json({ token });
});

authRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const users = dbService.getDb().collection("users");
  const user = await users.findOne(
    { _id: new ObjectId(req.userId) },
    { projection: { passwordHash: 0 } }
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    profileImage: user.profileImage ?? undefined,
  });
});

authRouter.put("/me", requireAuth, async (req: AuthRequest, res) => {
  const { username, email, profileImage } = req.body ?? {};

  const update: any = {};
  if (typeof username === "string" && username.trim()) update.username = username.trim();
  if (typeof email === "string" && email.trim()) update.email = email.trim().toLowerCase();
  if (typeof profileImage === "string") update.profileImage = profileImage;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  const users = dbService.getDb().collection("users");

  if (update.username) {
    const existsUsername = await users.findOne({ username: update.username });
    if (existsUsername && existsUsername._id.toString() !== req.userId) {
      return res.status(409).json({ error: "Username already used" });
    }
  }

  if (update.email) {
    const existsEmail = await users.findOne({ email: update.email });
    if (existsEmail && existsEmail._id.toString() !== req.userId) {
      return res.status(409).json({ error: "Email already used" });
    }
  }

  await users.updateOne({ _id: new ObjectId(req.userId) }, { $set: update });

  const user = await users.findOne(
    { _id: new ObjectId(req.userId) },
    { projection: { passwordHash: 0 } }
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    profileImage: user.profileImage ?? undefined,
  });
});

authRouter.put("/password", requireAuth, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body ?? {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ error: "New password too short (min 6)" });
  }

  const users = dbService.getDb().collection("users");
  const user = await users.findOne({ _id: new ObjectId(req.userId) });
  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Wrong current password" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await users.updateOne({ _id: user._id }, { $set: { passwordHash } });

  res.json({ ok: true });
});