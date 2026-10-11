"use client";

interface AdminNoticeProps {
  message: string;
  onDismiss: () => void;
}

export function AdminNotice({ message, onDismiss }: AdminNoticeProps) {
  return (
    <div aria-live="polite" className="admin-notice" role="status">
      <span>{message}</span>
      <button onClick={onDismiss} type="button">Dismiss</button>
    </div>
  );
}
