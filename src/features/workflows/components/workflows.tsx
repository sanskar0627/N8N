"use client";

import React from "react";
import { useCreateWorkflow, useSuspenseWorkflows } from "../hooks/use-workflows";
import { EntityContainer } from "@/components/entity-components";
import { EntityHeader } from "@/components/entity-components";

export const WorkflowsList = () => {
  const workflows = useSuspenseWorkflows();

  return (
    <div className="flex-1 flex justify-center items-center">
      <p>
        {JSON.stringify(workflows.data, null, 2)}
      </p>
    </div>
  );
};

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
  const createWorkflow = useCreateWorkflow();

  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onError: (error) => {
        // TODO: Open upgrade modal
        console.error(error);
      },
    });
  }

  return (
    <>
      <EntityHeader
        title="Workflows"
        description="Create and manage your workflows"
        onNew={handleCreate}
        newButtonLabel="New workflow"
        disabled={disabled}
        isCreating={createWorkflow.isPending}
      />
    </>
  )
};

export const WorkflowsContainer = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<WorkflowsHeader />}
      search={<></>}
      pagination={<></>}
    >
      {children}
    </EntityContainer>
  );
};
