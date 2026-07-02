"use client";

import { useContext } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/client";
import { AxiosContext } from "@/lib/context/AuthContext";
import { FileUploadField } from "../credentials/FileUploadField";
import { Icon } from "@/components/ui/icon";

export type SSLConfig = {
  enabled: boolean;
  mode: "require" | "verify-ca" | "verify-full";
  caFileId: string | null;
  caPem: string | null;
  caFileName: string | null;
  certFileId: string | null;
  certPem: string | null;
  certFileName: string | null;
  keyFileId: string | null;
  keyFileName: string | null;
};

export const SSLSettings = ({
  config,
  onChange,
  dbType,
}: Readonly<{
  config: SSLConfig;
  onChange: (config: SSLConfig) => void;
  dbType?: string;
}>) => {
  const { t } = useTranslation("connectors");
  const { token } = useContext(AxiosContext);

  const showMssqlCaWarning =
    dbType === "mssql" &&
    (config.mode === "verify-ca" || config.mode === "verify-full");

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 text-xs">{t("security.ssl.modeLabel")}</Label>
        <Select
          value={config.mode}
          onValueChange={(v) =>
            onChange({ ...config, mode: v as SSLConfig["mode"] })
          }
        >
          <SelectTrigger className="rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="require">
              {t("security.ssl.modes.require")}
            </SelectItem>
            <SelectItem value="verify-ca">
              {t("security.ssl.modes.verify-ca")}
            </SelectItem>
            <SelectItem value="verify-full">
              {t("security.ssl.modes.verify-full")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showMssqlCaWarning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <Icon name="TriangleAlert" size="xs" className="mt-0.5 shrink-0" />
          <span>{t("security.ssl.mssqlCaWarning")}</span>
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
        <div className="space-y-1">
          <FileUploadField
            label={t("security.ssl.caLabel")}
            uploadLabel={t("security.ssl.caUploadLabel")}
            displayName={config.caFileName}
            certType="ca"
            token={token ?? undefined}
            onUpload={(fileId, pem, name) =>
              onChange({
                ...config,
                caFileId: fileId,
                caPem: pem,
                caFileName: name,
              })
            }
            onClear={() =>
              onChange({
                ...config,
                caFileId: null,
                caPem: null,
                caFileName: null,
              })
            }
          />
          <p className="text-[11px] text-muted-foreground">
            {t("security.ssl.caHint")}
          </p>
        </div>
        <div className="space-y-1">
          <FileUploadField
            label={t("security.ssl.certLabel")}
            uploadLabel={t("security.ssl.certUploadLabel")}
            displayName={config.certFileName}
            certType="client-cert"
            token={token ?? undefined}
            onUpload={(fileId, pem, name) =>
              onChange({
                ...config,
                certFileId: fileId,
                certPem: pem,
                certFileName: name,
              })
            }
            onClear={() =>
              onChange({
                ...config,
                certFileId: null,
                certPem: null,
                certFileName: null,
              })
            }
          />
          <p className="text-[11px] text-muted-foreground">
            {t("security.ssl.certHint")}
          </p>
        </div>
        <div className="space-y-1">
          <FileUploadField
            label={t("security.ssl.keyLabel")}
            uploadLabel={t("security.ssl.keyUploadLabel")}
            displayName={config.keyFileName}
            certType="client-key"
            token={token ?? undefined}
            onUpload={(fileId, _pem, name) =>
              onChange({
                ...config,
                keyFileId: fileId,
                keyFileName: name,
              })
            }
            onClear={() =>
              onChange({
                ...config,
                keyFileId: null,
                keyFileName: null,
              })
            }
          />
          <p className="text-[11px] text-muted-foreground">
            {t("security.ssl.keyHint")}
          </p>
        </div>
      </div>
    </div>
  );
};
