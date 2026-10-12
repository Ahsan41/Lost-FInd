"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { adminApi, getAdminErrorMessage, type AdminClaim, type AdminOverviewData } from "@/lib/admin-api";
import type { AdminFoundItem, AdminItemStatus, ClaimRequest, ClaimStatus } from "@/types/item";

function withoutLinkedItem(claim: AdminClaim): ClaimRequest {
  return {
    id: claim.id,
    itemId: claim.itemId,
    claimant: claim.claimant,
    lostItemDescription: claim.lostItemDescription,
    ownershipProof: claim.ownershipProof,
    ...(claim.supportingImage ? { supportingImage: claim.supportingImage } : {}),
    submittedAt: claim.submittedAt,
    status: claim.status,
  };
}

interface AdminDataValue {
  foundItems: AdminFoundItem[];
  claims: ClaimRequest[];
  overview: AdminOverviewData;
  error: string | null;
  dismissError: () => void;
  setItemStatus: (itemId: string, status: AdminItemStatus) => Promise<boolean>;
  markItemReturned: (itemId: string) => Promise<boolean>;
  setClaimStatus: (claimId: string, status: ClaimStatus) => Promise<boolean>;
}

const AdminDataContext = createContext<AdminDataValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [foundItems, setFoundItems] = useState<AdminFoundItem[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [items, claimResults, summary] = await Promise.all([
        adminApi.listItems(),
        adminApi.listClaims(),
        adminApi.overview(),
      ]);
      setFoundItems(items);
      setClaims(claimResults.map(withoutLinkedItem));
      setOverview(summary);
    } catch (loadFailure) {
      setLoadError(getAdminErrorMessage(loadFailure));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.listItems(), adminApi.listClaims(), adminApi.overview()]).then(
      ([items, claimResults, summary]) => {
        if (!active) return;
        setFoundItems(items);
        setClaims(claimResults.map(withoutLinkedItem));
        setOverview(summary);
        setLoading(false);
      },
      (loadFailure: unknown) => {
        if (!active) return;
        setLoadError(getAdminErrorMessage(loadFailure));
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const refreshOverview = useCallback(async () => {
    try {
      setOverview(await adminApi.overview());
    } catch (refreshFailure) {
      setError(getAdminErrorMessage(refreshFailure));
    }
  }, []);

  const refreshClaimsAndOverview = useCallback(async () => {
    try {
      const [claimResults, summary] = await Promise.all([
        adminApi.listClaims(),
        adminApi.overview(),
      ]);
      setClaims(claimResults.map(withoutLinkedItem));
      setOverview(summary);
    } catch (refreshFailure) {
      setError(getAdminErrorMessage(refreshFailure));
    }
  }, []);

  const setItemStatus = useCallback(async (itemId: string, status: AdminItemStatus) => {
    setError(null);
    try {
      const updated = await adminApi.updateItemStatus(itemId, status);
      setFoundItems((items) => items.map((item) => item.id === itemId ? updated : item));
      await refreshOverview();
      return true;
    } catch (failure) {
      setError(getAdminErrorMessage(failure));
      return false;
    }
  }, [refreshOverview]);

  const markItemReturned = useCallback(async (itemId: string) => {
    setError(null);
    try {
      const updated = await adminApi.markItemReturned(itemId);
      setFoundItems((items) => items.map((item) => item.id === itemId ? updated : item));
      await refreshClaimsAndOverview();
      return true;
    } catch (failure) {
      setError(getAdminErrorMessage(failure));
      return false;
    }
  }, [refreshClaimsAndOverview]);

  const setClaimStatus = useCallback(async (claimId: string, status: ClaimStatus) => {
    setError(null);
    try {
      const updated = await adminApi.updateClaimStatus(claimId, status);
      setClaims((currentClaims) =>
        currentClaims.map((currentClaim) =>
          currentClaim.id === claimId ? withoutLinkedItem(updated) : currentClaim,
        ),
      );
      await refreshClaimsAndOverview();
      return true;
    } catch (failure) {
      setError(getAdminErrorMessage(failure));
      return false;
    }
  }, [refreshClaimsAndOverview]);

  const dismissError = useCallback(() => setError(null), []);
  const retryLoadData = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    void loadData();
  }, [loadData]);

  if (loading) return <div className="admin-auth-state" role="status">Loading admin workspace…</div>;
  if (loadError || !overview) {
    return (
      <div className="admin-auth-state" role="alert">
        <p>{loadError ?? "The admin workspace could not be loaded."}</p>
        <button className="button button-primary" onClick={retryLoadData} type="button">Try again</button>
      </div>
    );
  }

  const value = {
    foundItems,
    claims,
    overview,
    error,
    dismissError,
    setItemStatus,
    markItemReturned,
    setClaimStatus,
  };

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error("useAdminData must be used within AdminDataProvider.");
  return context;
}
