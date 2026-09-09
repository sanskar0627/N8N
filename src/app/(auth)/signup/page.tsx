import { RegisterForm } from "@/features/auth/components/Register-form";
import { requireUnAuth } from "@/lib/auth-utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your free M9M account and start building powerful automated workflows in minutes. No credit card required.",
  alternates: {
    canonical: "/signup",
  },
  openGraph: {
    title: "Sign Up | M9M",
    description:
      "Create your free account and start automating workflows with AI-powered nodes.",
    url: "/signup",
  },
};

const Page = async () => {
  await requireUnAuth();
  return <RegisterForm />;
};

export default Page;
