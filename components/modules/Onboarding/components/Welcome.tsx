"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { H4, P, Small } from "@/components/ui/typography";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserContext } from "@/lib/context/UserDataContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";

interface Props {
  onSubmit: () => void;
}

export const Welcome = ({ onSubmit }: Props) => {
  const { t } = useTranslation("onboarding");
  const { auth0User, updateUserProfile } = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: t("welcome.validationError"),
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreeTerms: false,
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.agreeTerms) {
      try {
        setIsSubmitting(true);
        // Save terms acceptance to user profile
        await updateUserProfile({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
        });
        setIsSubmitting(false);
        onSubmit();
      } catch (error) {
        console.error("Failed to update terms acceptance:", error);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex w-full flex-row items-center justify-center gap-12 sm:-mt-12">
      <div className="flex w-full max-w-5xl flex-col items-center text-center sm:items-start sm:text-left">
        <H4 className="mb-2 text-lg leading-tight sm:mb-1 sm:text-base sm:leading-6">
          {t("welcome.title")}
        </H4>
        <P className="text-xs font-medium leading-5">
          {t("welcome.emailConfirmed")}{" "}
          <span className="text-primary">{auth0User?.email}</span>{" "}
          {t("welcome.hasBeenConfirmed")}
        </P>
        <P className="mb-4 mt-4 text-xs font-medium leading-5 sm:mb-0 sm:mt-6">
          {t("welcome.letsCreate")}
        </P>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="w-full max-w-5xl"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="mt-3 flex grow flex-row items-start space-x-1.5 space-y-0 text-left">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="sm:pt-px">
                      <Small className="leading-4">
                        {t("welcome.agreeText")}{" "}
                        <Link
                          href="/terms-conditions"
                          target="_blank"
                          className="whitespace-nowrap text-primary hover:underline"
                        >
                          {t("welcome.termsLink")}
                        </Link>{" "}
                        {t("welcome.and")}{" "}
                        <Link
                          href="/privacy-policy"
                          target="_blank"
                          className="whitespace-nowrap text-primary hover:underline"
                        >
                          {t("welcome.privacyLink")}
                        </Link>{" "}
                        {t("welcome.endText")}
                      </Small>
                      <FormMessage className="mt-2 text-xs" />
                    </FormLabel>
                  </FormItem>
                )}
              />

              <div className="w-full sm:w-auto sm:self-end">
                <Button
                  type="submit"
                  variant="default"
                  disabled={isSubmitting || !form.formState.isValid}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting
                    ? t("welcome.buttons.submitting")
                    : t("welcome.buttons.continue")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
