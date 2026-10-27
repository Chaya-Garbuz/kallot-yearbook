
import type { KallaBody, KallaFormValues } from "../types/kallot";

export function toKallaBody(values: KallaFormValues): KallaBody {
  return {
    name: values.name.trim(),
    specializationId: values.specializationId,
    yeshivaId: values.yeshivaId,
    engagedAt: values.engagedAt,
    weddingAt: values.weddingAt || null,
    hallName: values.hallName.trim() || null,
    hallCity: values.hallCity.trim() || null,
  };
}

