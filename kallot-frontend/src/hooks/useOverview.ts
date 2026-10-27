import { useQuery } from "@tanstack/react-query";
import {getAllStats } from "../api/statsApi";

export function useAllStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => getAllStats(),
  });
}