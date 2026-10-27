import { apiRequest } from "./api";
import type { AllStats } from "../types/stats"

export async function getAllStats(
): Promise<AllStats> {
    return apiRequest<AllStats>("/api/overview");
}


