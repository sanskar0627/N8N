import { SidebarTrigger } from "@/components/ui/sidebar";

export const AppHeader = () => {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3 md:px-4">
      <SidebarTrigger />
    </header>
  );
};
