import { api } from "../services/api";

const TOKEN_KEY = "auth_token";

export interface User {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function register(user: { username: string; email: string; password: string }) {
  const r = await api.post("/auth/register", user);
  if (r.data?.token) setToken(r.data.token);
  return true;
}

export async function login(identifier: string, password: string) {
  const r = await api.post("/auth/login", { identifier, password });
  if (!r.data?.token) return false;
  setToken(r.data.token);
  return true;
}

export async function currentUser(): Promise<User | null> {
  if (!getToken()) return null;
  try {
    const r = await api.get("/auth/me");
    return r.data as User;
  } catch {
    logout();
    return null;
  }
}
export async function updateUser(
  userData: Partial<Pick<User, "username" | "email" | "profileImage">>
): Promise<User> {
  const r = await api.put("/auth/me", userData);
  return r.data as User;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  await api.put("/auth/password", { oldPassword, newPassword });
  return true;
}

export async function deleteAccount(): Promise<boolean> {
  await api.delete("/auth/me");
  logout();
  return true;
}