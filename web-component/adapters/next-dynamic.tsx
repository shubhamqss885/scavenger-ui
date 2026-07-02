"use client";

// WEB-COMPONENT ADAPTER — permanent policy: `next/dynamic` (used by ChartChip to
// lazy-load AgenticChart) is shimmed to React.lazy + Suspense under Vite.
// Code-splitting behaviour is identical — the chart chunk still splits out.
// Only the loader form `dynamic(() => import(...), options)` is implemented,
// as that's the only form in the chat graph. Pinned via type-only import from
// `next/dynamic` so the shim can't drift from the real API.
import React, { Suspense, lazy } from "react";
import type nextDynamic from "next/dynamic";

type Loader = () => Promise<
  { default: React.ComponentType<any> } | React.ComponentType<any>
>;

type DynamicOptions = {
  ssr?: boolean;
  loading?: () => React.ReactNode;
};

const dynamic = (loader: Loader, options: DynamicOptions = {}) => {
  const LazyComponent = lazy(async () => {
    const mod = await loader();
    const Component = (mod as any).default ?? mod;
    return { default: Component as React.ComponentType<any> };
  });

  const Loading = options.loading;

  const DynamicComponent = (props: any) => (
    <Suspense fallback={Loading ? Loading() : null}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return DynamicComponent;
};

export default dynamic as typeof nextDynamic;
