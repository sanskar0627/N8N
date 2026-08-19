"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";


const registerSchema = z
  .object({
    email: z.email("Please Enter an Valid Email"),
    password: z.string().min(6, "Password should be Atleast 6 characters"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password Don't match",
    path: ["confirmPassword"],
  });

type registerFormValue = z.infer<typeof registerSchema>; // z.infer takes that schema and automatically creates the TypeScript type

export function RegisterForm() {
  const router = useRouter();

  const form = useForm<registerFormValue>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: registerFormValue) => {
    await authClient.signUp.email(
      {
        name: values.email,
        email: values.email,
        password: values.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => router.push("/"),
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };
  const isPending = form.formState.isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Get Started</CardTitle>
          <CardDescription>Create your Account to get Started</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    disabled={isPending}
                    onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}
                  >
                    <Image src="/logo/google.svg" alt="Google" width={20} height={20} />
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    disabled={isPending}
                    onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/" })}
                  >
                    <Image src="/logo/github.svg" alt="Github" width={20} height={20} />
                    Continue with Github
                  </Button>
                </div>
                <div className=" gird gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="example@gmail.com"
                            {...field}
                          ></Input>
                        </FormControl>
                        <FormMessage></FormMessage>
                      </FormItem>
                    )}
                  ></FormField>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="*******"
                            {...field}
                          ></Input>
                        </FormControl>
                        <FormMessage></FormMessage>
                      </FormItem>
                    )}
                  ></FormField>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel> Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="*******"
                            {...field}
                          ></Input>
                        </FormControl>
                        <FormMessage></FormMessage>
                      </FormItem>
                    )}
                  ></FormField>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    Signup
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Already have an account ?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Log In
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
