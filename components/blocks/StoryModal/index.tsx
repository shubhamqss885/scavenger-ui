"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { P } from "@/components/ui/typography";
import { ChatBubble } from "./ChatBubble";

type Step = {
  title: string;
  content: React.ReactNode;
};

export default function StoryModal({
  isOpen,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: "Hallo!", // Hi There!
      content: (
        <div className="h-full flex flex-col justify-between py-6 pr-3">
          {/* Welcome to */}
          <P className="text-lg leading-relaxed text-center [&:first-child]:mt-0">
            Willkommen bei{" "}
            <span className="text-primary font-semibold">Scavenger !</span>
          </P>

          <div className="flex justify-center">
            <div className="overflow-hidden rounded-lg shadow-xl border border-slate-200">
              <Image
                src="/toy-cars.png"
                alt="Toy car collection"
                width={500}
                height={300}
                className="object-cover"
              />
            </div>
          </div>

          {/* You are a manager of a global toy retailer, specialized in model cars, trains, ships and much more */}
          <P className="text-base leading-relaxed text-center ">
            Du bist Manager eines{" "}
            <span className="text-primary font-semibold">
              weltweit tätigen Spielzeughändlers
            </span>
            , spezialisiert auf Modellautos, -züge, -schiffe und vieles mehr.
          </P>
        </div>
      ),
    },
    {
      title: "Das Problem!", // The problem!
      content: (
        <div className="h-full flex flex-col justify-center gap-6 py-6 pr-3">
          {/* In recent years, sales have been somewhat volatile. */}
          <P className="text-base [&:first-child]:mt-0  leading-relaxed text-center">
            In den letzten Jahren waren die Umsätze etwas{" "}
            <span className="text-primary font-semibold">volatil</span>.
          </P>

          {/* Therefore, a strategic management meeting was convened at short notice. */}
          <P className="text-base leading-relaxed text-center">
            Deshalb wurde kurzfristig ein{" "}
            <span className="text-primary font-semibold">
              strategisches Management-Meeting
            </span>{" "}
            einberufen.
          </P>

          <div className="flex justify-center my-6">
            <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 shadow-sm text-center">
              <P className="text-xl [&:first-child]:mt-0 font-semibold text-primary">
                Ziel: herausfinden, woran es liegt, und Maßnahmen ableiten.
              </P>
            </div>
          </div>

          {/* To prepare yourself as best as possible, you want to take a close look at the sales figures for the years 2022-2024 */}
          <P className="text-base leading-relaxed text-center">
            Um dich bestmöglich vorzubereiten, willst du die{" "}
            <span className="text-primary font-semibold">
              Verkaufszahlen der Jahre 2022–2024
            </span>{" "}
            genau unter die Lupe nehmen.
          </P>
        </div>
      ),
    },
    {
      title: "Welche Fragen könnten dich weiterbringen?", // What questions could help you progress?
      content: (
        <div className="h-full flex flex-col justify-between py-6">
          <div className="space-y-5 overflow-y-auto pr-3">
            <ChatBubble
              message="Wie haben sich die monatlichen Umsätze pro Produktlinie 2023 und 2024 entwickelt?"
              position="right"
            />

            <ChatBubble
              message="Welche Produkte innerhalb einer Linie waren die Bestseller?"
              position="left"
            />

            <ChatBubble
              message="In welche Länder wurden sie verkauft? Vergleiche 2 Länder miteinander."
              position="right"
            />

            <ChatBubble
              message="Welche Sales-Mitarbeiter waren dafür verantwortlich?"
              position="left"
            />

            <ChatBubble
              message="Zu welchem Preis wurden die Produkte eingekauft – und wie hoch war die Marge?"
              position="right"
            />

            <ChatBubble
              message="Wie würde sich die Marge verändern, wenn sich der Einkaufspreis im nächsten Jahr um 20 % erhöht?"
              position="left"
            />

            <ChatBubble
              message="Wer ist der Vendor eines bestimmten Produktes und wie viel habe ich davon noch auf Lager?"
              position="right"
            />
          </div>

          {/* These and many other questions could bring you closer to the solution. Have fun exploring! */}
          <div className="text-center mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <P className="text-base italic [&:first-child]:mt-0">
              Diese und viele weitere Fragen könnten dich der Lösung
              näherbringen.{" "}
              <span className="block mt-2 font-semibold text-primary">
                Viel Spaß beim Entdecken!
              </span>
            </P>
          </div>
        </div>
      ),
    },
  ];

  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-0 gap-0 flex flex-col"
        style={{ width: "700px", height: "700px" }} // Fixed size for consistency
      >
        <DialogHeader className="p-6 pb-0 space-y-0 border-b-0 shrink">
          <div className="flex items-center justify-center">
            <DialogTitle className="text-4xl font-semibold text-center">
              {steps[currentStep].title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="pl-6 pr-3 py-0 overflow-y-auto flex-1">
          {steps[currentStep].content}
        </div>

        <div className="p-6 pt-0 flex shrink justify-between items-center">
          {currentStep > 0 ? (
            <Button variant="default" onClick={handleBack} size="lg">
              Back
            </Button>
          ) : (
            <div></div>
          )}
          <Button onClick={handleNext} variant="default" size="lg">
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
