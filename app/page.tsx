import { isAuthenticated } from "@/lib/auth";
import Dashboard from "./ui";
import { redirect } from "next/navigation";
export default async function Home() {
  if (!(await isAuthenticated())) redirect("/login");
  return <Dashboard />;
}
