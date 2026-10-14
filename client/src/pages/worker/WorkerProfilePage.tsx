import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { ErrorState, Spinner } from "../../components/ui/States";
import { queryKeys } from "../../lib/queryKeys";
import { resumeService } from "../../services/jobs.service";
import { userService, workerService } from "../../services/platform.service";
import { useAuthStore } from "../../store/authStore";

export function WorkerProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState(user?.location ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [message, setMessage] = useState("");

  const worker = useQuery({
    queryKey: queryKeys.worker,
    queryFn: async () => {
      const res = await workerService.me();
      setSummary(res.data.professionalSummary ?? "");
      setLocation(res.data.location ?? user?.location ?? "");
      return res.data;
    },
  });

  const resumes = useQuery({
    queryKey: queryKeys.resumes,
    queryFn: () => resumeService.list().then((r) => r.data ?? []),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (user) {
        const updated = await userService.update(user._id, { fullName, location });
        setUser({ ...user, ...updated.data });
      }
      return workerService.update({
        professionalSummary: summary,
        location,
      });
    },
    onSuccess: () => {
      setMessage("Profile updated.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.worker });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const upload = useMutation({
    mutationFn: (file: File) => resumeService.upload(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.resumes }),
    onError: (error: Error) => setMessage(error.message),
  });

  if (worker.isLoading) return <Spinner />;
  if (worker.isError) {
    return (
      <ErrorState
        message={(worker.error as Error).message}
        onRetry={() => void worker.refetch()}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <h1 className="text-2xl font-extrabold">My Profile</h1>
        <p className="text-sm text-muted">Keep this current so recommendations stay accurate.</p>
        <div className="mt-6 space-y-4">
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Professional summary">
            <Textarea rows={6} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </Field>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
          {message ? <p className="text-sm text-brand-700">{message}</p> : null}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">Resumes</h2>
          <input
            type="file"
            accept=".pdf,.docx"
            className="mt-3 text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
            }}
          />
          <ul className="mt-4 space-y-2 text-sm">
            {(resumes.data ?? []).map((resume) => (
              <li key={resume._id} className="rounded-2xl bg-surface px-3 py-2">
                {resume.originalName}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <p className="text-sm text-muted">Profile completion</p>
          <p className="text-3xl font-extrabold">{worker.data?.profileCompletion ?? 0}%</p>
        </div>
      </aside>
    </div>
  );
}
