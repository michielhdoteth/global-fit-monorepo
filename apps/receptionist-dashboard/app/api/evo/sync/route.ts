import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const evoSettings = await prisma.evoSettings.findFirst();

    if (!evoSettings?.dns || !evoSettings.apiKey || !evoSettings.isEnabled) {
      return NextResponse.json(
        { error: 'Evo no está configurado o está deshabilitado' },
        { status: 400 }
      );
    }

    const response = await fetch(`${evoSettings.dns}/api/members`, {
      headers: {
        'Authorization': `Bearer ${evoSettings.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Evo API error: ${response.statusText}`);
    }

    const evoMembers = await response.json();

    let synced = 0;
    let created = 0;

    for (const member of evoMembers) {
      const existingSync = await prisma.evoSync.findFirst({
        where: { evoMemberId: String(member.id) },
      });

      if (existingSync) {
        await prisma.evoSync.update({
          where: { id: existingSync.id },
          data: { lastSyncAt: new Date(), syncStatus: 'success' },
        });
        synced++;
      } else {
        const client = await prisma.client.findFirst({
          where: {
            OR: [
              { email: member.email },
              { phone: member.phone },
            ],
          },
        });

        if (client) {
          await prisma.evoSync.create({
            data: {
              clientId: client.id,
              evoMemberId: String(member.id),
              lastSyncAt: new Date(),
              syncStatus: 'success',
            },
          });
          created++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${created} nuevos, ${synced} actualizados`,
      synced: created + synced,
    });
  } catch (error) {
    console.error('Evo sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al sincronizar con Evo' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const evoSettings = await prisma.evoSettings.findFirst();

    if (!evoSettings?.dns || !evoSettings.apiKey || !evoSettings.isEnabled) {
      return NextResponse.json({
        configured: false,
        enabled: false,
        syncedClients: 0,
      });
    }

    const syncedClients = await prisma.evoSync.count({
      where: { syncStatus: 'success' },
    });

    return NextResponse.json({
      configured: true,
      enabled: evoSettings.isEnabled,
      dns: evoSettings.dns,
      syncedClients,
    });
  } catch (error) {
    console.error('Evo status error:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de Evo' },
      { status: 500 }
    );
  }
}
