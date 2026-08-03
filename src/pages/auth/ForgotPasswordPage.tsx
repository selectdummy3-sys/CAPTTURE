import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field } from "@/components/form/Field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const { error } = await resetPassword(values.email);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-12 w-12 text-green-500" />
          <p className="text-sm text-neutral-600">
            If an account exists for that address, a reset link is on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Email address" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.co.za" {...register("email")} />
          </Field>
          <Button type="submit" className="w" loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
