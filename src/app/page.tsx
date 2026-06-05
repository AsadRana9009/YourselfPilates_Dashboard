import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;

  // Check if user is authenticated
  const isAuthenticated = !!authToken;

  if (isAuthenticated) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
