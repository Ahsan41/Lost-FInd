"use client";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  danger = false,
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <Modal onClose={onCancel} title={title}>
      <div className="confirm">
        <span className={`confirm-glyph${danger ? " confirm-glyph-danger" : ""}`}>
          <Icon name={danger ? "info" : "check"} />
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="button button-secondary" disabled={pending} onClick={onCancel} type="button">Cancel</button>
          <button aria-busy={pending} className={`button ${danger ? "button-danger" : "button-primary"}`} disabled={pending} onClick={onConfirm} type="button">
            {pending ? <><span className="loading-indicator" />Saving…</> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
