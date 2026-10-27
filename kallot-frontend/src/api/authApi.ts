
import { apiRequest } from "./api";

import type {
  MeUser,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
} from "../types/auth";
import type { ClassesByCodeResponse } from "../types/classes";

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(token?: string): Promise<MeUser> {
  return apiRequest<MeUser>("/api/auth/me", {}, token);
}

export async function register(
  data: RegisterBody
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getClassesByCode(
  joinCode: string
): Promise<ClassesByCodeResponse> {
  return apiRequest<ClassesByCodeResponse>(
    `/api/auth/classes?joinCode=${encodeURIComponent(joinCode)}`
  );
}