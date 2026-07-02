import { useCallback, useRef } from "react";
import type { ConnectorId } from "../config/connectorData";

const STORAGE_KEY_PREFIX = "connector_form_";

type StoredFormData = Record<string, string>;

/**
 * Hook to persist connector form values (except password) in sessionStorage.
 * Values persist until the data source is successfully created.
 */
export const useConnectorFormStorage = (connectorId: ConnectorId) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${connectorId}`;
  const isInitializedRef = useRef(false);

  /**
   * Get stored form values from sessionStorage
   */
  const getStoredValues = useCallback((): StoredFormData | null => {
    if (typeof window === "undefined") return null;

    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as StoredFormData) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  /**
   * Save form values to sessionStorage (excludes password fields)
   */
  const saveValues = useCallback(
    (
      values: Record<string, string>,
      passwordFields: string[] = ["password"],
    ) => {
      if (typeof window === "undefined") return;

      try {
        // Filter out password fields
        const filteredValues = Object.fromEntries(
          Object.entries(values).filter(
            ([key]) => !passwordFields.includes(key),
          ),
        );
        sessionStorage.setItem(storageKey, JSON.stringify(filteredValues));
      } catch {
        // Ignore storage errors
      }
    },
    [storageKey],
  );

  /**
   * Clear stored values (call when data source is successfully created)
   */
  const clearStorage = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  /**
   * Clear all connector form storage
   */
  const clearAllConnectorStorage = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);

        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    getStoredValues,
    saveValues,
    clearStorage,
    clearAllConnectorStorage,
    isInitializedRef,
  };
};
