import { useEffect } from "react";
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
  DialogDescription,
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

type RuleFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIndex?: number | null;
  /** Pre-fill values from a suggestion (Edit & Accept flow) */
  prefill?: { category: string; title: string; rule: string } | null;
  /** Called after a rule is successfully saved */
  onSaved?: () => void;
};

export const RuleFormModal = ({
  open,
  onOpenChange,
  editingIndex,
  prefill,
  onSaved,
}: RuleFormModalProps) => {
  const { t } = useTranslation("database");
  const { rules, addRule, updateRule } = useOrgDbConfig();

  const editingRule =
    editingIndex !== null && editingIndex !== undefined
      ? rules[editingIndex]
      : null;

  const isEditing = !!editingRule;

  const ruleFormSchema = z.object({
    category: z
      .string()
      .trim()
      .min(1, {
        message:
          t("businessRules.form.categoryRequired") || "Category is required",
      }),
    title: z
      .string()
      .trim()
      .min(1, {
        message: t("businessRules.form.titleRequired") || "Title is required",
      }),
    rule: z
      .string()
      .trim()
      .min(1, {
        message: t("businessRules.form.ruleRequired") || "Rule is required",
      }),
  });

  type RuleFormValues = z.infer<typeof ruleFormSchema>;

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      category: "General",
      title: "",
      rule: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Reset form when modal opens/closes or editing rule changes
  useEffect(() => {
    if (open && editingRule) {
      form.reset({
        category: editingRule.category,
        title: editingRule.title,
        rule: editingRule.rule,
      });
    } else if (open && prefill) {
      form.reset({
        category: prefill.category,
        title: prefill.title,
        rule: prefill.rule,
      });
    } else if (open && !editingRule) {
      form.reset({
        category: "General",
        title: "",
        rule: "",
      });
    }
  }, [open, editingRule, prefill, form]);

  const handleFormSubmit = async (data: RuleFormValues) => {
    try {
      if (isEditing && editingIndex !== null && editingIndex !== undefined) {
        await updateRule(editingIndex, {
          title: data.title,
          category: data.category,
          rule: data.rule,
          is_active: editingRule.is_active, // Preserve existing active state
        });
      } else {
        await addRule({
          title: data.title,
          category: data.category,
          rule: data.rule,
        });
      }
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the context provider with toast
      console.error("Failed to save rule:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="mb-1">
            {isEditing
              ? t("businessRules.modal.editTitle")
              : t("businessRules.modal.createTitle")}
          </DialogTitle>
          <DialogDescription className="leading-tight">
            {t("businessRules.modal.description")}
          </DialogDescription>
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
                    {t("businessRules.form.category") || "Category"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("businessRules.form.categoryPlaceholder") ||
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
                    {t("businessRules.form.title") || "Title"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("businessRules.form.titlePlaceholder") ||
                        "Enter rule title"
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
              name="rule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("businessRules.form.rule") || "Rule"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        "businessRules.form.descriptionPlaceholder",
                      )}
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
                {isEditing ? t("common.save") : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
