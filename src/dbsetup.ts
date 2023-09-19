import { Db, MongoClient } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDB(dbUri: string, dbName: string): Promise<Db> {
  if (db) {
    return db;
  }

  if (!client) {
    client = new MongoClient(dbUri);
    await client.connect();
  }

  db = client.db(dbName);

  return db;
}

export function disconnectFromDb() {
  client?.close();
}

export function getDb() {
  return db;
}
