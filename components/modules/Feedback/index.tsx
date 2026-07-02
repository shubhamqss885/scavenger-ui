"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitFeedback } from "@/lib/services/feedbackService";
import { useUserContext } from "@/lib/context/UserDataContext";
import { toast } from "sonner";
import { Large, Muted } from "@/components/ui/typography";
import PageHeader from "@/components/blocks/Header";
import { useTranslation } from "react-i18next";

const FeedbackPage = () => {
  const { t } = useTranslation("feedback");
  const { userProfile } = useUserContext();
  const [feedbackContent, setFeedbackContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 500;
  const feedbackDetails = [
    {
      field: t("form.fields.username"),
      value: userProfile?.user_name ?? t("values.notAvailable"),
    },
    {
      field: t("form.fields.userEmail"),
      value:
        userProfile?.email ??
        userProfile?.business_email ??
        t("values.notAvailable"),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) {
      toast.error(t("form.validation.required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitFeedback({
        user_email: userProfile?.email ?? userProfile?.business_email ?? "",
        user_name: userProfile?.user_name ?? "",
        feedback_content: feedbackContent,
      });

      // console.log("Feedback submitted successfully:", response);
      toast.success(t("messages.success"));
      setFeedbackContent("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(t("messages.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;

    if (text.length <= maxLength) {
      setFeedbackContent(text);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-12 px-6">
      <PageHeader title={t("page.title")} />
      <Table>
        <TableBody>
          {feedbackDetails.map((item, index) => (
            <TableRow className="border-0" key={index}>
              <TableCell>
                <Muted className="font-semibold">{item.field}</Muted>
              </TableCell>
              <TableCell>
                <Muted>{item.value}</Muted>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form onSubmit={handleSubmit} className="grid w-full gap-2 p-2">
        <Large className="mt-3">{t("form.question")}</Large>
        <Textarea
          className="py-2 h-18"
          id="feedback"
          placeholder={t("form.placeholder")}
          value={feedbackContent}
          onChange={handleTextareaChange}
          maxLength={maxLength}
          required
        />
        <Muted className="text-right text-xs">
          {t("form.characterCount", {
            current: feedbackContent.length,
            max: maxLength,
          })}
        </Muted>
        <Muted>{t("form.helperText")}</Muted>
        <Button
          type="submit"
          className="w-fit mt-4"
          disabled={isSubmitting || feedbackContent.trim().length === 0}
        >
          {isSubmitting ? t("actions.submitting") : t("actions.submit")}
        </Button>
      </form>
    </div>
  );
};

export default FeedbackPage;
