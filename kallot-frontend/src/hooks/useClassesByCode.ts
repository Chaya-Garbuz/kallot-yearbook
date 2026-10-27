import { useQuery } from "@tanstack/react-query";
import { getClassesByCode } from "../api/authApi";

export function useClassesByCode(joinCode: string) {
  return useQuery({
    queryKey: ["classes", joinCode],
    queryFn: () => getClassesByCode(joinCode),
    enabled: joinCode !== "",
    retry: false,
  });
}