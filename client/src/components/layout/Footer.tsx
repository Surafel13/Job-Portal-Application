import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Logo />
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} JobVerse. AI-powered career matching.
        </p>
      </div>
    </footer>
  );
}
