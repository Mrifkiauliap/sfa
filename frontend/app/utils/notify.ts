export interface ToastItem {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

export const useNotification = () => {
  const toasts = useState<ToastItem[]>("globalToasts", () => []);

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const addToast = (
    type: ToastItem["type"],
    message: string,
    title: string,
  ) => {
    const id = Date.now().toString() + Math.random().toString();
    toasts.value.push({ id, type, title, message });
    setTimeout(() => {
      removeToast(id);
    }, 4500); // Tahan selama 4.5 detik
  };

  const showError = (message: string, title = "Terjadi Kesalahan") => {
    addToast("error", message, title);
  };

  const showSuccess = (message: string, title = "Berhasil") => {
    addToast("success", message, title);
  };

  const showWarning = (message: string, title = "Peringatan") => {
    addToast("warning", message, title);
  };

  const showInfo = (message: string, title = "Informasi") => {
    addToast("info", message, title);
  };

  return { toasts, removeToast, showError, showSuccess, showWarning, showInfo };
};
