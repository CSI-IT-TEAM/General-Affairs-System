import { create } from "zustand";

/////
export const useDialogCarouselStore = create((set) => ({
    openDialog: false,
    dataModal: null,
    triggerMenu: () => set((state) => ({ openDialog: !state.openDialog })),
    updateDataModal: (newVal) => set(() => ({ dataModal: newVal })),
}))