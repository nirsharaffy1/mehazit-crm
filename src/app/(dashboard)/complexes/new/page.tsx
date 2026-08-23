import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NewComplexForm from "@/components/features/NewComplexForm";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function NewComplexPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN") redirect("/dashboard");

  const domains = await prisma.crmDomain.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto w-full">
      <Link href="/complexes" className="inline-flex items-center gap-1.5 text-sm text-dark/50 dark:text-cream/50 hover:text-gold transition-colors">
        <ArrowRight size={14} /> חזרה למתחמים
      </Link>
      <h1 className="page-title">מתחם חדש</h1>
      <div className="card p-5">
        <NewComplexForm domains={domains} />
      </div>
    </div>
  );
}
