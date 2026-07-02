// Pricing Plans Data
// Centralized configuration for all pricing plans

import { IconName } from "@/components/ui/icon";

export type PlanPrice = Readonly<{
  monthly: number | string;
  yearly: number | string;
}>;

export type Feature = Readonly<{
  readonly key: string;
  readonly tooltipKey?: string;
  readonly icon?: IconName;
}>;

export type Plan = Readonly<{
  id: "demo" | "private" | "enterprise";
  name: string;
  displayName: string;
  price: PlanPrice;
  description: string;
  features: (string | Feature)[];
  cta: string;
  popular?: boolean;
}>;

export const plans: Plan[] = [
  {
    id: "demo",
    name: "plans.demo.name",
    displayName: "plans.demo.displayName",
    price: {
      monthly: "plans.demo.price.text",
      yearly: "plans.demo.price.text",
    },
    description: "plans.demo.description",
    features: [
      "plans.demo.features.chatDatabase",
      "plans.demo.features.visualsAndInsights",
    ],
    cta: "plans.demo.cta",
  },
  {
    id: "private",
    name: "plans.private.name",
    displayName: "plans.private.displayName",
    price: {
      monthly: 15,
      yearly: 10,
    },
    description: "plans.private.description",
    features: [
      "plans.private.features.inheritDemo",
      "plans.private.features.uploadData",
      "plans.private.features.businessLogic",
      "plans.private.features.contextAwareness",
      "plans.private.features.gdprCompliance",
    ],
    cta: "plans.private.cta",
    popular: true,
  },
  {
    id: "enterprise",
    name: "plans.enterprise.name",
    displayName: "plans.enterprise.displayName",
    price: {
      monthly: "plans.enterprise.price.text",
      yearly: "plans.enterprise.price.text",
    },
    description: "plans.enterprise.description",
    features: [
      "plans.enterprise.features.inheritPrivate",
      "plans.enterprise.features.connections",
      "plans.enterprise.features.dataEngineering",
      "plans.enterprise.features.sharedWorkspace",
      "plans.enterprise.features.rls",
      "plans.enterprise.features.prioritySupport",
    ],
    cta: "plans.enterprise.cta",
  },
];
