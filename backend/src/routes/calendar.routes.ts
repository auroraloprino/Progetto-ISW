import { Router } from "express";
import { ObjectId } from "mongodb";
import { dbService } from "../database";
import type { AuthRequest } from "../middleware/requireAuth";

export const calendarRouter = Router();

calendarRouter.get("/tags", async (req: AuthRequest, res) => {
  const uid = new ObjectId(req.userId);
  const tags = dbService.getDb().collection("tags");

  const list = await tags
    .find({
      $or: [{ ownerId: uid }, { sharedWith: uid }],
    })
    .toArray();

  res.json(
    list.map((t: any) => ({
      id: t._id.toString(),
      name: t.name,
      color: t.color,
      visible: t.visible ?? true,
      ownerId: t.ownerId.toString(),
      sharedWith: (t.sharedWith ?? []).map((id: ObjectId) => id.toString()),
    }))
  );
});

calendarRouter.post("/tags", async (req: AuthRequest, res) => {
  const { name, color } = req.body ?? {};
  if (!name || !color) return res.status(400).json({ error: "Missing fields" });

  const tags = dbService.getDb().collection("tags");
  const uid = new ObjectId(req.userId);

  const result = await tags.insertOne({
    name,
    color,
    visible: true,
    ownerId: uid,
    sharedWith: [],
    createdAt: new Date(),
  });

  const created = await tags.findOne({ _id: result.insertedId });

  res.json({
    id: created!._id.toString(),
    name: created!.name,
    color: created!.color,
    visible: created!.visible,
    ownerId: created!.ownerId.toString(),
    sharedWith: [],
  });
});

calendarRouter.put("/tags/:id", async (req: AuthRequest, res) => {
  const tagId = req.params.id;
  const { name, color, visible } = req.body ?? {};

  const tags = dbService.getDb().collection("tags");
  const tag = await tags.findOne({ _id: new ObjectId(tagId) });

  if (!tag) return res.status(404).json({ error: "Tag not found" });
  if (!tag.ownerId.equals(new ObjectId(req.userId))) {
    return res.status(403).json({ error: "Only owner can update tag" });
  }

  const update: any = {};
  if (name) update.name = name;
  if (color) update.color = color;
  if (typeof visible === "boolean") update.visible = visible;

  await tags.updateOne({ _id: new ObjectId(tagId) }, { $set: update });

  const updated = await tags.findOne({ _id: new ObjectId(tagId) });

  res.json({
    id: updated!._id.toString(),
    name: updated!.name,
    color: updated!.color,
    visible: updated!.visible,
    ownerId: updated!.ownerId.toString(),
    sharedWith: (updated!.sharedWith ?? []).map((id: ObjectId) => id.toString()),
  });
});

calendarRouter.delete("/tags/:id", async (req: AuthRequest, res) => {
  const tags = dbService.getDb().collection("tags");
  const tagId = new ObjectId(req.params.id);
  const uid = new ObjectId(req.userId);

  const tag = await tags.findOne({ _id: tagId });
  if (!tag) return res.status(404).json({ error: "Tag not found" });
  if (!tag.ownerId.equals(uid)) {
    return res.status(403).json({ error: "Only owner can delete tag" });
  }

  await tags.deleteOne({ _id: tagId });
  res.json({ ok: true });
});

calendarRouter.post("/tags/:id/share", async (req: AuthRequest, res) => {
  const tagId = req.params.id;
  const { identifier } = req.body ?? {};
  if (!identifier) return res.status(400).json({ error: "Missing identifier" });

  const tags = dbService.getDb().collection("tags");
  const tag = await tags.findOne({ _id: new ObjectId(tagId) });

  if (!tag) return res.status(404).json({ error: "Tag not found" });
  if (!tag.ownerId.equals(new ObjectId(req.userId))) {
    return res.status(403).json({ error: "Only owner can share tag" });
  }

  const users = dbService.getDb().collection("users");
  const user = await users.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  await tags.updateOne(
    { _id: new ObjectId(tagId) },
    { $addToSet: { sharedWith: user._id } }
  );

  res.json({ ok: true });
});

calendarRouter.delete("/tags/:id/share/:userId", async (req: AuthRequest, res) => {
  const tagId = req.params.id;
  const userIdToRemove = req.params.userId;

  const tags = dbService.getDb().collection("tags");
  const tag = await tags.findOne({ _id: new ObjectId(tagId) });

  if (!tag) return res.status(404).json({ error: "Tag not found" });
  if (!tag.ownerId.equals(new ObjectId(req.userId))) {
    return res.status(403).json({ error: "Only owner can unshare tag" });
  }

  await tags.updateOne(
    { _id: new ObjectId(tagId) },
    { $pull: { sharedWith: new ObjectId(userIdToRemove) } as any }
  );

  res.json({ ok: true });
});

calendarRouter.get("/events", async (req: AuthRequest, res) => {
  const uid = new ObjectId(req.userId);
  const events = dbService.getDb().collection("events");
  const tags = dbService.getDb().collection("tags");

  const sharedTags = await tags
    .find({ sharedWith: uid })
    .toArray();
  const sharedTagIds = sharedTags.map(t => t._id);

  const list = await events.find({
    $or: [
      { userId: uid },
      { tag: { $in: sharedTagIds } }
    ]
  }).toArray();

  res.json(
    list.map((e: any) => ({
      id: e._id.toString(),
      title: e.title,
      datetime: e.datetime,
      endDatetime: e.endDatetime,
      type: e.type,
      description: e.description,
      tag: e.tag?.toString(),
      allDay: e.allDay ?? false,
    }))
  );
});

calendarRouter.post("/events", async (req: AuthRequest, res) => {
  const { title, datetime, endDatetime, type, description, tag, allDay } = req.body ?? {};
  if (!title || !datetime || !type) return res.status(400).json({ error: "Missing fields" });

  const events = dbService.getDb().collection("events");
  const uid = new ObjectId(req.userId);

  const result = await events.insertOne({
    title,
    datetime,
    endDatetime: endDatetime || null,
    type,
    description: description || "",
    tag: tag ? new ObjectId(tag) : null,
    allDay: allDay ?? false,
    userId: uid,
    createdAt: new Date(),
  });

  const created = await events.findOne({ _id: result.insertedId });

  res.json({
    id: created!._id.toString(),
    title: created!.title,
    datetime: created!.datetime,
    endDatetime: created!.endDatetime,
    type: created!.type,
    description: created!.description,
    tag: created!.tag?.toString(),
    allDay: created!.allDay,
  });
});

calendarRouter.put("/events/:id", async (req: AuthRequest, res) => {
  const eventId = req.params.id;
  const { title, datetime, endDatetime, type, description, tag, allDay } = req.body ?? {};

  const events = dbService.getDb().collection("events");
  const event = await events.findOne({ _id: new ObjectId(eventId) });

  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!event.userId.equals(new ObjectId(req.userId))) {
    return res.status(403).json({ error: "Not your event" });
  }

  const update: any = {};
  if (title) update.title = title;
  if (datetime) update.datetime = datetime;
  if (endDatetime !== undefined) update.endDatetime = endDatetime;
  if (type) update.type = type;
  if (description !== undefined) update.description = description;
  if (tag !== undefined) update.tag = tag ? new ObjectId(tag) : null;
  if (typeof allDay === "boolean") update.allDay = allDay;

  await events.updateOne({ _id: new ObjectId(eventId) }, { $set: update });

  const updated = await events.findOne({ _id: new ObjectId(eventId) });

  res.json({
    id: updated!._id.toString(),
    title: updated!.title,
    datetime: updated!.datetime,
    endDatetime: updated!.endDatetime,
    type: updated!.type,
    description: updated!.description,
    tag: updated!.tag?.toString(),
    allDay: updated!.allDay,
  });
});

calendarRouter.delete("/events/:id", async (req: AuthRequest, res) => {
  const events = dbService.getDb().collection("events");
  const eventId = new ObjectId(req.params.id);
  const uid = new ObjectId(req.userId);

  const event = await events.findOne({ _id: eventId });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!event.userId.equals(uid)) {
    return res.status(403).json({ error: "Not your event" });
  }

  await events.deleteOne({ _id: eventId });
  res.json({ ok: true });
});
