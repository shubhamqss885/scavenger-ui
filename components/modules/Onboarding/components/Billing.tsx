"use client";
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserContext } from "@/lib/context/UserDataContext";

type BillingProps = {
  onSubmit: () => void;
};

const BillingSchema = z.object({
  payment_method: z.enum(["card", "paypal"]),
  user_region: z.enum(["eu", "other"]),
  newsletter_subscription: z.enum(["yes", "no"]).default("no"),
});

const Billing = ({ onSubmit }: BillingProps) => {
  const { updateUserProfile } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof BillingSchema>>({
    resolver: zodResolver(BillingSchema),
  });

  const handleFormSubmit = async (data: z.infer<typeof BillingSchema>) => {
    try {
      setIsLoading(true);
      const response = await updateUserProfile(data);
      // console.log('User Info submitted successfully:', response);
      setIsLoading(false);
      onSubmit();
    } catch (error) {
      console.error("Failed to submit User Info:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center self-start max-w-3xl gap-6 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-semibold tracking-tight">Billing</h1>
        <h3 className="text-sm font-medium text-muted-foreground">
          Please provide your billing information.
        </h3>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Payment Method</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="card" />
                      </FormControl>
                      <FormLabel className="font-normal">Card</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="paypal" />
                      </FormControl>
                      <FormLabel className="font-normal">PayPal</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_region"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="eu" />
                      </FormControl>
                      <FormLabel className="font-normal">EU</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="other" />
                      </FormControl>
                      <FormLabel className="font-normal">Other</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newsletter_subscription"
            render={({ field }) => (
              <FormItem>
                <div className="mb-2">
                  <FormLabel>Subscribe to Our Newsletter</FormLabel>
                </div>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  {/* <FormDescription className="text-xs text-muted-foreground">
                                    Stay updated with the latest news and promotions.
                                </FormDescription> */}
                  <FormControl>
                    <Checkbox
                      checked={field.value === "yes"}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? "yes" : "no")
                      }
                    />
                  </FormControl>
                  <FormLabel className="">
                    Yes, I would like to receive newsletter updates.
                  </FormLabel>
                </FormItem>
              </FormItem>
            )}
          />

          <div className="flex justify-center mt-8">
            <Button
              variant="default"
              size="lg"
              className="w-auto"
              type="submit"
              disabled={isLoading}
            >
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Billing;
