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
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [message, setMessage] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");

      const payload = {
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        profileImage: profileImage.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      };

      return userService.update(user._id, payload);
    },
    onSuccess: (res) => {
      if (user) setUser({ ...user, ...res.data });
      setMessage("Settings saved.");
    },
    onError: (error: Error) => setMessage(error.message),
  });

  return (
    <div className="max-w-3xl rounded-3xl bg-white p-6 ring-1 ring-line">
      <h1 className="text-2xl font-extrabold">Profile settings</h1>
      <p className="mt-1 text-sm text-muted">
        Match the backend user schema and keep your public profile current.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Full name">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Profile image URL">
            <Input
              type="url"
              value={profileImage}
              placeholder="https://example.com/avatar.jpg"
              onChange={(e) => setProfileImage(e.target.value)}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Bio">
            <Textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
        {message ? <p className="text-sm text-brand-700">{message}</p> : null}
      </div>
    </div>
  );
}
