import { apiRequest } from "./api";
import type { Yeshiva } from "../types/yeshivot"

export async function getYeshivot(
): Promise<Yeshiva []> {
    return apiRequest<Yeshiva[]>("/api/yeshivot");
}
