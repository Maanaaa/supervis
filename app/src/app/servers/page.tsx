import { connectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { ServerGrid } from '@/components/servers/ServerGrid';
import type { IServer } from '@/types/server';

export const dynamic = 'force-dynamic';

export default async function ServersPage() {
  let initialServers: IServer[] = [];

  try {
    await connectDB();
    const docs = await Server.find().sort({ createdAt: -1 });
    initialServers = JSON.parse(JSON.stringify(docs));
  } catch (error) {
    console.error('[ServersPage SSR] Erreur lors du chargement des serveurs :', error);
  }

  return (
    <div>
      <ServerGrid initialServers={initialServers} />
    </div>
  );
}
