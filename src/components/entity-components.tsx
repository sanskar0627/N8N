import {
  AlertTriangleIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
import { Input } from "./ui/input";

type EntityHeaderProps = {
  title: string;
  description?: string;
};

export const EntityHeader = ({ title, description }: EntityHeaderProps) => {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

type EntityContainerProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  search?: React.ReactNode;
  pagination?: React.ReactNode;
  action?: React.ReactNode;
};

export const EntityContainer = ({
  children,
  header,
  search,
  pagination,
  action,
}: EntityContainerProps) => {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b bg-background px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="min-w-0">{header}</div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {search}
          {action}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto flex h-full max-w-6xl flex-col">{children}</div>
      </div>
      {pagination && (
        <div className="border-t bg-background px-4 py-2.5 md:px-6">
          <div className="mx-auto max-w-6xl">{pagination}</div>
        </div>
      )}
    </div>
  );
};

interface EntitySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const EntitySearch = ({
  value,
  onChange,
  placeholder = "Search",
}: EntitySearchProps) => {
  return (
    <div className="relative w-full md:w-[240px]">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-8 bg-background pr-3 pl-8 text-sm shadow-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

interface StateViewProps {
  message?: string;
}

export const LoadingView = ({ message }: StateViewProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      {!!message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};

export const ErrorView = ({ message }: StateViewProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <AlertTriangleIcon className="size-5 text-destructive" />
      {!!message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};

interface EntityPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const EntityPagination = ({
  page,
  totalPages,
  onPageChange,
  disabled,
}: EntityPaginationProps) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages || 1}
      </p>
      <div className="flex items-center gap-2">
        <Button
          disabled={page === 1 || disabled}
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          disabled={page === totalPages || totalPages === 0 || disabled}
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

interface EmptyViewProps extends StateViewProps {
  onNew?: () => void;
  title?: string;
  actionLabel?: string;
}

export const EmptyView = ({
  message,
  onNew,
  title = "Nothing here yet",
  actionLabel = "Create workflow",
}: EmptyViewProps) => {
  return (
    <Empty className="min-h-[360px] rounded-lg border bg-background">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-xl bg-primary/10 text-primary">
          <WorkflowIcon className="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {!!message && <EmptyDescription>{message}</EmptyDescription>}
      </EmptyHeader>
      {!!onNew && (
        <EmptyContent>
          <Button size="sm" onClick={onNew}>
            <PlusIcon className="size-4" />
            {actionLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
};

interface EntityListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey?: (item: T, index: number) => string | number;
  emptyView?: React.ReactNode;
  className?: string;
}

export function EntityList<T>({
  items,
  renderItem,
  getKey,
  emptyView,
  className,
}: EntityListProps<T>) {
  if (items.length === 0 && emptyView) {
    return (
      <div className="flex flex-1 items-center justify-center py-6">
        {emptyView}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background",
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={getKey ? getKey(item, index) : index}
          className="border-b last:border-b-0"
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

interface EntityItemProps {
  href: string;
  title: string;
  subtitle?: React.ReactNode;
  image?: React.ReactNode;
  actions?: React.ReactNode;
  onRemove?: () => void | Promise<void>;
  isRemoving?: boolean;
  className?: string;
}

export const EntityItem = ({
  href,
  title,
  subtitle,
  image,
  actions,
  onRemove,
  isRemoving,
  className,
}: EntityItemProps) => {
  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRemoving) return;

    await onRemove?.();
  };

  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/60",
        isRemoving && "pointer-events-none opacity-50",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {image && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
            {image}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {(actions || onRemove) && (
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {onRemove && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleRemove}
                >
                  <TrashIcon className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </Link>
  );
};

export const EntityCreateButton = ({
  label,
  onClick,
  href,
  disabled,
  isCreating,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  isCreating?: boolean;
}) => {
  if (href) {
    return (
      <Button size="sm" className="h-8" asChild>
        <Link href={href} prefetch>
          <PlusIcon className="size-4" />
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="h-8"
      disabled={disabled || isCreating}
      onClick={onClick}
    >
      <PlusIcon className="size-4" />
      {label}
    </Button>
  );
};
