import type { ComponentProps } from "react";
import { CheckIcon, Loader2Icon, XCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { NodeStatus } from "./node-status-indicator";

interface BaseNodeProps extends ComponentProps<"div"> {
  status?: NodeStatus;
}

export function BaseNode({ className, status, ...props }: BaseNodeProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground relative rounded-md border",
        "hover:ring-1",
        "in-[.selected]:border-muted-foreground",
        "in-[.selected]:shadow-lg",
        className,
      )}
      tabIndex={0}
      {...props}
    >
      {props.children}
      {status === "error" && (
        <XCircleIcon className="absolute right-0.5 bottom-0.5 size-2.5 stroke-3 text-red-700 dark:text-red-400" />
      )}
      {status === "success" && (
        <CheckIcon className="absolute right-0.5 bottom-0.5 size-2.5 stroke-3 text-green-700 dark:text-green-400" />
      )}
      {status === "loading" && (
        <Loader2Icon className="absolute -right-0.5 -bottom-0.5 z-50 size-2.5 animate-spin stroke-3 text-blue-700 dark:text-blue-400" />
      )}
    </div>
  );
}

export function BaseNodeHeader({
  className,
  ...props
}: ComponentProps<"header">) {
  return (
    <header
      {...props}
      className={cn(
        "mx-0 my-0 -mb-1 flex flex-row items-center justify-between gap-2 px-3 py-2",
        className,
      )}
    />
  );
}

export function BaseNodeHeaderTitle({
  className,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="base-node-title"
      className={cn("user-select-none flex-1 font-semibold", className)}
      {...props}
    />
  );
}

export function BaseNodeContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="base-node-content"
      className={cn("flex flex-col gap-y-2 p-3", className)}
      {...props}
    />
  );
}

export function BaseNodeFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="base-node-footer"
      className={cn(
        "flex flex-col items-center gap-y-2 border-t px-3 pb-3 pt-2",
        className,
      )}
      {...props}
    />
  );
}
