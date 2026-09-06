"use client";

import {
  CreditCardIcon,
  FolderOpenIcon,
  HistoryIcon,
  KeyIcon,
  LogOutIcon,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useBillingCheckout, useBillingPortal } from "@/features/subscriptions/hooks/use-billing";
import { useHasActiveSubscription } from "@/features/subscriptions/hooks/use-subscription";
import { authClient } from "@/lib/auth-client";

const menuItems = [
  {
    title: "Workflows",
    icon: FolderOpenIcon,
    url: "/workflows",
  },
  {
    title: "Credentials",
    icon: KeyIcon,
    url: "/credentials",
  },
  {
    title: "Executions",
    icon: HistoryIcon,
    url: "/executions",
  },
];

export const AppSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { hasActiveSubscription, isLoading } = useHasActiveSubscription();
  const billingPortal = useBillingPortal();
  const billingCheckout = useBillingCheckout();

  return (
    <Sidebar collapsible="icon" className="overflow-hidden">
      <SidebarHeader className="px-2 py-3 group-data-[collapsible=icon]:px-1.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="M9M"
              className="h-9 justify-start gap-2 px-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
            >
              <Link href="/workflows" prefetch>
                <BrandMark className="size-6" />
                <span className="text-[15px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                  M9M
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden px-2 group-data-[collapsible=icon]:px-1.5">
        <SidebarGroup className="pt-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      asChild
                      className="h-9 justify-start gap-2.5 rounded-md px-2.5 text-[13px] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                    >
                      <Link href={item.url} prefetch>
                        <item.icon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="overflow-hidden px-2 pb-3 group-data-[collapsible=icon]:px-1.5">
        <SidebarSeparator className="mx-1 mb-2 bg-sidebar-border group-data-[collapsible=icon]:mx-0" />
        <SidebarMenu className="gap-1">
          {!hasActiveSubscription && !isLoading && (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Upgrade to Pro"
                className="h-9 justify-start gap-2.5 rounded-md px-2.5 text-[13px] text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-primary group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
                disabled={billingCheckout.isPending}
                onClick={() => billingCheckout.mutate()}
              >
                <StarIcon className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Upgrade to Pro
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Billing"
              className="h-9 justify-start gap-2.5 rounded-md px-2.5 text-[13px] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
              disabled={billingPortal.isPending}
              onClick={() => billingPortal.mutate()}
            >
              <CreditCardIcon className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                Billing
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="h-9 justify-start gap-2.5 rounded-md px-2.5 text-[13px] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/login");
                    },
                  },
                })
              }
            >
              <LogOutIcon className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                Sign out
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {session?.user?.email && (
          <div className="mt-2 truncate px-2.5 text-[11px] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
            {session.user.email}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
