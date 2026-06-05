import { create } from "zustand";

interface VideoStore {
  uploadModalOpen: boolean;
  // eslint-disable-next-line no-unused-vars
  setUploadModalOpen: (open: boolean) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  uploadModalOpen: false,
  setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
}));
