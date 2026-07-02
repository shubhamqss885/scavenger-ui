"use client";

import { useContext } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/client";
import { AxiosContext } from "@/lib/context/AuthContext";
import { FileUploadField } from "../credentials/FileUploadField";

export type SSHConfig = {
  enabled: boolean;
  host: string;
  port: string;
  user: string;
  privateKeyFile: string | null;
  privateKeyFileName: string | null;
  passphrase: string;
};

export const SSHTunnelSettings = ({
  config,
  onChange,
}: Readonly<{
  config: SSHConfig;
  onChange: (config: SSHConfig) => void;
}>) => {
  const { t } = useTranslation("connectors");
  const { token } = useContext(AxiosContext);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_100px] gap-2">
        <div>
          <Label className="mb-1.5 text-xs">
            {t("security.ssh.hostLabel")}
          </Label>
          <Input
            value={config.host}
            onChange={(e) => onChange({ ...config, host: e.target.value })}
            placeholder="bastion.example.com"
            className="rounded-lg"
          />
        </div>
        <div>
          <Label className="mb-1.5 text-xs">
            {t("security.ssh.portLabel")}
          </Label>
          <Input
            value={config.port}
            onChange={(e) => onChange({ ...config, port: e.target.value })}
            placeholder="22"
            className="rounded-lg"
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 text-xs">{t("security.ssh.userLabel")}</Label>
        <Input
          value={config.user}
          onChange={(e) => onChange({ ...config, user: e.target.value })}
          placeholder="ubuntu"
          className="rounded-lg"
        />
      </div>

      <FileUploadField
        label={t("security.ssh.keyLabel")}
        displayName={config.privateKeyFileName}
        accept=".pem,.key,.ppk"
        uploadLabel={t("security.ssh.keyUploadLabel")}
        token={token ?? undefined}
        onUpload={(fileId, _pem, fileName) =>
          onChange({
            ...config,
            privateKeyFile: fileId,
            privateKeyFileName: fileName,
          })
        }
        onClear={() =>
          onChange({
            ...config,
            privateKeyFile: null,
            privateKeyFileName: null,
          })
        }
      />

      <div>
        <Label className="mb-1.5 text-xs">
          {t("security.ssh.passphraseLabel")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("security.ssh.passphraseOptional")}
          </span>
        </Label>
        <Input
          type="password"
          value={config.passphrase}
          onChange={(e) => onChange({ ...config, passphrase: e.target.value })}
          placeholder="Key passphrase"
          className="rounded-lg"
        />
      </div>
    </div>
  );
};
