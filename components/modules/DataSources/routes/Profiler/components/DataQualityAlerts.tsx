"use client";

import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { DataQualityAlert } from "@/lib/services/externalDataSourceService";
import { useTranslation } from "@/lib/i18n/client";
import {
  sortAlertsBySeverity,
  getAlertSeverity,
  getSeverityColor,
  getAlertIcon,
  SEVERITY_STYLES,
} from "./alertUtils";

type DataQualityAlertsProps = Readonly<{
  alerts: DataQualityAlert[];
}>;

export const DataQualityAlerts = ({ alerts }: DataQualityAlertsProps) => {
  const sortedAlerts = sortAlertsBySeverity(alerts);

  return (
    <div className="space-y-3">
      {sortedAlerts.map((alert, index) => (
        <AlertCard
          key={`${alert.code}-${alert.column?.join("|") ?? "no-column"}-${alert.details?.count ?? "no-count"}-${alert.details?.pct ?? "no-pct"}-${index}`}
          alert={alert}
        />
      ))}
    </div>
  );
};

const AlertCard = ({ alert }: { alert: DataQualityAlert }) => {
  const { t } = useTranslation("database");
  const severity = getAlertSeverity(alert.code);
  const suggestionKey = `dataQuality.alerts.suggestions.${alert.code}`;
  const suggestion = t(suggestionKey);
  const hasSuggestion = suggestion !== suggestionKey;

  const getMessage = (): string => {
    const messageKey = `dataQuality.alerts.messages.${alert.code}`;
    const translatedMessage = t(messageKey, {
      column: alert.column?.join(", "),
      count: alert.details?.count ?? alert.column?.length,
      pct: alert.details?.pct?.toFixed(1),
    });

    return translatedMessage === messageKey
      ? t(`dataQuality.alerts.codes.${alert.code}`)
      : translatedMessage;
  };

  const hasDetails = alert.details && Object.keys(alert.details).length > 0;

  return (
    <div className={`rounded-lg border ${SEVERITY_STYLES[severity]}`}>
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex flex-1 items-start gap-3">
            <Icon
              name={getAlertIcon(alert.code) as any}
              size="sm"
              variant="warning"
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              {alert.column && alert.column.length > 0 && (
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {t("dataQuality.alerts.columnLabel")}
                  </span>
                  {alert.column.map((col, idx) => (
                    <Badge
                      key={`${alert.code}-${col}-${idx}`}
                      variant="outline"
                      className="py-0.25 border-foreground/30 px-2 font-mono text-xs"
                    >
                      {col}
                    </Badge>
                  ))}
                </div>
              )}
              <span className="mt-2 text-sm text-foreground">
                {getMessage()}
              </span>
            </div>
          </div>
          <Badge
            variant={getSeverityColor(alert.code) as any}
            className="text-xs"
          >
            {t(`dataQuality.alerts.codes.${alert.code}`)}
          </Badge>
        </div>

        {hasDetails && (
          <div className="ml-7">
            <AlertDetails details={alert.details!} code={alert.code} />
          </div>
        )}

        {hasSuggestion && (
          <div className="ml-6 mt-3">
            <div className="flex items-start gap-0.5">
              <Icon
                name="Lightbulb"
                size="xs"
                className="mt-px text-amber-500"
              />
              <span className="text-xs italic text-muted-foreground">
                {suggestion}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AlertDetails = ({
  details,
  code,
}: {
  details: NonNullable<DataQualityAlert["details"]>;
  code: DataQualityAlert["code"];
}) => {
  const { t } = useTranslation("database");
  const countSuffix = t(`dataQuality.alerts.suffixes.${code}.count`);
  const pctSuffix = t(`dataQuality.alerts.suffixes.${code}.pct`);

  return (
    <div className="flex flex-col gap-1">
      {details.unique_value !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {t("dataQuality.alerts.uniqueValue")}
          </span>
          <Badge variant="outline" className="font-mono text-xs">
            {details.unique_value}
          </Badge>
        </div>
      )}
      {details.count !== undefined && (
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {details.count.toLocaleString()}
          </span>{" "}
          {countSuffix}
        </span>
      )}
      {details.pct !== undefined && (
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {details.pct.toFixed(2)}%
          </span>{" "}
          {pctSuffix}
        </span>
      )}
      {details.parsable_numeric_pct !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {t("dataQuality.alerts.parsableNumeric")}
          </span>
          <span className="text-sm font-medium text-foreground">
            {details.parsable_numeric_pct.toFixed(1)}%
          </span>
        </div>
      )}
      {details.invalid_examples && details.invalid_examples.length > 0 && (
        <div>
          <span className="mb-1 block text-xs text-muted-foreground">
            {t("dataQuality.alerts.invalidExamples")}
          </span>
          <div className="flex flex-wrap gap-1">
            {details.invalid_examples.map((example, i) => (
              <Badge
                key={`${code}-invalid-example-${example}-${i}`}
                variant="secondary"
                className="font-mono text-xs"
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {details.patterns && details.patterns.length > 0 && (
        <div>
          <span className="mb-1 block text-xs text-muted-foreground">
            {t("dataQuality.alerts.patternsDetected")}
          </span>
          <div className="space-y-1">
            {details.patterns.map((pattern, i) => {
              const patternDetails = [
                { key: "currency", value: pattern.currency },
                { key: "thousands", value: pattern.thousands },
                { key: "decimal", value: pattern.decimal },
              ].filter((p) => p.value);

              return (
                <div
                  key={`${code}-pattern-${pattern.example}-${pattern.currency ?? "no-currency"}-${pattern.thousands ?? "no-thousands"}-${pattern.decimal ?? "no-decimal"}-${i}`}
                  className="flex items-center gap-2"
                >
                  <Badge variant="outline" className="font-mono text-xs">
                    {pattern.example}
                  </Badge>
                  {patternDetails.map(({ key, value }) => (
                    <span key={key} className="text-xs text-muted-foreground">
                      {t(`dataQuality.alerts.${key}`, { value })}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
