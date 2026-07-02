"use client";
import { DataSourceDataModule } from "@/components/modules/DataSources/routes/Data";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";

const DataSourceDataPage = () => {
  return (
    <AdminOnlyRoute>
      <DataSourceDataModule />
    </AdminOnlyRoute>
  );
};

export default withPageAuthRequired(DataSourceDataPage);
