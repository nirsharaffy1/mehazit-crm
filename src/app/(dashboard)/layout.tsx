import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import SearchModal from "@/components/features/SearchModal";
import { CrmRole } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-offwhite dark:bg-dark">
      <Sidebar userRole={session.user.role as CrmRole} userName={session.user.name ?? ""} />
      <SearchModal />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
