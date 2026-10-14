import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
