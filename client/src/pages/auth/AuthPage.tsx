import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Github } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { Logo } from "../../components/layout/Logo";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Input";
import { dashboardPath } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["worker", "employer"]),
    companyName: z.string().optional(),
  })
  .refine((data) => data.role !== "employer" || Boolean(data.companyName?.trim()), {
    message: "Company name is required for employers",
    path: ["companyName"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(mode);
  const [notice, setNotice] = useState("");
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "worker",
      companyName: "",
    },
  });

  const login = useMutation({
    mutationFn: (values: LoginValues) => authService.login(values),
    onSuccess: async (res) => {
      setSession(res.data.user, res.data.accessToken, res.data.refreshToken);
      await navigate(from ?? dashboardPath(res.data.user.role));
    },
  });

  const registerMut = useMutation({
    mutationFn: (values: RegisterValues) =>
      authService.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        companyName: values.role === "employer" ? values.companyName : undefined,
      }),
    onSuccess: async (res) => {
      setSession(res.data.user, res.data.accessToken, res.data.refreshToken);
      await navigate(dashboardPath(res.data.user.role));
    },
  });

  const role = registerForm.watch("role");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="auth-panel relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="mx-auto mt-16 max-w-md text-center">
          <h1 className="text-4xl font-extrabold">
            {tab === "login" ? "Welcome Back!" : "Join JobVerse"}
          </h1>
          <p className="mt-3 text-white/80">
            {tab === "login"
              ? "Continue your journey with JobVerse."
              : "Create an account to start matching with the right roles."}
          </p>
          <div className="mx-auto mt-10 h-64 w-64 rounded-full bg-white/10 p-8">
            <div className="grid h-full place-items-center rounded-full bg-white/10 text-6xl">
              👩‍💻
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <div className="mb-6 flex rounded-full bg-surface p-1">
            <button
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${tab === "login" ? "bg-white shadow" : "text-muted"}`}
              onClick={() => setTab("login")}
            >
              Sign In
            </button>
            <button
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${tab === "register" ? "bg-white shadow" : "text-muted"}`}
              onClick={() => setTab("register")}
            >
              Sign Up
            </button>
          </div>

          {tab === "login" ? (
            <form
              className="space-y-4"
              onSubmit={loginForm.handleSubmit((values) => login.mutate(values))}
            >
              <Field label="Email address" error={loginForm.formState.errors.email?.message}>
                <Input type="email" placeholder="you@email.com" {...loginForm.register("email")} />
              </Field>
              <Field label="Password" error={loginForm.formState.errors.password?.message}>
                <Input type="password" placeholder="Enter your password" {...loginForm.register("password")} />
              </Field>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted">
                  <input type="checkbox" /> Remember me
                </label>
                <Link to="/forgot-password" className="text-brand-700">
                  Forgot password?
                </Link>
              </div>
              {login.error ? (
                <p className="text-sm text-rose-500">{(login.error as Error).message}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={registerForm.handleSubmit((values) => registerMut.mutate(values))}
            >
              <Field label="Full name" error={registerForm.formState.errors.fullName?.message}>
                <Input {...registerForm.register("fullName")} />
              </Field>
              <Field label="Email address" error={registerForm.formState.errors.email?.message}>
                <Input type="email" {...registerForm.register("email")} />
              </Field>
              <Field label="Password" error={registerForm.formState.errors.password?.message}>
                <Input type="password" {...registerForm.register("password")} />
              </Field>
              <Field label="I am a" error={registerForm.formState.errors.role?.message}>
                <Select {...registerForm.register("role")}>
                  <option value="worker">Worker / Job seeker</option>
                  <option value="employer">Employer</option>
                </Select>
              </Field>
              {role === "employer" ? (
                <Field
                  label="Company name"
                  error={registerForm.formState.errors.companyName?.message}
                >
                  <Input {...registerForm.register("companyName")} />
                </Field>
              ) : null}
              {registerMut.error ? (
                <p className="text-sm text-rose-500">{(registerMut.error as Error).message}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={registerMut.isPending}>
                {registerMut.isPending ? "Creating account…" : "Create account"}
              </Button>
            </form>
          )}

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            Or continue with
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setNotice("Social login is not enabled on this API.")}>
              Google
            </Button>
            <Button variant="secondary" onClick={() => setNotice("Social login is not enabled on this API.")}>
              <Github className="h-4 w-4" /> GitHub
            </Button>
          </div>
          {notice ? <p className="mt-3 text-center text-xs text-muted">{notice}</p> : null}
        </div>
      </div>
    </div>
  );
}
