import ErrorPage from "@/components/modules/Error";
import { Suspense } from "react";

export default function ErrorPageComponent() {
  return (
    <Suspense>
      <ErrorPage />
    </Suspense>
  );
}
