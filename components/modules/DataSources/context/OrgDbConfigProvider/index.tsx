"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  getOrgDbRules,
  createOrgDbRule,
  updateOrgDbRule,
  deleteOrgDbRule,
  getOrgDbExamples,
  createOrgDbExample,
  updateOrgDbExample,
  deleteOrgDbExample,
  validateSqlExample,
  OrgDbRule,
  OrgDbExample,
  OrgDbRuleParams,
  OrgDbExampleParams,
  ValidateSqlExampleResponse,
} from "@/lib/services/organizationDbService";
import { vaultSync } from "@/lib/services/vaultService";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/client";
import Link from "next/link";

type OrgDbConfigState = Readonly<{
  rules: OrgDbRule[];
  examples: OrgDbExample[];
  loading: boolean;
  error: string | null;
  toggleLoading: Record<string, boolean>;
}>;

interface OrgDbConfigContextType extends OrgDbConfigState {
  // Core
  fetchConfig: () => Promise<void>;
  refreshConfig: () => Promise<void>;

  // Rules management (works with array indices)
  addRule: (rule: {
    title: string;
    category: string;
    rule: string;
  }) => Promise<void>;
  updateRule: (
    index: number,
    rule: { title: string; category: string; rule: string; is_active: boolean },
  ) => Promise<void>;
  deleteRule: (index: number) => Promise<void>;

  // Examples management
  addExample: (example: {
    title: string;
    category: string;
    example: string;
  }) => Promise<void>;
  updateExample: (
    index: number,
    example: {
      title: string;
      category: string;
      example: string;
      is_active: boolean;
    },
  ) => Promise<void>;
  deleteExample: (index: number) => Promise<void>;
  validateExample: (
    exampleQuery: string,
  ) => Promise<ValidateSqlExampleResponse>;

  // Vault sync — increments after each successful sync
  syncVersion: number;
}

const OrgDbConfigContext = createContext<OrgDbConfigContextType | undefined>(
  undefined,
);

export const useOrgDbConfig = () => {
  const context = useContext(OrgDbConfigContext);

  if (!context) {
    throw new Error("useOrgDbConfig must be used within OrgDbConfigProvider");
  }
  return context;
};

type OrgDbConfigProviderProps = Readonly<{
  children: React.ReactNode;
  databaseId: string;
}>;

export function OrgDbConfigProvider({
  children,
  databaseId,
}: OrgDbConfigProviderProps) {
  const { t } = useTranslation("database");
  const [rules, setRules] = useState<OrgDbRule[]>([]);
  const [examples, setExamples] = useState<OrgDbExample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [syncVersion, setSyncVersion] = useState(0);

  // Fetch both rules and examples in parallel
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesData, examplesData] = await Promise.all([
        getOrgDbRules(databaseId),
        getOrgDbExamples(databaseId),
      ]);
      setRules(rulesData);
      setExamples(examplesData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch config";
      setError(message);
      toast.error(t("configErrors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [databaseId]);

  // Refresh config (alias for fetchConfig for clarity)
  const refreshConfig = fetchConfig;

  // Rules management
  const addRule = useCallback(
    async (rule: { title: string; category: string; rule: string }) => {
      // Create optimistic rule with temporary ID
      const tempId = `temp-${Date.now()}`;
      const optimisticRule = {
        orgdb_rule_id: tempId,
        orgdb_id: databaseId,
        category: rule.category,
        title: rule.title,
        rule: rule.rule,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update - add to UI immediately
      setRules((prev) => [...prev, optimisticRule]);

      try {
        const newRuleData: OrgDbRuleParams = {
          category: rule.category,
          title: rule.title,
          rule: rule.rule,
          is_active: true,
        };
        const newRule = await createOrgDbRule(databaseId, newRuleData);
        // Replace optimistic rule with real API data
        setRules((prev) =>
          prev.map((r) =>
            r.orgdb_rule_id === optimisticRule.orgdb_rule_id ? newRule : r,
          ),
        );
        vaultSync(databaseId)
          .then(() => setSyncVersion((v) => v + 1))
          .catch(() => {});
      } catch (err) {
        // Remove optimistic rule on error
        setRules((prev) =>
          prev.filter((r) => r.orgdb_rule_id !== optimisticRule.orgdb_rule_id),
        );
        toast.error(t("businessRules.errors.createFailed"));
        throw err;
      }
    },
    [databaseId],
  );

  const updateRule = useCallback(
    async (
      index: number,
      rule: {
        title: string;
        category: string;
        rule: string;
        is_active?: boolean;
      },
    ) => {
      if (index < 0 || index >= rules.length) return;

      const ruleToUpdate = rules[index];

      // Check if this is a toggle operation (only is_active is changing)
      const isToggleOperation =
        rule.title === ruleToUpdate.title &&
        rule.category === ruleToUpdate.category &&
        rule.rule === ruleToUpdate.rule &&
        rule.is_active !== ruleToUpdate.is_active;

      const ruleId = ruleToUpdate.orgdb_rule_id;

      // Set loading state for toggle operations
      if (isToggleOperation) {
        setToggleLoading((prev) => ({ ...prev, [ruleId]: true }));
      }

      // Optimistic update - update UI immediately
      const optimisticRule = {
        ...ruleToUpdate,
        title: rule.title,
        category: rule.category,
        rule: rule.rule,
        is_active: rule.is_active ?? ruleToUpdate.is_active,
      };
      setRules((prev) =>
        prev.map((r, i) => (i === index ? optimisticRule : r)),
      );

      try {
        const updatedRuleData: OrgDbRuleParams = {
          category: rule.category,
          title: rule.title,
          rule: rule.rule,
          is_active: rule.is_active ?? true,
        };
        const updatedRule = await updateOrgDbRule(
          ruleToUpdate.orgdb_rule_id,
          updatedRuleData,
        );
        // Update with real data from API
        setRules((prev) => prev.map((r, i) => (i === index ? updatedRule : r)));
        vaultSync(databaseId)
          .then(() => setSyncVersion((v) => v + 1))
          .catch(() => {});
      } catch (err) {
        // Revert optimistic update on error
        setRules((prev) =>
          prev.map((r, i) => (i === index ? ruleToUpdate : r)),
        );
        toast.error(t("businessRules.errors.updateFailed"));
        throw err;
      } finally {
        // Clear loading state for toggle operations
        if (isToggleOperation) {
          setToggleLoading((prev) => ({ ...prev, [ruleId]: false }));
        }
      }
    },
    [rules, setToggleLoading, databaseId],
  );

  const deleteRule = useCallback(
    async (index: number) => {
      if (index < 0 || index >= rules.length) return;

      const ruleToDelete = rules[index];
      // Optimistic update - remove from UI immediately
      setRules((prev) => prev.filter((_, i) => i !== index));

      try {
        await deleteOrgDbRule(ruleToDelete.orgdb_rule_id);
        vaultSync(databaseId)
          .then(() => setSyncVersion((v) => v + 1))
          .catch(() => {});
      } catch (err) {
        // Revert optimistic update on error - restore the deleted rule
        setRules((prev) => {
          const newRules = [...prev];
          newRules.splice(index, 0, ruleToDelete);
          return newRules;
        });
        toast.error(t("businessRules.errors.deleteFailed"));
        throw err;
      }
    },
    [rules, databaseId],
  );

  // Examples management
  const addExample = useCallback(
    async (example: { title: string; category: string; example: string }) => {
      // Create optimistic example with temporary ID
      const tempId = `temp-${Date.now()}`;
      const optimisticExample = {
        orgdb_example_id: tempId,
        orgdb_id: databaseId,
        category: example.category,
        title: example.title,
        example: example.example,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update - add to UI immediately
      setExamples((prev) => [...prev, optimisticExample]);

      try {
        const newExampleData: OrgDbExampleParams = {
          category: example.category,
          title: example.title,
          example: example.example,
          is_active: true,
        };
        const newExample = await createOrgDbExample(databaseId, newExampleData);
        // Replace optimistic example with real API data
        setExamples((prev) =>
          prev.map((e) =>
            e.orgdb_example_id === optimisticExample.orgdb_example_id
              ? newExample
              : e,
          ),
        );
        vaultSync(databaseId)
          .then(() => setSyncVersion((v) => v + 1))
          .catch(() => {});
        const toastId = toast.success(t("queryExamples.messages.created"), {
          description: (
            <Link
              href={`/data-sources/${databaseId}/examples#${newExample.orgdb_example_id}`}
              className="font-medium text-primary underline hover:text-primary"
              onClick={() => toast.dismiss(toastId)}
            >
              {t("queryExamples.messages.seeAllExamples")}
            </Link>
          ),
        });
      } catch (err) {
        // Remove optimistic example on error
        setExamples((prev) =>
          prev.filter(
            (e) => e.orgdb_example_id !== optimisticExample.orgdb_example_id,
          ),
        );
        toast.error(t("queryExamples.errors.createFailed"));
        throw err;
      }
    },
    [databaseId],
  );

  const updateExample = useCallback(
    async (
      index: number,
      example: {
        title: string;
        category: string;
        example: string;
        is_active: boolean;
      },
    ) => {
      if (index < 0 || index >= examples.length) return;

      const exampleToUpdate = examples[index];

      // Check if this is a toggle operation (only is_active is changing)
      const isToggleOperation =
        example.title === exampleToUpdate.title &&
        example.category === exampleToUpdate.category &&
        example.example === exampleToUpdate.example &&
        example.is_active !== exampleToUpdate.is_active;

      const exampleId = exampleToUpdate.orgdb_example_id;

      // Set loading state for toggle operations
      if (isToggleOperation) {
        setToggleLoading((prev) => ({ ...prev, [exampleId]: true }));
      }

      // Optimistic update - update UI immediately
      const optimisticExample = {
        ...exampleToUpdate,
        title: example.title,
        category: example.category,
        example: example.example,
        is_active: example.is_active,
      };
      setExamples((prev) =>
        prev.map((e, i) => (i === index ? optimisticExample : e)),
      );

      try {
        const updatedExampleData: OrgDbExampleParams = {
          category: example.category,
          title: example.title,
          example: example.example,
          is_active: example.is_active,
        };
        const updatedExample = await updateOrgDbExample(
          exampleToUpdate.orgdb_example_id,
          updatedExampleData,
        );
        // Update with real data from API
        setExamples((prev) =>
          prev.map((e, i) => (i === index ? updatedExample : e)),
        );
        vaultSync(databaseId)
          .then(() => setSyncVersion((v) => v + 1))
          .catch(() => {});
      } catch (err) {
        // Revert optimistic update on error
        setExamples((prev) =>
          prev.map((e, i) => (i === index ? exampleToUpdate : e)),
        );
        toast.error(t("queryExamples.errors.updateFailed"));
        throw err;
      } finally {
        // Clear loading state for toggle operations
        if (isToggleOperation) {
          setToggleLoading((prev) => ({ ...prev, [exampleId]: false }));
        }
      }
    },
    [examples, setToggleLoading, databaseId],
  );

  const deleteExample = useCallback(
    async (index: number) => {
      if (index < 0 || index >= examples.length) return;

      const exampleToDelete = examples[index];
      // Optimistic update - remove from UI immediately
      setExamples((prev) => prev.filter((_, i) => i !== index));

      try {
        await deleteOrgDbExample(exampleToDelete.orgdb_example_id);
        vaultSync(databaseId)
          .then(() => setSyncVersion((v) => v + 1))
          .catch(() => {});
      } catch (err) {
        // Revert optimistic update on error - restore the deleted example
        setExamples((prev) => {
          const newExamples = [...prev];
          newExamples.splice(index, 0, exampleToDelete);
          return newExamples;
        });
        toast.error(t("queryExamples.errors.deleteFailed"));
        throw err;
      }
    },
    [examples, databaseId],
  );

  // Validate SQL example
  const validateExample = useCallback(
    async (exampleQuery: string): Promise<ValidateSqlExampleResponse> => {
      try {
        const result = await validateSqlExample(databaseId, exampleQuery);

        if (result.valid) {
          toast.success(t("queryExamples.validation.success"));
        } else {
          toast.error(
            result.error_message || t("queryExamples.validation.failed"),
          );
        }
        return result;
      } catch (err) {
        toast.error(t("queryExamples.validation.error"));
        throw err;
      }
    },
    [databaseId],
  );

  // Fetch config on mount
  useEffect(() => {
    if (databaseId) {
      fetchConfig();
    }
  }, [databaseId, fetchConfig]);

  const value: OrgDbConfigContextType = useMemo(
    () => ({
      rules,
      examples,
      loading,
      error,
      toggleLoading,
      fetchConfig,
      refreshConfig,
      addRule,
      updateRule,
      deleteRule,
      addExample,
      updateExample,
      deleteExample,
      validateExample,
      syncVersion,
    }),
    [
      rules,
      examples,
      loading,
      error,
      toggleLoading,
      fetchConfig,
      refreshConfig,
      addRule,
      updateRule,
      deleteRule,
      addExample,
      updateExample,
      deleteExample,
      validateExample,
      syncVersion,
    ],
  );

  return (
    <OrgDbConfigContext.Provider value={value}>
      {children}
    </OrgDbConfigContext.Provider>
  );
}
