import { toast } from "sonner";

let currentToastId: string | number | null = null;
let consecutiveErrorCount = 0;
const ERROR_THRESHOLD = 3; // Number of consecutive errors before suggesting support

const showSingleToast = (type: 'success' | 'error', message: string, options?: any) => {
  if (currentToastId !== null) {
    toast.dismiss(currentToastId);
  }

  if (type === 'error') {
    consecutiveErrorCount++;
    if (consecutiveErrorCount >= ERROR_THRESHOLD) {
      message = "Multiple errors detected. Please contact support if the issue persists.";
      // Optionally, you could trigger a more complex dialog here
    }
  } else {
    consecutiveErrorCount = 0; // Reset on success
  }

  currentToastId = toast[type](message, {
    ...options,
    onAutoClose: (id: string | number) => {
      if (currentToastId === id) {
        currentToastId = null;
      }
      options?.onAutoClose?.(id);
    },
    onDismiss: (id: string | number) => {
      if (currentToastId === id) {
        currentToastId = null;
      }
      // If the user dismisses a "contact support" toast, reset the counter
      if (consecutiveErrorCount >= ERROR_THRESHOLD && type === 'error') {
        consecutiveErrorCount = 0;
      }
      options?.onDismiss?.(id);
    }
  });
};

export const showSuccess = (message: string) => {
  showSingleToast('success', message);
};

export const showError = (message: string) => {
  // Intercept generic "Fetch failed" messages
  if (message.toLowerCase().includes("fetch failed")) {
    message = "A network error occurred. Please check your internet connection and try again.";
  }
  showSingleToast('error', message);
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
  if (currentToastId === toastId) {
    currentToastId = null;
  }
};