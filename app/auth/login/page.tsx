"use client";

import { signInAction } from "@/actions/authActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("registered") === "true";
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    setLoading(true);
    
    // Create form data to match actionState format
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    try {
      const result = await signInAction(null, formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      setError("Failed to sign in. Please verify your credentials.");
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <Card className="glass-card shadow-xl border-border/40">
      <CardHeader>
        <CardTitle className="text-xl">Sign in to your account</CardTitle>
        <CardDescription>Enter your credentials or use an OAuth provider</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {showSuccess && (
            <div className="bg-emerald-500/10 text-emerald-500 text-sm p-3 rounded-md border border-emerald-500/20">
              Registration successful! Please log in.
            </div>
          )}

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium leading-none">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="relative w-full flex items-center justify-center py-2">
            <span className="absolute w-full border-t border-border/50"></span>
            <span className="relative bg-background dark:bg-slate-900 px-3 text-xs text-muted-foreground uppercase">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("github")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              GitHub
            </Button>
          </div>

          <div className="text-sm text-center text-muted-foreground pt-2">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Create Account
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="glass-card shadow-xl border-border/40">
        <CardHeader>
          <CardTitle className="text-xl">Loading...</CardTitle>
          <CardDescription>Preparing security session</CardDescription>
        </CardHeader>
      </Card>
    }>
      <LoginContent />
    </Suspense>
  );
}
