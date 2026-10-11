"use client";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <Modal onClose={onCancel} title={title}>
      <div className="admin-confirm-content">
        <span className={`admin-confirm-icon${danger ? " admin-confirm-icon-danger" : ""}`}>
          <Icon name={danger ? "info" : "check-circle"} />
        </span>
        <h2 className="admin-modal-title">{title}</h2>
        <p className="admin-modal-description">{description}</p>
        <div className="admin-modal-actions">
          <button className="button button-secondary" onClick={onCancel} type="button">Cancel</button>
          <button className={`button ${danger ? "button-danger" : "button-primary"}`} onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
