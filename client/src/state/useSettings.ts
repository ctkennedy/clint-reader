import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Settings } from "../api/types";

export function useSettings() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["settings"], queryFn: api.getSettings });

  const mutation = useMutation({
    mutationFn: (data: Partial<Settings>) => api.updateSettings(data),
    onSuccess: (settings) => {
      queryClient.setQueryData(["settings"], settings);
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: mutation.mutate,
  };
}
