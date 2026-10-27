import { useQuery } from "@tanstack/react-query";
import {getSpecializations } from "../api/specializationsApi";

export function useSpecializations() {
  return useQuery({
    queryKey: ["specializations"],
    queryFn: () => getSpecializations(),
  });
}