"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { variableNameSchema } from "@/features/executions/lib/variable-name";

const headerSchema = z.object({
  key: z.string().min(1, "Header name is required"),
  value: z.string().min(1, "Header value is required"),
});

const formSchema = z.object({
  variableName: variableNameSchema,
  endpoint: z.string().min(1, { message: "Please enter a valid URL" }),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  body: z.string().optional(),
  headers: z.array(headerSchema).optional(),
});

export type HttpRequestFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: HttpRequestFormValues) => void;
  defaultValues?: Partial<HttpRequestFormValues>;
}

export const HttpRequestDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<HttpRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      endpoint: defaultValues.endpoint || "",
      method: defaultValues.method || "GET",
      body: defaultValues.body || "",
      headers: defaultValues.headers || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        endpoint: defaultValues.endpoint || "",
        method: defaultValues.method || "GET",
        body: defaultValues.body || "",
        headers: defaultValues.headers || [],
      });
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "myApiCall";
  const watchMethod = form.watch("method");
  const showBodyField = ["POST", "PUT", "PATCH"].includes(watchMethod);

  const handleSubmit = (values: HttpRequestFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const methodColors: Record<string, string> = {
    GET: "text-green-500",
    POST: "text-yellow-500",
    PUT: "text-blue-500",
    PATCH: "text-purple-500",
    DELETE: "text-red-500",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>HTTP Request</DialogTitle>
          <DialogDescription>
            Configure settings for <strong>HTTP Request</strong> node.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-4 space-y-6 sm:space-y-8"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myApiCall" {...field} />
                  </FormControl>
                  <FormDescription>
                    Name of the variable to store the response in. It can be
                    used later to reference in other nodes:{" "}
                    <code className="break-all">
                      {`{{${watchVariableName}.httpResponse.data}}`}
                    </code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <span
                          className={`font-medium ${methodColors[field.value] || ""}`}
                        >
                          {field.value || "Choose a method"}
                        </span>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["GET", "POST", "PUT", "PATCH", "DELETE"].map(
                        (method) => (
                          <SelectItem
                            key={method}
                            value={method}
                            className={`cursor-pointer font-medium ${methodColors[method]} transition-colors`}
                          >
                            {method}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The HTTP method for the request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Headers</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: "", value: "" })}
                  className="h-7 gap-1 text-xs"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Header
                </Button>
              </div>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No custom headers configured. Click &quot;Add Header&quot; to
                  add one.
                </p>
              )}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start"
                >
                  <FormField
                    control={form.control}
                    name={`headers.${index}.key`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Header name"
                            {...field}
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`headers.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Header value"
                            {...field}
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-9 w-full shrink-0 text-muted-foreground hover:text-destructive sm:w-9"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <FormDescription>
                Custom HTTP headers. Use {"{{variables}}"} for dynamic values.
              </FormDescription>
            </div>
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.example.com/users/{{previousRequest.httpResponse.data.id}}"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Static URL or use {"{{variables}}"} for simple values or{" "}
                    {"{{json variable}}"} to stringify objects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showBodyField && (
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Body</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          '{\n    "userId": "{{previousRequest.httpResponse.data.id}}",\n    "name": "{{previousRequest.httpResponse.data.name}}"\n}'
                        }
                        {...field}
                        className="min-h-[120px] font-mono text-sm"
                      />
                    </FormControl>
                    <FormDescription>
                      JSON with template variables. Use {"{{variables}}"} for
                      simple values or {"{{json variable}}"} to stringify
                      objects.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
