"use client";

import { DatabaseDescriptionProvider } from "@/components/modules/DataSources/context/DatabaseDescriptionProvider";
import { OrgDbConfigProvider } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { DataSourceHeader } from "@/components/modules/DataSources/components/DataSourceHeader";

type DataSourceLayoutProps = Readonly<{
  children: React.ReactNode;
  params: {
    id: string;
  };
}>;

export default function DataSourceLayout({
  children,
  params,
}: DataSourceLayoutProps) {
  return (
    <DatabaseDescriptionProvider databaseId={params.id}>
      <OrgDbConfigProvider databaseId={params.id}>
        {/* Outer: Page-level horizontal scroll container */}
        <div className="h-full w-full overflow-x-auto">
          {/* Inner: w-max sizes to tabs width (content is absolute, doesn't contribute) */}
          <div className="flex min-h-full w-max min-w-full flex-col">
            <DataSourceHeader />
            {/* Spacer: Takes remaining height, provides positioning context */}
            <div className="relative flex-1">
              {/* Content: Absolute removes from flow, doesn't affect w-max calculation */}
              <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
                {children}
              </div>
            </div>
          </div>
        </div>
      </OrgDbConfigProvider>
    </DatabaseDescriptionProvider>
  );
}
