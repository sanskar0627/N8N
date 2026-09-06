import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[var(--canvas)] p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 self-center"
        >
          <BrandMark className="size-8" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            M9M
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
};
