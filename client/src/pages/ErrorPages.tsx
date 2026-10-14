import { Link } from "react-router";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[80vh] place-items-center px-6 text-center">
      <div>
        <p className="text-7xl font-black text-brand-600">404</p>
        <h1 className="mt-4 text-3xl font-extrabold">Page Not Found</h1>
        <p className="mt-2 text-muted">
          The page you are looking for doesn’t exist or has been moved.
        </p>
        <Link to="/">
          <Button className="mt-6">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="grid min-h-[80vh] place-items-center px-6 text-center">
      <div>
        <p className="text-7xl font-black text-brand-600">500</p>
        <h1 className="mt-4 text-3xl font-extrabold">Server Error</h1>
        <p className="mt-2 text-muted">
          Something went wrong on our servers. Please try again later.
        </p>
        <Link to="/">
          <Button className="mt-6">Try Again</Button>
        </Link>
      </div>
    </div>
  );
}
