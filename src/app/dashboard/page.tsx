import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server/getServerSession";
import { FeatureCard } from "@/components/layout/FeatureCard";

export default async function DashboardPage() {
  const { user } = await getServerSession();

  // This is now the ONLY auth check
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-4">Protected page. You must be logged in to see this.</p>

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
