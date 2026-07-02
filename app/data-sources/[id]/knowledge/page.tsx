"use client";

import { DataSourceKnowledgeModule } from "@/components/modules/DataSources/routes/Knowledge";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DataSourceKnowledgePage = ({ params }: { params: { id: string } }) => {
  const { isFeatureEnabled, FEATURE_FLAGS, isLoading } = useOrgFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isFeatureEnabled(FEATURE_FLAGS.KNOWLEDGE_TAB)) {
      router.replace(`/data-sources/${params.id}/data`);
    }
  }, [isLoading, isFeatureEnabled, FEATURE_FLAGS, params.id, router]);

  return (
    <AdminOnlyRoute>
      <DataSourceKnowledgeModule />
    </AdminOnlyRoute>
  );
};

export default withPageAuthRequired(DataSourceKnowledgePage);
