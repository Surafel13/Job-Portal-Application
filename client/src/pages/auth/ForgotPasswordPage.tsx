import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { Logo } from "../../components/layout/Logo";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Input";
import { authService } from "../../services/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState("");

  const sendOtp = useMutation({
    mutationFn: () => authService.forgotPassword(email),
    onSuccess: (res) => {
      setMessage(res.message);
      setStep(2);
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const verify = useMutation({
    mutationFn: () => authService.verifyOtp(email, otp),
    onSuccess: (res) => {
      setResetToken(res.data.resetToken);
      setStep(3);
      setMessage("OTP verified. Set a new password.");
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const reset = useMutation({
    mutationFn: () =>
      authService.resetPassword({
        email,
        resetToken,
        newPassword: password,
        confirmPassword: confirm,
      }),
    onSuccess: (res) => setMessage(res.message),
    onError: (error: Error) => setMessage(error.message),
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold">Reset password</h1>
      <p className="mt-2 text-sm text-muted">
        Use the email OTP flow provided by the JobVerse API.
      </p>
      <div className="mt-6 space-y-4 rounded-3xl bg-white p-6 ring-1 ring-line">
        {step === 1 ? (
          <>
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button className="w-full" onClick={() => sendOtp.mutate()} disabled={sendOtp.isPending}>
              Send OTP
            </Button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Field label="6-digit OTP">
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
            </Field>
            <Button className="w-full" onClick={() => verify.mutate()} disabled={verify.isPending}>
              Verify OTP
            </Button>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <Field label="New password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label="Confirm password">
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <Button className="w-full" onClick={() => reset.mutate()} disabled={reset.isPending}>
              Reset password
            </Button>
          </>
        ) : null}
        {message ? <p className="text-sm text-brand-700">{message}</p> : null}
      </div>
      <Link to="/login" className="mt-4 text-sm text-brand-700">
        Back to sign in
      </Link>
    </div>
  );
}
