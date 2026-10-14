import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Field, Input, Textarea } from "../components/ui/Input";
import { userService } from "../services/platform.service";
import { useAuthStore } from "../store/authStore";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [message, setMessage] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      return userService.update(user._id, { fullName, phone, location, bio });
    },
    onSuccess: (res) => {
      if (user) setUser({ ...user, ...res.data });
      setMessage("Settings saved.");
    },
    onError: (error: Error) => setMessage(error.message),
  });

  return (
    <div className="max-w-2xl rounded-3xl bg-white p-6 ring-1 ring-line">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <div className="mt-6 space-y-4">
        <Field label="Full name">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label="Bio">
          <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          Save
        </Button>
        {message ? <p className="text-sm text-brand-700">{message}</p> : null}
      </div>
    </div>
  );
}
