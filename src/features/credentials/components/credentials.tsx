"use client";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  EmptyView,
  EntityContainer,
  EntityCreateButton,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import { CREDENTIAL_CONFIG } from "@/features/credentials/config";
import {
  useRemoveCredential,
  useSuspenseCredentials,
} from "@/features/credentials/hooks/use-credentials";
import { useCredentialsParams } from "@/features/credentials/hooks/use-credentials-params";
import type { PublicCredential } from "@/features/credentials/types";
import { useEntitySearch } from "@/hooks/use-entity-search";

export const CredentialsSearch = () => {
  const [params, setParams] = useCredentialsParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  });

  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search credentials"
    />
  );
};

export const CredentialsList = () => {
  const credentials = useSuspenseCredentials();

  return (
    <EntityList
      items={credentials.data.items}
      getKey={(credential) => credential.id}
      renderItem={(credential) => <CredentialItem data={credential} />}
      emptyView={<CredentialsEmpty />}
    />
  );
};

export const CredentialsHeader = () => (
  <EntityHeader
    title="Credentials"
    description="Manage reusable connections for workflow nodes"
  />
);

export const CredentialsPagination = () => {
  const credentials = useSuspenseCredentials();
  const [params, setParams] = useCredentialsParams();

  return (
    <EntityPagination
      disabled={credentials.isFetching}
      totalPages={credentials.data.totalPages}
      page={credentials.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const CredentialsLoading = () => (
  <LoadingView message="Loading credentials..." />
);

export const CredentialsError = () => (
  <ErrorView message="Could not load credentials" />
);

export const CredentialsEmpty = () => {
  const router = useRouter();
  return (
    <EmptyView
      onNew={() => router.push("/credentials/new")}
      title="No credentials yet"
      actionLabel="New credential"
      message="Save an API key once, then reuse it across OpenAI, Anthropic, Gemini, Discord, and Slack nodes."
    />
  );
};

const CredentialItem = ({ data }: { data: PublicCredential }) => {
  const removeCredential = useRemoveCredential();
  const config = CREDENTIAL_CONFIG[data.type];

  const handleRemove = async () => {
    if (!window.confirm(`Delete "${data.name}"? This cannot be undone.`)) {
      return;
    }

    await removeCredential.mutateAsync({ id: data.id }).catch(() => undefined);
  };

  return (
    <EntityItem
      href={`/credentials/${data.id}`}
      title={data.name}
      subtitle={`${config.label} · Updated ${formatDistanceToNow(
        data.updatedAt,
        {
          addSuffix: true,
        },
      )}`}
      image={
        <Image
          src={config.icon}
          alt=""
          width={18}
          height={18}
          className="size-[18px] object-contain"
        />
      }
      onRemove={handleRemove}
      isRemoving={removeCredential.isPending}
    />
  );
};

export const CredentialsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <EntityContainer
    header={<CredentialsHeader />}
    search={<CredentialsSearch />}
    action={
      <EntityCreateButton label="New credential" href="/credentials/new" />
    }
    pagination={<CredentialsPagination />}
  >
    {children}
  </EntityContainer>
);
