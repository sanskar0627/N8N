import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  Editor,
  EditorError,
  EditorLoading,
} from "@/features/editor/components/editor";
import { EditorHeader } from "@/features/editor/components/editor-header";
import { prefetchWorkflow } from "@/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  await requireAuth();

  const { workflowId } = await params;
  prefetchWorkflow(workflowId);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<EditorError />}>
        <Suspense fallback={<EditorLoading />}>
          <div className="flex min-h-0 flex-1 flex-col">
            <EditorHeader workflowId={workflowId} />
            <main className="min-h-0 flex-1">
              <Editor workflowId={workflowId} />
            </main>
          </div>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default Page;
