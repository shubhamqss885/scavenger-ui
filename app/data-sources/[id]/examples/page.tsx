"use client";
import { DataSourceExamplesModule } from "@/components/modules/DataSources/routes/Examples";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";

const DataSourceExamplesPage = ({ params }: { params: { id: string } }) => {
  return (
    <AdminOnlyRoute>
      <DataSourceExamplesModule />
    </AdminOnlyRoute>
  );
};

export default withPageAuthRequired(DataSourceExamplesPage);
