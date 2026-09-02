import { CredentialForm } from "@/features/credentials/components/credential-form";
import { requireAuth } from "@/lib/auth-utils";

const Page = async () => {
  await requireAuth();

  return (
    <main className="h-full p-4 md:px-10 md:py-6">
      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-8">
        <div>
          <h1 className="text-xl font-semibold">New credential</h1>
          <p className="text-sm text-muted-foreground">
            Add a reusable provider key for your workflow nodes.
          </p>
        </div>
        <CredentialForm />
      </div>
    </main>
  );
};

export default Page;
