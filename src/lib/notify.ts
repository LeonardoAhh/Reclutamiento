export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading' | 'default';

export interface ToastOptions {
  title: string;
  hint?: string;
  duration?: number;
  id?: string | number;
}

export interface ToastState extends ToastOptions {
  id: string;
  type: ToastType;
}

type Listener = (toasts: ToastState[]) => void;

class ToastStore {
  private toasts: ToastState[] = [];
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot() {
    return this.toasts;
  }

  private notify() {
    this.listeners.forEach((l) => l(this.toasts));
  }

  add(type: ToastType, opts: ToastOptions) {
    const id = opts.id ? String(opts.id) : crypto.randomUUID();
    const duration = opts.duration ?? (type === 'loading' ? Infinity : 4000);

    const existingIndex = this.toasts.findIndex((t) => t.id === id);
    const newToast: ToastState = { ...opts, id, type, duration };

    if (existingIndex > -1) {
      const newToasts = [...this.toasts];
      newToasts[existingIndex] = newToast;
      this.toasts = newToasts;
    } else {
      this.toasts = [...this.toasts, newToast];
    }
    
    this.notify();

    if (duration !== Infinity) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

export const toastStore = new ToastStore();

// Retrocompatibilidad con la API de Sileo
export const sileo = {
  success: (opts: ToastOptions) => toastStore.add('success', opts),
  error: (opts: ToastOptions) => toastStore.add('error', opts),
  info: (opts: ToastOptions) => toastStore.add('info', opts),
  warning: (opts: ToastOptions) => toastStore.add('warning', opts),
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
  (window as unknown as { sileo: typeof sileo }).sileo = sileo;
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
    sileo.success({ title: messages.success });
  } else {
    sileo.error({ title: messages.error ?? 'No se pudo realizar la acción' });
  }
  return res;
}
