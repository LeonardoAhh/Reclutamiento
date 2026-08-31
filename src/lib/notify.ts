import { TOAST_CONFIG } from '@/lib/constants';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading' | 'default';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  closeOnAction?: boolean;
}

export interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  id?: string | number;
  actions?: readonly ToastAction[];
}

export interface ToastState extends ToastOptions {
  id: string;
  type: ToastType;
}

type Listener = (toasts: ToastState[]) => void;

class ToastStore {
  private toasts: ToastState[] = [];
  private listeners = new Set<Listener>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => {
    return this.toasts;
  };

  private notify() {
    this.listeners.forEach((l) => l(this.toasts));
  }

  add(type: ToastType, opts: ToastOptions) {
    const id = opts.id !== undefined ? String(opts.id) : crypto.randomUUID();
    const duration =
      opts.duration ??
      (type === 'loading' ? Infinity : TOAST_CONFIG.defaultDurationMs);

    const existingIndex = this.toasts.findIndex((t) => t.id === id);
    const newToast: ToastState = { ...opts, id, type, duration };

    this.clearTimer(id);

    if (existingIndex > -1) {
      const newToasts = [...this.toasts];
      newToasts[existingIndex] = newToast;
      this.toasts = newToasts;
    } else {
      const nextToasts = [...this.toasts, newToast];
      const removedToasts = nextToasts.slice(
        0,
        Math.max(0, nextToasts.length - TOAST_CONFIG.maxVisible),
      );
      removedToasts.forEach((toast) => this.clearTimer(toast.id));
      this.toasts = nextToasts.slice(-TOAST_CONFIG.maxVisible);
    }
    
    this.notify();

    if (duration !== Infinity) {
      const timer = setTimeout(() => {
        this.remove(id);
      }, duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  remove(id: string) {
    this.clearTimer(id);
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  private clearTimer(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
  }
}

export const toastStore = new ToastStore();

// Retrocompatibilidad con la API de toast
export const toast = {
  success: (opts: ToastOptions) => toastStore.add('success', opts),
  error: (opts: ToastOptions) => toastStore.add('error', opts),
  info: (opts: ToastOptions) => toastStore.add('info', opts),
  warning: (opts: ToastOptions) => toastStore.add('warning', opts),
  loading: (opts: ToastOptions) => toastStore.add('loading', opts),
  promise: async <T>(
    promise: Promise<T> | (() => Promise<T>),
    opts: { loading: string; success: string; error: string; id?: string | number }
  ): Promise<T> => {
    const id = opts.id ? String(opts.id) : crypto.randomUUID();
    toastStore.add('loading', { id, title: opts.loading });
    
    try {
      const p = typeof promise === 'function' ? promise() : promise;
      const res = await p;
      toastStore.add('success', { id, title: opts.success });
      return res;
    } catch (err) {
      toastStore.add('error', { id, title: opts.error });
      throw err;
    }
  },
  dismiss: (id?: string | number) => {
    if (id !== undefined) {
      toastStore.remove(String(id));
    } else {
      toastStore.getSnapshot().forEach((t) => toastStore.remove(t.id));
    }
  },
};

if (typeof window !== 'undefined') {
  (window as unknown as { toast: typeof toast }).toast = toast;
}

export type ActionResult = { ok: boolean; message?: string };

interface NotifyMessages {
  success: string;
  error?: string;
}

export async function notifyResult<T extends ActionResult>(
  action: Promise<T> | (() => Promise<T>),
  messages: NotifyMessages,
): Promise<T> {
  const res = await (typeof action === 'function' ? action() : action);
  if (res.ok) {
    toast.success({ title: messages.success });
  } else {
    toast.error({ title: messages.error ?? 'No se pudo realizar la acción' });
  }
  return res;
}
