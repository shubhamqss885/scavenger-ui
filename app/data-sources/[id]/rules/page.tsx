"use client";
import { DataSourceRulesModule } from "@/components/modules/DataSources/routes/Rules";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";

const DataSourceRulesPage = ({ params }: { params: { id: string } }) => {
  return (
    <AdminOnlyRoute>
      <DataSourceRulesModule />
    </AdminOnlyRoute>
  );
};

export default withPageAuthRequired(DataSourceRulesPage);
