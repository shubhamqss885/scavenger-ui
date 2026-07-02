"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
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
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { toast } from "sonner";

const preferencesFormSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]),
  model: z.string().min(1, { message: "Please select a model." }),
});

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

const defaultValues: Partial<PreferencesFormValues> = {
  theme: "auto",
  model: "",
};

export function PreferencesForm() {
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: PreferencesFormValues) {
    toast("You submitted the following values:", {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">Theme</FormLabel>
                            <RadioGroup
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                                className="flex space-x-2"
                            >
                                <RadioGroupItem value="light" id="light">
                                    Light
                                </RadioGroupItem>
                                <RadioGroupItem value="dark" id="dark">
                                    Dark
                                </RadioGroupItem>
                                <RadioGroupItem value="auto" id="auto">
                                    Auto
                                </RadioGroupItem>
                            </RadioGroup>
                            <FormDescription>
                                Select your preferred theme.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                /> */}
        <h4>Preferences setting go here</h4>
        <Button type="submit">Save preferences</Button>
      </form>
    </Form>
  );
}
