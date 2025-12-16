import { redirect } from "next/navigation";
import { FeatureCard } from "@/components/layout/FeatureCard";
import { getServerSession } from "@/lib/auth/server/getServerSession";

export default async function AdminDashboardPage() {
  const { user } = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  // ADMIN-ONLY ENFORCEMENT
  if (user.role !== "admin") {
    // Logged in but not an admin → send to normal dashboard
    redirect("/dashboard");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Admin Area</h1>
      <p className="mt-4">
        This is an example of an admin-only route using role-based access control on top of
        authentication.
      </p>
      <p>Your account details, fetched from the accessToken inside the Cookies</p>
      <div className="mt-4">
        <FeatureCard title="">
          <pre>
            {JSON.stringify(
              {
                userId: user.id,
                email: user.email,
                role: user.role,
              },
              null,
              2,
            )}
          </pre>
        </FeatureCard>
      </div>
    </main>
  );
}
