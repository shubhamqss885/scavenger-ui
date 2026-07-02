import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useOrgDbConfig } from "@/components/modules/DataSources/context/OrgDbConfigProvider";
import { useTranslation } from "@/lib/i18n/client";

interface ExampleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIndex?: number | null;
  initialValues?: {
    title?: string;
    category?: string;
    example?: string;
  } | null;
  headerText?: string;
  primaryButtonText?: string;
}

export const ExampleFormModal = ({
  open,
  onOpenChange,
  editingIndex,
  initialValues,
  headerText,
  primaryButtonText,
}: ExampleFormModalProps) => {
  const { t } = useTranslation("database");
  const { examples, addExample, updateExample, validateExample } =
    useOrgDbConfig();

  const editingExample =
    editingIndex !== null && editingIndex !== undefined
      ? examples[editingIndex]
      : null;

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error_message: string | null;
  } | null>(null);

  const isEditing = !!editingExample;

  const exampleFormSchema = z.object({
    category: z
      .string()
      .trim()
      .min(1, {
        message:
          t("queryExamples.form.categoryRequired") || "Category is required",
      }),
    title: z
      .string()
      .trim()
      .min(1, {
        message: t("queryExamples.form.titleRequired") || "Title is required",
      }),
    example: z
      .string()
      .trim()
      .min(1, {
        message:
          t("queryExamples.form.exampleRequired") || "SQL query is required",
      }),
  });

  type ExampleFormValues = z.infer<typeof exampleFormSchema>;

  const form = useForm<ExampleFormValues>({
    resolver: zodResolver(exampleFormSchema),
    defaultValues: {
      category: "General",
      title: "",
      example: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Reset form when modal opens/closes or editing example changes
  useEffect(() => {
    if (open && editingExample) {
      form.reset({
        category: editingExample.category,
        title: editingExample.title,
        example: editingExample.example,
      });
    } else if (open && !editingExample) {
      form.reset({
        category: initialValues?.category ?? "General",
        title: initialValues?.title ?? "",
        example: initialValues?.example ?? "",
      });
    }
    setValidationResult(null);
  }, [open, editingExample, form, initialValues]);

  const handleValidateSQL = async () => {
    const exampleValue = form.getValues("example");

    if (!exampleValue.trim()) return;

    setValidating(true);
    setValidationResult(null);
    try {
      const result = await validateExample(exampleValue);
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

  const handleFormSubmit = async (data: ExampleFormValues) => {
    try {
      const formattedExample = {
        title: data.title,
        category: data.category,
        example: data.example,
      };

      if (isEditing && editingIndex !== null && editingIndex !== undefined) {
        await updateExample(editingIndex, {
          ...formattedExample,
          is_active: editingExample!.is_active, // Preserve existing active state
        });
      } else {
        await addExample(formattedExample);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the context provider with toast
      console.error("Failed to save example:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setValidationResult(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {headerText ??
              (isEditing
                ? t("queryExamples.modal.editTitle")
                : t("queryExamples.modal.createTitle"))}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("queryExamples.form.category") || "Category"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("queryExamples.form.categoryPlaceholder") ||
                        "Enter category"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("queryExamples.form.question") || "Question"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("queryExamples.form.questionPlaceholder") ||
                        "What question does this SQL query answer?"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="example"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>{t("queryExamples.form.sqlQuery")}</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleValidateSQL}
                      disabled={validating || !field.value.trim()}
                    >
                      {validating && (
                        <Icon
                          name="Loader2"
                          size="sm"
                          className="mr-2 animate-spin"
                          variant="muted"
                        />
                      )}
                      {t("queryExamples.form.validate")}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder={t("queryExamples.form.sqlQueryPlaceholder")}
                      rows={10}
                      className="font-mono text-sm"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setValidationResult(null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {validationResult && (
                    <div
                      className={`text-sm p-2 rounded ${
                        validationResult.valid
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {validationResult.valid
                        ? t("queryExamples.validation.valid")
                        : validationResult.error_message ||
                          t("queryExamples.validation.invalid")}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting || !form.formState.isValid
                }
              >
                {form.formState.isSubmitting && (
                  <Icon
                    name="Loader2"
                    size="sm"
                    className="mr-2 animate-spin"
                    variant="white"
                  />
                )}
                {primaryButtonText ??
                  (isEditing ? t("common.save") : t("common.create"))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
