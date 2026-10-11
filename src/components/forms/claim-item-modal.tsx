"use client";

import type { FoundItem } from "@/types/item";
import { ClaimItemForm } from "@/components/forms/claim-item-form";
import { Modal } from "@/components/ui/modal";

interface ClaimItemModalProps {
  item: FoundItem;
  onCancel: () => void;
  onDone: () => void;
}

export function ClaimItemModal({ item, onCancel, onDone }: ClaimItemModalProps) {
  return (
    <Modal onClose={onCancel} title={`Claim ${item.name}`}>
      <ClaimItemForm item={item} onCancel={onCancel} onDone={onDone} />
    </Modal>
  );
}
