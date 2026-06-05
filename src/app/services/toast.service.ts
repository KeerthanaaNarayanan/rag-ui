import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);

  private nextId = 1;
  private readonly dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();

  show(message: string, type: ToastType): void {
    const id = this.nextId;
    this.nextId += 1;

    this.toasts.update((current) => [...current, { id, message, type }]);

    const timer = setTimeout(() => {
      this.dismiss(id);
    }, 3000);

    this.dismissTimers.set(id, timer);
  }

  dismiss(id: number): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }

    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}