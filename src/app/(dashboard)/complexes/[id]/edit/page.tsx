import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditComplexForm from "@/components/features/EditComplexForm";

export default async function EditComplexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "GENERAL_ADMIN") redirect("/dashboard");

  const [complex, domains] = await Promise.all([
    prisma.crmComplex.findUnique({ where: { id } }),
    prisma.crmDomain.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!complex) notFound();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="page-title">עריכת מתחם</h1>
        <p className="text-sm text-dark/50 dark:text-cream/50 mt-1">{complex.name}</p>
      </div>
      <div className="card p-5">
        <EditComplexForm complex={complex} domains={domains} />
      </div>
    </div>
  );
}
