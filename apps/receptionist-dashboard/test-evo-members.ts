import { createEvoClient } from "@/lib/evo-api";

async function login() {
  const dns = "https://evo-integracao-api.w12app.com.br";
  const apiKey = "6A171482-2158-41F4-9AD5-B75C8F46B013";
  const username = "kaizentraining";

  const evoClient = createEvoClient({
    dns,
    apiKey,
    username,
  });

  console.log("[LOGIN] Autenticando con EVO...");
  const connectionTest = await evoClient.testConnection();
  
  if (!connectionTest.success) {
    console.error("[LOGIN] Error de autenticación:", connectionTest.message);
    return null;
  }
  
  console.log("[LOGIN] Autenticación exitosa");

  console.log("[MEMBERS] Obteniendo miembros activos...");
  const members = await evoClient.getActiveMembers();
  
  if (!members) {
    console.log("[MEMBERS] No se pudieron obtener los miembros o no hay miembros");
    return { totalSocios: 0, membresiasActivas: 0, members: [] };
  }

  const totalSocios = members.length;

  const membresiasActivas = members.filter(member => 
    member.membershipStatus?.toLowerCase() === "active" || 
    member.status?.toLowerCase() === "active"
  ).length;

  console.log("");
  console.log("╔════════════════════════════════════════╗");
  console.log("║           PANEL DE ESTADÍSTICAS        ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║  Total Socios:        ${String(totalSocios).padStart(8)}     ║`);
  console.log(`║  Membresías Activas:  ${String(membresiasActivas).padStart(8)}     ║`);
  console.log("╚════════════════════════════════════════╝");
  console.log("");

  return { 
    totalSocios, 
    membresiasActivas,
    members 
  };
}

login().then(result => {
  console.log("Resultado final:", result);
}).catch(error => {
  console.error("Error:", error);
});
