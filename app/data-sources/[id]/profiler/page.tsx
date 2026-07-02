"use client";
import { DataSourceProfilerModule } from "@/components/modules/DataSources/routes/Profiler";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";

const DataSourceProfilerPage = () => {
  return (
    <AdminOnlyRoute>
      <DataSourceProfilerModule />
    </AdminOnlyRoute>
  );
};

export default withPageAuthRequired(DataSourceProfilerPage);
