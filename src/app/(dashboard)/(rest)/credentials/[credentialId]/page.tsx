interface PageProps {
  params: Promise<{
    credentialId: string;
  }>
};

const Page = async ({ params }: PageProps) => {
  const { credentialId } = await params;

  return <p>Credential id: {credentialId}</p>
};

export default Page;
