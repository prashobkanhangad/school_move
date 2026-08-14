import fs from 'fs';
import path from 'path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const URI_FILE = path.resolve(__dirname, '.mongo-uri');

async function isLocalMongoReachable(uri: string): Promise<boolean> {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 1500 });

  try {
    await client.connect();
    await client.db('school_bus_test').command({ ping: 1 });
    return true;
  } catch {
    return false;
  } finally {
    await client.close().catch(() => undefined);
  }
}

export default async function globalSetup(): Promise<(() => Promise<void>) | void> {
  const configuredUrl =
    process.env.INTEGRATION_DATABASE_URL ??
    process.env.DATABASE_URL ??
    'mongodb://127.0.0.1:27017/school_bus_test';

  if (await isLocalMongoReachable(configuredUrl)) {
    fs.writeFileSync(URI_FILE, configuredUrl);
    return;
  }

  const replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      dbName: 'school_bus_test',
      storageEngine: 'wiredTiger',
    },
  });
  await replSet.waitUntilRunning();

  const uri = replSet.getUri('school_bus_test');
  fs.writeFileSync(URI_FILE, uri);

  return async () => {
    await replSet.stop();
    if (fs.existsSync(URI_FILE)) {
      fs.unlinkSync(URI_FILE);
    }
  };
}
