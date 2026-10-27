
import { apiRequest } from "./api";
import type { KallotFilters, KallotListResponse, Kalla, KallaBody } from "../types/kallot";

export async function getKallot(filters: KallotFilters): Promise<KallotListResponse> {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.classId) params.set("classId", filters.classId);
  if (filters.yeshivaId) params.set("yeshivaId", filters.yeshivaId);
  if (filters.specializationId) params.set("specializationId", filters.specializationId);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

  return apiRequest<KallotListResponse>(`/api/kallot?${params.toString()}`);
}

export async function createKalla(
body:KallaBody,
classId:string
): Promise<Kalla> {
  return apiRequest<Kalla>(`/api/classes/${classId}/kallot`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function getKalla(id: string): Promise<Kalla> {
  return apiRequest<Kalla>(`/api/kallot/${id}`);
}



export async function updateKalla(
body:KallaBody,
id:string
): Promise<Kalla> {
  return apiRequest<Kalla>(`/api/kallot/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}
