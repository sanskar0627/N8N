"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const Page = () => {
  const { data } = authClient.useSession();

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      {JSON.stringify(data)}
      {data && (
        <Button onClick={() => authClient.signOut()}>
          Logout
        </Button>
      )}
    </div>
  );
};

export default Page;
