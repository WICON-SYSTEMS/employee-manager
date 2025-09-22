import { apiRequest } from "./queryClient";
import type { Admin, LoginData } from "@shared/schema";

export interface AuthResponse {
  admin: Admin;
}

export async function login(loginData: LoginData): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/v1/admin/auth/login", loginData);
  return response.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/v1/admin/auth/logout");
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    const response = await apiRequest("GET", "/api/v1/admin/auth/me");
    return response.json();
  } catch (error) {
    return null;
  }
}
