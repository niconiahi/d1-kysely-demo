import type { AppLoadContext } from "@remix-run/cloudflare";
import type { Generated } from "kysely";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export interface Env {
  DB: D1Database;
}

interface UserTable {
  id: Generated<number>;
  company_name: string;
  contact_name: string;
}

export interface Database {
  users: UserTable;
}

export function getDb(context: AppLoadContext) {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: context.DB }),
  });
}
