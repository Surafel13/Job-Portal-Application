import {
  BriefcaseBusiness,
  ExternalLink,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
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
    (id) =>
      categories.find((category) => category._id === id)?.name ?? "Specialty",
  );

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8 md:p-10">
      {/* 1. Header / Hero Profile Section */}
      <div className="border-b border-line pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <Avatar
              name={user.fullName}
              src={user.profileImage}
              className="h-20 w-20 shrink-0 text-2xl font-bold shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {user.fullName}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted">
                <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
                {profile.location || user.location || "Location not provided"}
              </p>
            </div>
          </div>

          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>

        {/* Categories & Preferred Work Types */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categoryNames.map((name, index) => (
            <Badge
              key={`${profile.categoryIds[index] ?? name}-${index}`}
              tone="violet"
            >
              {name}
            </Badge>
          ))}
          {profile.preferredWorkTypes.map((type) => (
            <Badge key={type} tone="blue">
              {titleCase(type)}
            </Badge>
          ))}
        </div>

        {/* Quick Details Bar */}
        <div className="mt-6 grid gap-4 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
          {user.email ? (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="truncate font-medium text-ink">
                {user.email}
              </span>
            </div>
          ) : null}
          {user.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="font-medium text-ink">{user.phone}</span>
            </div>
          ) : null}
          {profile.availableFrom ? (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted block">
                Available from
              </span>
              <span className="font-semibold text-ink">
                {formatDate(profile.availableFrom)}
              </span>
            </div>
          ) : null}
          {profile.minimumSalary != null || profile.maximumSalary != null ? (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted block">
                Salary expectations
              </span>
              <span className="font-semibold text-ink">
                {profile.minimumSalary != null
                  ? `$${profile.minimumSalary.toLocaleString()}`
                  : "Any"}
                {" – "}
                {profile.maximumSalary != null
                  ? `$${profile.maximumSalary.toLocaleString()}`
                  : "Any"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-10">
        {/* 2. About Section */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-ink">
            <UserRound className="h-4 w-4 text-brand-600" />
            About
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {profile.professionalSummary ||
              user.bio ||
              "No professional summary added yet."}
          </p>

          {profile.website || profile.linkedin || profile.github ? (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-brand-700">
              {profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" /> Website{" "}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {profile.linkedin ? (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  LinkedIn <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {profile.github ? (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  GitHub <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* 3. Skills Section */}
        <section className="border-t border-line pt-8">
          <h2 className="text-base font-bold uppercase tracking-wider text-ink">
            Skills &amp; Competencies
          </h2>
          {profile.skills.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill.skillId}
                  className="inline-flex items-center rounded-full bg-brand-50/70 px-3.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100"
                >
                  {skill.name}
                  {skill.level ? (
                    <span className="ml-1.5 text-[11px] font-medium text-muted">
                      · {titleCase(skill.level)}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No skills added yet.</p>
          )}
        </section>

        {/* 4. Experience Section */}
        <section className="border-t border-line pt-8">
          <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-ink">
            <BriefcaseBusiness className="h-4 w-4 text-brand-600" />
            Experience
          </h2>
          <div className="mt-6 space-y-6">
            {profile.experience.length ? (
              profile.experience.map((item, index) => (
                <article
                  key={`${item.company}-${item.jobTitle}-${index}`}
                  className="relative pl-5 border-l-2 border-brand-200"
                >
                  <h3 className="text-base font-bold text-ink">
                    {item.jobTitle}
                  </h3>
                  <p className="text-sm font-medium text-muted">
                    {item.company}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-brand-700">
                    {formatDate(item.startDate)} –{" "}
                    {item.isCurrent ? "Present" : formatDate(item.endDate)}
                  </p>
                  {item.description ? (
                    <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-muted">No experience added yet.</p>
            )}
          </div>
        </section>

        {/* 5. Education Section */}
        <section className="border-t border-line pt-8">
          <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-ink">
            <GraduationCap className="h-4 w-4 text-brand-600" />
            Education
          </h2>
          <div className="mt-6 space-y-6">
            {profile.education.length ? (
              profile.education.map((item, index) => (
                <article
                  key={`${item.institution}-${item.degree}-${index}`}
                  className="relative pl-5 border-l-2 border-brand-200"
                >
                  <h3 className="text-base font-bold text-ink">
                    {item.degree}
                    {item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ""}
                  </h3>
                  <p className="text-sm font-medium text-muted">
                    {item.institution}
                  </p>
                  {item.startDate || item.endDate ? (
                    <p className="mt-0.5 text-xs font-semibold text-brand-700">
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </p>
                  ) : null}
                  {item.description ? (
                    <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-muted">No education added yet.</p>
            )}
          </div>
        </section>

        {/* 6. Job Preferences Section */}
        <section className="border-t border-line pt-8">
          <h2 className="text-base font-bold uppercase tracking-wider text-ink">
            Job Preferences
          </h2>
          <div className="mt-4 grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <p className="font-bold text-ink">Employment Type</p>
              <p className="mt-1 text-muted">
                {profile.preferredJobTypes.length
                  ? profile.preferredJobTypes.map(titleCase).join(", ")
                  : "Not specified"}
              </p>
            </div>
            <div>
              <p className="font-bold text-ink">Preferred Locations</p>
              <p className="mt-1 text-muted">
                {profile.preferredLocations.length
                  ? profile.preferredLocations.join(", ")
                  : "Not specified"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
