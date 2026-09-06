import Image from "next/image";
import { cn } from "@/lib/utils";

export const BrandMark = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/logo/logo.png"
      alt="M9M"
      width={28}
      height={28}
      className={cn("size-7 rounded-md object-contain", className)}
      priority
    />
  );
};
