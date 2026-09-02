import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CredentialView } from "@/features/credentials/components/credential-view";
import {
  CredentialsError,
  CredentialsLoading,
} from "@/features/credentials/components/credentials";
import { prefetchCredential } from "@/features/credentials/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";

interface PageProps {
  params: Promise<{
    credentialId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  await requireAuth();

  const { credentialId } = await params;
  prefetchCredential(credentialId);

  return (
    <main className="h-full p-4 md:px-10 md:py-6">
      <div className="mx-auto flex h-full w-full max-w-screen-md flex-col gap-8">
        <HydrateClient>
          <ErrorBoundary fallback={<CredentialsError />}>
            <Suspense fallback={<CredentialsLoading />}>
              <CredentialView credentialId={credentialId} />
            </Suspense>
          </ErrorBoundary>
        </HydrateClient>
      </div>
    </main>
  );
};

export default Page;
