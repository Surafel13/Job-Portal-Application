import { BriefcaseBusiness, GraduationCap, MapPin, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { formatDate, titleCase } from "../../lib/format";
import type { User, WorkerProfile } from "../../types/models";

export function WorkerProfileOverview({
  user,
  profile,
  categories = [],
  actions,
}: {
  user: User;
  profile: WorkerProfile;
  categories?: Array<{ _id: string; name: string }>;
  actions?: ReactNode;
}) {
  const categoryNames = profile.categoryIds.map(
    (id) => categories.find((category) => category._id === id)?.name ?? "Specialty",
  );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              name={user.fullName}
              src={user.profileImage}
              className="h-16 w-16 text-lg"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold">{user.fullName}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="h-4 w-4 shrink-0" />
                {profile.location || user.location || "Location not provided"}
              </p>
            </div>
          </div>
          {actions}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categoryNames.map((name, index) => (
            <Badge key={`${profile.categoryIds[index] ?? name}-${index}`} tone="violet">
              {name}
            </Badge>
          ))}
          {profile.preferredWorkTypes.map((type) => (
            <Badge key={type} tone="blue">
              {titleCase(type)}
            </Badge>
          ))}
        </div>
        <div className="mt-5 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
          {user.email ? <p><span className="font-semibold">Email:</span> {user.email}</p> : null}
          {user.phone ? <p><span className="font-semibold">Phone:</span> {user.phone}</p> : null}
          {profile.availableFrom ? (
            <p><span className="font-semibold">Available from:</span> {formatDate(profile.availableFrom)}</p>
          ) : null}
          {profile.minimumSalary != null || profile.maximumSalary != null ? (
            <p>
              <span className="font-semibold">Salary range:</span>{" "}
              {profile.minimumSalary != null ? `$${profile.minimumSalary.toLocaleString()}` : "Any"}
              {" – "}
              {profile.maximumSalary != null ? `$${profile.maximumSalary.toLocaleString()}` : "Any"}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <UserRound className="h-5 w-5 text-brand-600" />
          About
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
          {profile.professionalSummary || user.bio || "No professional summary added yet."}
        </p>
        {profile.website || profile.linkedin || profile.github ? (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-brand-700">
            {profile.website ? <a href={profile.website} target="_blank" rel="noreferrer">Website</a> : null}
            {profile.linkedin ? <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> : null}
            {profile.github ? <a href={profile.github} target="_blank" rel="noreferrer">GitHub</a> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="text-lg font-bold">Skills</h2>
        {profile.skills.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill.skillId}
                className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700"
              >
                {skill.name}
                {skill.level ? <span className="ml-1.5 text-xs text-muted">· {titleCase(skill.level)}</span> : null}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No skills added yet.</p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <BriefcaseBusiness className="h-5 w-5 text-brand-600" />
          Experience
        </h2>
        <div className="mt-4 space-y-4">
          {profile.experience.length ? profile.experience.map((item, index) => (
            <article key={`${item.company}-${item.jobTitle}-${index}`} className="border-l-2 border-brand-100 pl-4">
              <h3 className="font-semibold">{item.jobTitle}</h3>
              <p className="text-sm text-muted">
                {item.company}{item.location ? ` · ${item.location}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatDate(item.startDate)} – {item.isCurrent ? "Present" : formatDate(item.endDate)}
              </p>
              {item.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{item.description}</p> : null}
            </article>
          )) : <p className="text-sm text-muted">No experience added yet.</p>}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <GraduationCap className="h-5 w-5 text-brand-600" />
          Education
        </h2>
        <div className="mt-4 space-y-4">
          {profile.education.length ? profile.education.map((item, index) => (
            <article key={`${item.institution}-${item.degree}-${index}`}>
              <h3 className="font-semibold">{item.degree}{item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ""}</h3>
              <p className="text-sm text-muted">{item.institution}</p>
              {item.startDate || item.endDate ? (
                <p className="mt-1 text-xs text-muted">
                  {formatDate(item.startDate)} – {formatDate(item.endDate)}
                </p>
              ) : null}
              {item.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{item.description}</p> : null}
            </article>
          )) : <p className="text-sm text-muted">No education added yet.</p>}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="text-lg font-bold">Job preferences</h2>
        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold">Employment type</p>
            <p className="mt-1 text-muted">
              {profile.preferredJobTypes.length ? profile.preferredJobTypes.map(titleCase).join(", ") : "Not specified"}
            </p>
          </div>
          <div>
            <p className="font-semibold">Preferred locations</p>
            <p className="mt-1 text-muted">
              {profile.preferredLocations.length ? profile.preferredLocations.join(", ") : "Not specified"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
