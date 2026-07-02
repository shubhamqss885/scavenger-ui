"use client";
import { redirect } from "next/navigation";
import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";

const DataSourcePage = ({ params }: { params: { id: string } }) => {
  return (
    <AdminOnlyRoute>
      {redirect(`/data-sources/${params.id}/data`)}
    </AdminOnlyRoute>
  );
};

export default withPageAuthRequired(DataSourcePage);
