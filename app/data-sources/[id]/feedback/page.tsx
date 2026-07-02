"use client";

import { DataSourceFeedbackModule } from "@/components/modules/DataSources/routes/Feedback";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";

const DataSourceFeedbackPage = () => {
  return (
    <AdminOnlyRoute flag="VIEW_FEEDBACK">
      <DataSourceFeedbackModule />
    </AdminOnlyRoute>
  );
};

export default withPageAuthRequired(DataSourceFeedbackPage);
