import { apiRequest } from "./api";
import type { Specialization } from "../types/specializations"

export async function getSpecializations(
): Promise<Specialization []> {
    return apiRequest<Specialization[]>("/api/specializations");
}
