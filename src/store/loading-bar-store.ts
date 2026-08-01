import { create } from "zustand";

interface LoadingBarStore {
  // Đếm số tác vụ thủ công đang chạy (gọi qua loadingBar.start()/done()),
  // dùng counter thay vì boolean để chịu được nhiều tác vụ chồng nhau.
  manual: number;
  // Cờ riêng cho điều hướng trang (chỉ có 1 điều hướng "đang diễn ra" tại
  // một thời điểm) — tách khỏi manual để tránh lệch đếm khi người dùng
  // bấm nhiều link liên tiếp nhưng chỉ một điều hướng thực sự hoàn tất.
  navigating: boolean;
  startManual: () => void;
  doneManual: () => void;
  setNavigating: (value: boolean) => void;
}

const useLoadingBarStore = create<LoadingBarStore>((set) => ({
  manual: 0,
  navigating: false,
  startManual: () => set((state) => ({ manual: state.manual + 1 })),
  doneManual: () => set((state) => ({ manual: Math.max(0, state.manual - 1) })),
  setNavigating: (value) => set({ navigating: value }),
}));

export const loadingBar = {
  start: () => useLoadingBarStore.getState().startManual(),
  done: () => useLoadingBarStore.getState().doneManual(),
};

export { useLoadingBarStore };
