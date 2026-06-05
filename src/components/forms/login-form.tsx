/* eslint-disable no-console */
"use client";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

const forgotEmailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const forgotOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, { message: "OTP must be 4–6 digits" }),
});

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirm_password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formErrors, setFormErrors] = useState<{
    email?: string[];
    password?: string[];
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const { login, setLoading, isLoading } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">(
    "email"
  );
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function resetForgotState() {
    setForgotStep("email");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotLoading(false);
    setForgotError(null);
    setForgotSuccess(null);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }

  async function requestResetOtp() {
    setForgotError(null);
    setForgotSuccess(null);

    const result = forgotEmailSchema.safeParse({ email: forgotEmail });
    if (!result.success) {
      setForgotError(
        result.error.flatten().fieldErrors.email?.[0] ?? "Invalid email"
      );
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/request-reset-otp/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForgotError(
          data?.message || "Failed to send OTP. Please try again."
        );
        return;
      }

      setForgotSuccess(
        data?.message || "OTP sent to your email for verification."
      );
      setForgotStep("otp");
    } catch (err) {
      console.error(err);
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function confirmResetOtp() {
    setForgotError(null);
    setForgotSuccess(null);

    const result = forgotOtpSchema.safeParse({ otp: forgotOtp });
    if (!result.success) {
      setForgotError(
        result.error.flatten().fieldErrors.otp?.[0] ?? "Invalid OTP"
      );
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/confirm-reset-otp/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForgotError(data?.message || "Invalid OTP. Please try again.");
        return;
      }

      if (data?.success === true) {
        setForgotSuccess("OTP confirmed. Please set your new password.");
        setForgotStep("reset");
      } else {
        setForgotError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function resetPasswordWithOtp() {
    setForgotError(null);
    setForgotSuccess(null);

    const result = resetPasswordSchema.safeParse({
      new_password: forgotNewPassword,
      confirm_password: forgotConfirmPassword,
    });
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setForgotError(
        flat.new_password?.[0] ??
          flat.confirm_password?.[0] ??
          "Please check your password"
      );
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/reset-password-with-otp/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotEmail,
            otp: forgotOtp,
            new_password: forgotNewPassword,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForgotError(
          data?.message || "Failed to reset password. Please try again."
        );
        return;
      }

      setForgotSuccess(
        data?.message ||
          "Your password has been successfully reset. You can login now."
      );
      setLoginSuccess(
        data?.message ||
          "Your password has been successfully reset. You can login now."
      );
      setForgotOpen(false);
      resetForgotState();
    } catch (err) {
      console.error(err);
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormErrors({});
    setApiError(null);
    setLoginSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Zod validation
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFormErrors(result.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        setApiError("Invalid email or password");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Use the authStore login function
      login({
        token: data.token,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        user_id: data.user_id,
      });

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  aria-invalid={!!formErrors.email}
                />
                {formErrors.email && (
                  <p className="text-red-500">{formErrors.email[0]}</p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="ml-auto inline-block text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
                    onClick={() => {
                      setLoginSuccess(null);
                      setForgotOpen(true);
                      setForgotError(null);
                      setForgotSuccess(null);
                      setForgotStep("email");
                      setForgotOtp("");
                      setForgotNewPassword("");
                      setForgotConfirmPassword("");
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    aria-invalid={!!formErrors.password}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 cursor-pointer" />
                    ) : (
                      <Eye className="w-5 h-5 cursor-pointer" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500">{formErrors.password[0]}</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Login"}
                </Button>
              </div>
              {apiError && (
                <p className="text-red-500 text-center">{apiError}</p>
              )}
              {loginSuccess && (
                <p className="text-center text-emerald-600 dark:text-emerald-400">
                  {loginSuccess}
                </p>
              )}
            </div>
            {/* <div className="mt-4 text-center text-sm">
              Don&apos;t have an account---?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div> */}
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={forgotOpen}
        onOpenChange={(open) => {
          setForgotOpen(open);
          if (!open) resetForgotState();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              {forgotStep === "email" &&
                "Enter your email and we’ll send you an OTP."}
              {forgotStep === "otp" &&
                "Enter the OTP sent to your email to verify."}
              {forgotStep === "reset" &&
                "Create a new password for your account."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {(forgotError || forgotSuccess) && (
              <div
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  forgotError
                    ? "border-destructive/40 text-destructive"
                    : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                )}
              >
                {forgotError ?? forgotSuccess}
              </div>
            )}

            {forgotStep === "email" && (
              <div className="grid gap-3">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="email@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}

            {forgotStep === "otp" && (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="forgot-email-readonly">Email</Label>
                  <Input
                    id="forgot-email-readonly"
                    type="email"
                    value={forgotEmail}
                    disabled
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="forgot-otp">OTP</Label>
                  <Input
                    id="forgot-otp"
                    inputMode="numeric"
                    placeholder="e.g. 7282"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    className="text-left text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
                    disabled={forgotLoading}
                    onClick={requestResetOtp}
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}

            {forgotStep === "reset" && (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="forgot-new-password">New password</Label>
                  <div className="relative">
                    <Input
                      id="forgot-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                      onClick={() => setShowNewPassword((v) => !v)}
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5 cursor-pointer" />
                      ) : (
                        <Eye className="w-5 h-5 cursor-pointer" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="forgot-confirm-password">
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Input
                      id="forgot-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 cursor-pointer" />
                      ) : (
                        <Eye className="w-5 h-5 cursor-pointer" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {forgotStep === "email" && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={requestResetOtp}
                disabled={forgotLoading || !forgotEmail}
              >
                {forgotLoading ? "Sending..." : "Send OTP"}
              </Button>
            )}

            {forgotStep === "otp" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setForgotStep("email")}
                  disabled={forgotLoading}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={confirmResetOtp}
                  disabled={forgotLoading || !forgotOtp}
                >
                  {forgotLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}

            {forgotStep === "reset" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setForgotStep("otp")}
                  disabled={forgotLoading}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={resetPasswordWithOtp}
                  disabled={
                    forgotLoading ||
                    !forgotNewPassword ||
                    !forgotConfirmPassword
                  }
                >
                  {forgotLoading ? "Updating..." : "Update password"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
