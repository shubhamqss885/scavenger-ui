import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { H4, P } from "@/components/ui/typography";
import { format } from "sql-formatter";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ValidateSqlExampleResponse,
  OrgDbExample,
} from "@/lib/services/organizationDbService";
import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";

type ExampleCardProps = {
  example: OrgDbExample;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleActive: (index: number, active: boolean) => void;
  onValidate?: (example: string) => Promise<ValidateSqlExampleResponse>;
  isLast?: boolean;
  readOnly?: boolean;
};

export const ExampleCard = ({
  example,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  onValidate,
  isLast,
  readOnly,
}: ExampleCardProps) => {
  const { t } = useTranslation("database");
  const { toggleLoading } = useOrgDbConfig();
  const { isFeatureEnabled, FEATURE_FLAGS } = useOrgFeatures();
  const canEdit = isFeatureEnabled(FEATURE_FLAGS.EDIT_DATASOURCES) && !readOnly;
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error_message: string | null;
  } | null>(null);
  const { example: exampleSql } = example;

  const isToggleLoading = toggleLoading[example.orgdb_example_id] || false;

  const formattedSql = useMemo(() => {
    if (!exampleSql) return "";
    try {
      return format(exampleSql, {
        language: "mysql",
        keywordCase: "upper",
        indentStyle: "standard",
        tabWidth: 2,
        expressionWidth: 1000,
      });
    } catch {
      return exampleSql; // Fallback to raw SQL if formatting fails
    }
  }, [exampleSql]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exampleSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = async () => {
    if (!onValidate || !exampleSql) return;

    setValidating(true);
    setValidationResult(null);
    try {
      const result = await onValidate(exampleSql);
      setValidationResult(result);
    } catch (err) {
      console.error(err);
      setValidationResult({
        valid: false,
        error_message: t("queryExamples.validation.error"),
      });
    } finally {
      setValidating(false);
    }
  };

  const getValidationIcon = () => {
    if (validating) {
      return <Icon name="Loader2" size="xs" className="mr-1 animate-spin" />;
    }

    if (validationResult?.valid === true) {
      return (
        <Icon name="CheckCircle" size="xs" className="mr-1 text-green-600" />
      );
    }

    if (validationResult?.valid === false) {
      return <Icon name="X" size="xs" className="mr-1 text-red-600" />;
    }

    return <Icon name="Check" size="xs" className="mr-1" />;
  };

  return (
    <Card
      id={example.orgdb_example_id}
      className={cn(
        "mb-4 rounded-lg border-none shadow-none",
        isLast && "mb-0",
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between rounded-t-lg bg-slate-50 px-4 py-2">
          <div className="flex flex-col">
            <H4 className="text-sm font-medium">
              {example.title ||
                `${t("queryExamples.labels.example")} ${index + 1}`}
            </H4>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center space-x-2",
                (isToggleLoading || !canEdit) && "pointer-events-none",
              )}
            >
              <Switch
                checked={example.is_active}
                onCheckedChange={(checked) => onToggleActive(index, checked)}
                id={`example-active-${index}`}
                disabled={isToggleLoading || !canEdit}
                className={cn((isToggleLoading || !canEdit) && "opacity-50")}
              />
              <Label
                htmlFor={`example-active-${index}`}
                className={cn(
                  "cursor-pointer text-xs text-muted-foreground",
                  (isToggleLoading || !canEdit) && "opacity-50",
                )}
              >
                {example.is_active
                  ? t("common.active") || "Active"
                  : t("common.inactive") || "Inactive"}
              </Label>
            </div>
            {canEdit && (
              <>
                {onValidate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleValidate}
                    className="h-8 px-3"
                    disabled={validating || !exampleSql}
                  >
                    {getValidationIcon()}
                    {t("queryExamples.actions.validate")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(index)}
                  className="h-8 px-3"
                >
                  <Icon name="Edit" size="xs" className="mr-1" />
                  {t("queryExamples.actions.edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(index)}
                  className="h-8 px-3 text-destructive hover:text-destructive"
                >
                  <Icon
                    name="Trash2"
                    size="xs"
                    className="mr-1"
                    variant="destructive"
                  />
                  {t("queryExamples.actions.remove")}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="p-4 pt-2">
          {exampleSql && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <P className="text-xs text-muted-foreground [&:first-child]:mt-0">
                  {t("queryExamples.labels.sqlQuery")}
                </P>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <Icon name="Check" size="xs" />
                  ) : (
                    <Icon name="Copy" size="xs" />
                  )}
                </Button>
              </div>
              <div className="rounded-md bg-gray-100 p-3">
                <SyntaxHighlighter
                  language="sql"
                  style={coy}
                  customStyle={{
                    backgroundColor: "transparent",
                    margin: 0,
                    padding: 0,
                  }}
                  wrapLines={true}
                  wrapLongLines={true}
                  codeTagProps={{
                    style: { fontFamily: "monospace", fontSize: "12px" },
                  }}
                >
                  {formattedSql}
                </SyntaxHighlighter>
              </div>
              {validationResult && (
                <div
                  className={`rounded p-2 text-sm ${
                    validationResult.valid
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {validationResult.valid
                    ? t("queryExamples.validation.valid")
                    : validationResult.error_message ||
                      t("queryExamples.validation.invalid")}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
