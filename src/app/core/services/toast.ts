import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class Toast {

  messages = signal<ToastMessage[]>([]);

  private toastId = 0;

  show(message: string, type: ToastType = 'success'): void {
    const id = ++this.toastId;

    this.messages.update(toasts => [
      ...toasts,
      { id, message, type }
    ]);

    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  remove(id: number): void {
    this.messages.update(toasts =>
      toasts.filter(toast => toast.id !== id)
    );
  }
}