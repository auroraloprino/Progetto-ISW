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

authRouter.get("/shared-items", requireAuth, async (req: AuthRequest, res) => {
  const db = dbService.getDb();
  const userId = new ObjectId(req.userId);
  
  // Get boards
  const boards = db.collection("boards");
  const userBoards = await boards.find({
    $or: [
      { ownerId: userId },
      { "members.userId": userId }
    ]
  }).toArray();
  
  // Get tags
  const tags = db.collection("tags");
  const userTags = await tags.find({
    $or: [
      { ownerId: userId },
      { "sharedWith.userId": userId },
      { sharedWith: userId }
    ]
  }).toArray();
  
  // Collect all user IDs to fetch
  const userIds = new Set<string>();
  
  userBoards.forEach((board: any) => {
    if (board.ownerId) userIds.add(board.ownerId.toString());
    (board.members ?? []).forEach((m: any) => {
      if (m.userId) userIds.add(m.userId.toString());
    });
  });
  
  userTags.forEach((tag: any) => {
    if (tag.ownerId) userIds.add(tag.ownerId.toString());
    (tag.sharedWith ?? []).forEach((m: any) => {
      if (m.userId) {
        userIds.add(m.userId.toString());
      } else if (m instanceof ObjectId) {
        userIds.add(m.toString());
      }
    });
  });
  
  // Fetch user details
  const users = db.collection("users");
  const userList = await users.find({
    _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) }
  }).toArray();
  
  const userMap = new Map(
    userList.map((u: any) => [u._id.toString(), { username: u.username, email: u.email }])
  );
  
  // Format boards response
  const boardsResponse = userBoards.map((b: any) => {
    const isOwner = b.ownerId.equals(userId);
    const members = (b.members ?? [])
      .filter((m: any) => !m.userId.equals(userId))
      .map((m: any) => ({
        userId: m.userId.toString(),
        role: m.role,
        username: userMap.get(m.userId.toString())?.username || "Unknown",
        email: userMap.get(m.userId.toString())?.email || ""
      }));
    
    return {
      id: b._id.toString(),
      title: b.title,
      slug: b.slug,
      isOwner,
      members
    };
  });
  
  // Format tags response
  const tagsResponse = userTags.map((t: any) => {
    const isOwner = t.ownerId.equals(userId);
    const sharedWith = (t.sharedWith ?? [])
      .map((m: any) => {
        const uid = m.userId ? m.userId : m;
        if (uid.equals(userId)) return null;
        
        return {
          userId: uid.toString(),
          role: m.role || "editor",
          username: userMap.get(uid.toString())?.username || "Unknown",
          email: userMap.get(uid.toString())?.email || ""
        };
      })
      .filter((m: any) => m !== null);
    
    return {
      id: t._id.toString(),
      name: t.name,
      color: t.color,
      isOwner,
      sharedWith
    };
  });
  
  res.json({
    boards: boardsResponse,
    tags: tagsResponse
  });
});

authRouter.delete("/me", requireAuth, async (req: AuthRequest, res) => {
  const db = dbService.getDb();
  const userId = new ObjectId(req.userId);

  const boards = db.collection("boards");
  await boards.deleteMany({ ownerId: userId });

  await boards.updateMany(
    { "members.userId": userId },
    { $pull: { members: { userId } } } as any
  );

  const transactions = db.collection("transactions");
  await transactions.deleteMany({ userId });

  const users = db.collection("users");
  const result = await users.deleteOne({ _id: userId });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ ok: true });
});