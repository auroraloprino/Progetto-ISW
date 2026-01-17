import { api } from "./api";

export type Invite = {
  id: string;
  type: "tag" | "board";
  itemId: string;
  itemName: string;
  senderId: string;
  senderName: string;
  role: string | null;
  createdAt: string;
};

export const invitesAPI = {
  async getPending(): Promise<Invite[]> {
    const r = await api.get("/invites");
    return r.data as Invite[];
  },
};