import { useQuery } from "@tanstack/react-query";
import {getYeshivot } from "../api/yeshivotApi";

export function useYeshivot() {
  return useQuery({
    queryKey: ["yeshivot"],
    queryFn: () => getYeshivot(),
  });
}