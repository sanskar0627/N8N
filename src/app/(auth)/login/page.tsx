import { LoginForm } from "@/features/auth/components/login-form";
import { requireUnAuth } from "@/lib/auth-utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Sign in to M9M to build and manage your automated workflows. Connect AI models, APIs, and services visually.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Log In | M9M",
    description: "Sign in to your M9M workflow automation dashboard.",
    url: "/login",
  },
};

const Page = async () => {
  await requireUnAuth();
  return <LoginForm />;
};

export default Page;
