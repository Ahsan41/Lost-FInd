"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminFoundItems, claimRequests } from "@/data/admin-mock";
import type { AdminFoundItem, AdminItemStatus, ClaimRequest, ClaimStatus } from "@/types/item";

interface AdminDataValue {
  foundItems: AdminFoundItem[];
  claims: ClaimRequest[];
  setItemStatus: (itemId: string, status: AdminItemStatus) => void;
  markItemReturned: (itemId: string) => void;
  setClaimStatus: (claimId: string, status: ClaimStatus) => void;
}

const AdminDataContext = createContext<AdminDataValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [foundItems, setFoundItems] = useState(adminFoundItems);
  const [claims, setClaims] = useState(claimRequests);

  const setItemStatus = useCallback((itemId: string, status: AdminItemStatus) => {
    setFoundItems((items) =>
      items.map((item) => item.id === itemId ? { ...item, reviewStatus: status } : item),
    );
  }, []);

  const markItemReturned = useCallback((itemId: string) => {
    setFoundItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, reviewStatus: "Returned", status: "Reunited" }
          : item,
      ),
    );
  }, []);

  const setClaimStatus = useCallback((claimId: string, status: ClaimStatus) => {
    setClaims((currentClaims) =>
      currentClaims.map((claim) => claim.id === claimId ? { ...claim, status } : claim),
    );
  }, []);

  const value = useMemo(
    () => ({ foundItems, claims, setItemStatus, markItemReturned, setClaimStatus }),
    [claims, foundItems, markItemReturned, setClaimStatus, setItemStatus],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error("useAdminData must be used within AdminDataProvider.");
  return context;
}
