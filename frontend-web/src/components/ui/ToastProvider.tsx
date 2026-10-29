'use client';

import Toast from './Toast';
import { useAppStore } from '@/store';

export default function ToastProvider() {
  const toast = useAppStore((state) => state.toast);
  const hideToast = useAppStore((state) => state.hideToast);

  if (!toast?.visible) {
    return null;
  }

  return <Toast message={toast.message} type={toast.type} onClose={hideToast} />;
}
