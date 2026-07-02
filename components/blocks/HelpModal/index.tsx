"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon, IconName } from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/client";
import { TFunction } from "i18next";
import {
  ChatMock,
  ContextMock,
  DataUploadMock,
  DataConnectionMock,
  DashboardMock,
  EmailReportMock,
  DataQualityMock,
} from "./mocks";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

type Tab = Readonly<{
  key: string;
  icon: IconName;
  Mock: React.FC<{ t: TFunction }>;
}>;

const TABS: ReadonlyArray<Tab> = [
  { key: "chat", icon: "MessagesSquare", Mock: ChatMock },
  { key: "context", icon: "BookOpen", Mock: ContextMock },
  { key: "dataUpload", icon: "Upload", Mock: DataUploadMock },
  { key: "dataConnection", icon: "Database", Mock: DataConnectionMock },
  { key: "dashboards", icon: "PieChart", Mock: DashboardMock },
  { key: "emailReports", icon: "Mail", Mock: EmailReportMock },
  { key: "dataQuality", icon: "ShieldCheck", Mock: DataQualityMock },
];

const HelpModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation("home");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("help.title")}</DialogTitle>
        </DialogHeader>
        <Tabs
          defaultValue="chat"
          orientation="vertical"
          className="flex min-h-[480px] gap-6"
        >
          <TabsList className="flex h-auto w-48 shrink-0 flex-col items-stretch justify-start gap-1 bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="justify-start gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 shadow-none data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <Icon name={tab.icon} size="sm" />
                {t(`help.tabs.${tab.key}.label`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="min-w-0 flex-1">
            {TABS.map(({ key, Mock }) => (
              <TabsContent key={key} value={key} className="mt-0">
                <div className="flex flex-col gap-2">
                  <p className="text-base font-semibold">
                    {t(`help.tabs.${key}.title`)}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(`help.tabs.${key}.description`)}
                  </p>
                  <Mock t={t} />
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
