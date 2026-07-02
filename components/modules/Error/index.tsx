"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { H3, P } from "@/components/ui/typography";
import { IconLogoWordmark } from "@/lib/icons/logo-wordmark";
import { Icon } from "@/components/ui/icon";

type ErrorInfo = {
  title: string;
  message: string;
  detail?: string;
  showDeletionOptions?: boolean;
};

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const router = useRouter();

  const getErrorMessage = (): ErrorInfo => {
    if (error === "unauthorized" && errorDescription?.includes("blocked")) {
      return {
        title: "We're sorry, but your account is no longer available",
        message: "This could be due to a data deletion request.",
        showDeletionOptions: true,
      };
    }

    if (error === "access_denied") {
      return {
        title: "Access Denied",
        message: "You do not have permission to access this application.",
        detail:
          errorDescription ??
          "Please contact support if you believe this is an error.",
      };
    }

    return {
      title: "Authentication Error",
      message: "An error occurred during login.",
      detail: errorDescription ?? "Please try again or contact support.",
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="modal fixed left-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-start overflow-y-auto bg-background pb-12">
      <header className="my-0 flex h-[72px] w-full shrink-0 items-center justify-between px-6 py-0">
        <button
          className="flex h-8 items-center"
          onClick={() => router.push("/")}
        >
          <IconLogoWordmark className="h-6 w-auto text-slate-900" />
        </button>
      </header>

      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-6 p-4 lg:p-0">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Icon
            name="AlertCircle"
            className="mb-2 h-10 w-10"
            variant="destructive"
          />
          <H3>{errorInfo.title}</H3>
          <P className="text-sm text-muted-foreground">{errorInfo.message}</P>
        </div>

        {errorInfo.showDeletionOptions ? (
          <div className="flex w-full max-w-md flex-col items-center gap-3">
            <P className="text-sm font-medium">
              You have the following options:
            </P>

            <Button variant="outline" className="w-full justify-center" asChild>
              <a
                href="https://calendar.app.google/f2cPFbixTnhpc7bK9"
                target="_blank"
                rel="noopener noreferrer"
              >
                Need help with data connection? Book a call
              </a>
            </Button>

            <Button variant="outline" className="w-full justify-center" asChild>
              <a href="/api/auth/login">Try with a different email</a>
            </Button>

            <Button variant="outline" className="w-full justify-center" asChild>
              <a
                href="https://calendar.app.google/bPa9Cvd4spJ93kZQ6"
                target="_blank"
                rel="noopener noreferrer"
              >
                Interested in Enterprise? Book a call
              </a>
            </Button>

            <P className="mt-2 text-center text-xs">
              Changed your mind?{" "}
              <a
                href="mailto:support@scavenger-ai.com"
                className="underline hover:text-primary"
              >
                Contact support
              </a>{" "}
              to cancel deletion.
            </P>
          </div>
        ) : (
          <>
            <Button variant="outline" className="w-40 justify-center" asChild>
              <a href="/">Log in as different user</a>
            </Button>

            <P className="text-xs font-medium leading-5">
              {errorInfo.detail} or{" "}
              <a
                className="underline hover:text-primary"
                href="mailto:support@scavenger-ai.com"
              >
                contact support
              </a>
            </P>
          </>
        )}
      </div>
    </div>
  );
}
