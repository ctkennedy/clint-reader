import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import "./addSubscription.css";

export function AddSubscriptionModal({ onClose, onSubscribed }: { onClose: () => void; onSubscribed: (scope: string) => void }) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const foldersQuery = useQuery({ queryKey: ["folders"], queryFn: api.listFolders });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => api.createFolder(name),
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      let folderIds: string[] = [];
      if (newFolderName.trim()) {
        const folder = await createFolderMutation.mutateAsync(newFolderName.trim());
        folderIds = [folder.id];
      } else if (selectedFolderId) {
        folderIds = [selectedFolderId];
      }
      return api.subscribe(url.trim(), folderIds);
    },
    onSuccess: (feed) => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      onSubscribed(`feed:${feed.id}`);
      onClose();
    },
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Subscribe to a feed</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) subscribeMutation.mutate();
          }}
        >
          <label>
            Feed URL or website address
            <input
              autoFocus
              type="text"
              placeholder="https://example.com/feed or https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>

          <label>
            Folder (optional)
            <select value={selectedFolderId} onChange={(e) => setSelectedFolderId(e.target.value)} disabled={!!newFolderName.trim()}>
              <option value="">No folder</option>
              {(foldersQuery.data || []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Or create a new folder
            <input
              type="text"
              placeholder="New folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </label>

          {subscribeMutation.isError && (
            <p className="modal-error">{(subscribeMutation.error as Error).message}</p>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={!url.trim() || subscribeMutation.isPending}>
              {subscribeMutation.isPending ? "Subscribing…" : "Subscribe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
