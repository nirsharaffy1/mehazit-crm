import { PrismaClient, CrmRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── תחומים ──────────────────────────────────────────────────────────────────
  const [tzafon, merkaz, darom] = await Promise.all(
    ["צפון", "מרכז", "דרום"].map((name) =>
      prisma.crmDomain.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  // ── סיסמאות ──────────────────────────────────────────────────────────────────
  const adminPass  = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
  const teamPass   = process.env.SEED_TEAM_PASSWORD  ?? "Mehazit2024!";
  const adminHash  = await bcrypt.hash(adminPass, 12);
  const teamHash   = await bcrypt.hash(teamPass,  12);

  // ── מנהלים כלליים ────────────────────────────────────────────────────────────
  await upsertUser({ email: "nir@mehazit.co.il",   fullName: "ניר שרפי",  role: CrmRole.GENERAL_ADMIN, hash: adminHash });
  await upsertUser({ email: "sahar@mehazit.co.il", fullName: "סהר עיני", role: CrmRole.GENERAL_ADMIN, hash: adminHash, phone: "050-669-4049" });

  // ── מנהלי תחום ───────────────────────────────────────────────────────────────
  // אסף כהן — אין אימייל/טלפון באתר, נוצר אימייל זמני
  await upsertUser({ email: "asaf.cohen@mehazit.co.il", fullName: "אסף כהן",   role: CrmRole.DOMAIN_MANAGER, hash: teamHash, domainId: tzafon.id });
  await upsertUser({ email: "a0553072029@gmail.com",    fullName: "שלום שלמה", role: CrmRole.DOMAIN_MANAGER, hash: teamHash, domainId: merkaz.id, phone: "055-307-2029" });
  await upsertUser({ email: "rmon18@gmail.com",         fullName: "דובי רמון", role: CrmRole.DOMAIN_MANAGER, hash: teamHash, domainId: darom.id,  phone: "052-589-0077" });

  // ── מנהלי אזור — תחום צפון ──────────────────────────────────────────────────
  await upsertUser({ email: "shalom.dahan@mehazit.co.il",  fullName: "שלום דהן",    role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: tzafon.id, phone: "050-813-1720" });
  await upsertUser({ email: "shimon.malka@mehazit.co.il",  fullName: "שמעון מלכה",  role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: tzafon.id });
  await upsertUser({ email: "david.levi@mehazit.co.il",    fullName: "דוד לוי",     role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: tzafon.id });
  await upsertUser({ email: "Shimonmazuz16@gmail.com",     fullName: "שמעון מזוז",  role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: tzafon.id, phone: "054-976-4543" });
  await upsertUser({ email: "Doron683@gmail.com",          fullName: "דורון בצלאלי",role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: tzafon.id, phone: "053-306-6696" });
  await upsertUser({ email: "moshe.azulai@mehazit.co.il",  fullName: "משה אזולאי",  role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: tzafon.id, phone: "050-682-4150" });

  // ── מנהלי אזור — תחום מרכז ──────────────────────────────────────────────────
  await upsertUser({ email: "pinidikla@gmail.com",         fullName: "פנחס צרפתי",  role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: merkaz.id, phone: "054-264-8070" });
  await upsertUser({ email: "Naomahamy@gmail.com",         fullName: "נאור נחימי",   role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: merkaz.id, phone: "050-907-7188" });
  await upsertUser({ email: "Israel0529540028@gmail.com",  fullName: "ישראל פרץ",   role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: merkaz.id, phone: "052-954-0028" });
  await upsertUser({ email: "idanyazma9@gmail.com",        fullName: "עידן יאומה",  role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: merkaz.id, phone: "054-311-6330" });
  await upsertUser({ email: "Daniel.sahalo@gmail.com",     fullName: "דניאל סהלו",  role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: merkaz.id, phone: "052-882-0290" });
  await upsertUser({ email: "Yakovben467@gmail.com",       fullName: "יעקב מחרוחי", role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: merkaz.id, phone: "052-260-6920" });

  // ── מנהלי אזור — תחום דרום ──────────────────────────────────────────────────
  await upsertUser({ email: "eliav80@gmail.com",       fullName: "אליאב מגידיש",    role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: darom.id,  phone: "055-999-9908" });
  await upsertUser({ email: "Matan@yszinvest.com",     fullName: "מתן גואטה",       role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: darom.id,  phone: "050-923-8565" });
  await upsertUser({ email: "Politic123@ukr.net",      fullName: "אלכס סורולוביץ",  role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: darom.id,  phone: "054-799-0777" });
  await upsertUser({ email: "guycohen052@gmail.com",   fullName: "גיא כהן",         role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: darom.id,  phone: "052-637-8094" });
  await upsertUser({ email: "Shilo889@gmail.com",      fullName: "שילה כהן",        role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: darom.id,  phone: "052-396-2161" });
  await upsertUser({ email: "Y0548433599@gmail.com",   fullName: "יהושע ענתבי",    role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: darom.id,  phone: "058-772-2503" });
  await upsertUser({ email: "Israellev94@gmail.com",   fullName: "ישראל מלקוביץ",  role: CrmRole.AREA_MANAGER, hash: teamHash, domainId: darom.id,  phone: "053-362-9054" });

  const total = 2 + 3 + 19;
  console.log(`Seeded ${total} users across 3 domains.`);
}

async function upsertUser({
  email, fullName, role, hash, domainId, phone,
}: {
  email: string; fullName: string; role: CrmRole;
  hash: string; domainId?: string; phone?: string;
}) {
  await prisma.crmUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: hash, fullName, role, domainId, phone },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
