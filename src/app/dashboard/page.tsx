import { redirect } from "next/navigation";

/** Kitchen display is now on the home page (Kitchen tab). Redirect to home. */
export default function DashboardPage() {
  redirect("/");
}
