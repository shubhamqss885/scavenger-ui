import { useState } from "react";
import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { useTranslation } from "@/lib/i18n/client";
import { DeleteConfirmationAlert } from "@/components/modules/DataSources/components/DeleteConfirmationAlert";
import { RulesExamplesHeader } from "@/components/modules/DataSources/components/RulesExamplesHeader";
import { RulesExamplesList } from "@/components/modules/DataSources/components/RulesExamplesList";
import { ExampleCard } from "./ExampleCard";
import { ExampleFormModal } from "./ExampleFormModal";
import { OrgDbExample } from "@/lib/services/organizationDbService";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = Readonly<{
  readOnly?: boolean;
}>;

export const DatabaseExamplesContent = ({ readOnly }: Props) => {
  const { t } = useTranslation("database");
  const { examples, deleteExample, updateExample, validateExample } =
    useOrgDbConfig();

  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exampleToDelete, setExampleToDelete] = useState<number | null>(null);

  const handleAddExample = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEditExample = (example: OrgDbExample, index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleDeleteExample = (index: number) => {
    setExampleToDelete(index);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (exampleToDelete !== null) {
      await deleteExample(exampleToDelete);
      setDeleteDialogOpen(false);
      setExampleToDelete(null);
    }
  };

  const handleToggleExampleActive = async (
    index: number,
    active: boolean,
    example: OrgDbExample,
  ) => {
    await updateExample(index, {
      title: example.title,
      category: example.category,
      example: example.example,
      is_active: active,
    });
  };

  return (
    <>
      <RulesExamplesHeader
        variant="examples"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyActive={showOnlyActive}
        onToggleActiveFilter={setShowOnlyActive}
        onAdd={handleAddExample}
        readOnly={readOnly}
      />

      <ScrollArea className="h-full w-full px-6">
        <div className="mx-auto max-w-7xl">
          <RulesExamplesList
            variant="examples"
            items={examples}
            searchQuery={searchQuery}
            showOnlyActive={showOnlyActive}
            onEdit={handleEditExample}
            onDelete={handleDeleteExample}
            onToggleActive={handleToggleExampleActive}
            onAdd={handleAddExample}
            onValidate={validateExample}
            readOnly={readOnly}
            renderCard={(example, index, props) => (
              <ExampleCard
                key={`example-${example.orgdb_example_id}`}
                example={example}
                index={index}
                onEdit={props.onEdit}
                onDelete={props.onDelete}
                onToggleActive={props.onToggleActive}
                onValidate={props.onValidate}
                isLast={props.isLast}
                readOnly={readOnly}
              />
            )}
            getSearchableContent={(example) => example.example}
          />
        </div>
      </ScrollArea>

      <ExampleFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingIndex={editingIndex}
      />

      <DeleteConfirmationAlert
        title={t("queryExamples.delete.title") || "Delete Example"}
        description={
          t("queryExamples.delete.description") ||
          "Are you sure you want to delete this example? This action cannot be undone."
        }
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </>
  );
};
