"use client";

import { Icon } from "@/components/ui/icon";
import { H4, Muted, Small } from "@/components/ui/typography";
import { CSVProfileResponse } from "@/lib/services/externalDataSourceService";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

interface DatasetOverviewProps {
  data: CSVProfileResponse;
}

export function DatasetOverview({ data }: DatasetOverviewProps) {
  const { t } = useTranslation("database");
  const { meta } = data;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Icon name="FileText" size="md" variant="primary" />
          <H4 className="text-lg">{t("profiler.sections.datasetOverview")}</H4>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1.5">
              <Icon name="Calendar" size="xs" variant="muted" />
              <Muted className="text-muted-foreground">
                {t("profiler.overview.generated")}
              </Muted>
            </div>
            <Small className="text-sm">
              {format(new Date(meta.generated_at), "MM/dd/yyyy")}
            </Small>
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1.5">
              <Icon name="Database" size="xs" variant="muted" />
              <Muted className="text-muted-foreground">
                {t("profiler.overview.dimensions")}
              </Muted>
            </div>
            <Small className="text-sm">
              {meta.total_rows?.toLocaleString() ?? "-"} × {meta.columns ?? "-"}
            </Small>
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1.5">
              <Icon name="HardDrive" size="xs" variant="muted" />
              <Muted className="text-muted-foreground">
                {t("profiler.overview.fileSize")}
              </Muted>
            </div>
            <Small className="text-sm">
              {meta.file_size_mb?.toFixed(2) ?? "-"} MB
            </Small>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
