import { api } from "./api";
import type { Transaction, TransactionType } from "../types";

export const budgetAPI = {
  async getAll(): Promise<Transaction[]> {
    const r = await api.get("/transactions");
    return r.data.map((t: any) => ({ ...t, date: new Date(t.date) }));
  },
  async create(input: { type: TransactionType; description: string; amount: number; date: Date }): Promise<Transaction> {
    const r = await api.post("/transactions", { ...input, date: input.date.toISOString() });
    return { ...r.data, date: new Date(r.data.date) };
  },
  async update(id: string, input: { description: string; amount: number; date: Date }): Promise<Transaction> {
    const r = await api.put(`/transactions/${id}`, { ...input, date: input.date.toISOString() });
    return { ...r.data, date: new Date(r.data.date) };
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },
};
