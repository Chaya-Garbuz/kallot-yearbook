import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {  getKallot , createKalla, getKalla, updateKalla} from "../api/kallotApi";
import type { KallotFilters , KallaBody} from "../types/kallot";


export function useKallot(filters: KallotFilters) {
  return useQuery({
    queryKey: ["kallot", filters],
    queryFn: () => getKallot(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateKalla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, body }: { classId: string; body: KallaBody }) =>
      createKalla( body, classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kallot"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useKalla(id:string) {
  return useQuery({
    queryKey: ["kalla", id],
    queryFn: () => getKalla(id),
  });
}

export function useUpdateKalla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: KallaBody }) =>
      updateKalla( body, id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["kallot"]})
      queryClient.invalidateQueries({ queryKey: ["kalla"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}