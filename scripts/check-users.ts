import { prisma } from "../lib/db/client";

async function main() {
  const users = await prisma.user.findMany({
    include: {
      tenant: { select: { name: true, domain: true } },
      accounts: { select: { provider: true, providerAccountId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("ALL USERS:\n");
  users.forEach((u) => {
    console.log("  email:", u.email);
    console.log("    id:", u.id);
    console.log("    role:", u.role || "none");
    console.log("    tenant:", (u.tenant?.name || "none") + " (" + (u.tenant?.domain || "no domain") + ")");
    console.log("    azureAdId:", u.azureAdId || "none");
    console.log("    accounts:", u.accounts.length > 0 ? u.accounts.map((a) => a.provider + ":" + a.providerAccountId.substring(0, 8) + "...").join(", ") : "none");
    console.log("    generation:", u.generation || "none");
    console.log("    sophistication:", u.sophisticationLevel || "none");
    console.log("    created:", u.createdAt.toISOString());
    console.log("");
  });

  console.log("Total:", users.length, "users");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
