import type { Generated } from "kysely";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { LoaderArgs } from "@remix-run/cloudflare";

export interface Env {
  DB: D1Database;
}

interface UserTable {
  id: Generated<number>;
  company_name: string;
  contact_name: string;
}

interface Database {
  users: UserTable;
}

export async function loader({ request, context }: LoaderArgs) {
  console.log("loader ~ context:", context);
  const { searchParams } = new URL(request.url);
  console.log("fetch ~ searchParams:", searchParams);
  const action = searchParams.get("action");
  const id = searchParams.get("id");
  const companyName = searchParams.get("company_name");
  const contactName = searchParams.get("contact_name");
  console.log("loader ~ context.DB:", context.DB);
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.DB }),
  });

  switch (action) {
    case "get": {
      if (!id) {
        return new Response('"id" search param is not defined', {
          status: 400,
        });
      }
      if (isNaN(Number(id))) {
        return new Response('"id" search param is not a number', {
          status: 400,
        });
      }
      console.log("fetch ~ id:", id);
      const result = await db
        .selectFrom("users")
        .selectAll()
        .where("id", "=", Number(id))
        .executeTakeFirst();
      if (!result) {
        return new Response('No user found with the provided "id"', {
          status: 404,
        });
      }
      return new Response(String(result.contact_name));
    }

    case "set": {
      if (!id) {
        return new Response('"id" search param is not defined', {
          status: 400,
        });
      }
      if (isNaN(Number(id))) {
        return new Response('"id" search param is not a number', {
          status: 400,
        });
      }
      if (!contactName) {
        return new Response('"contact_name" search param is not defined', {
          status: 400,
        });
      }
      if (!companyName) {
        return new Response('"company_name" search param is not defined', {
          status: 400,
        });
      }
      try {
        await db
          .insertInto("users")
          .values([
            {
              id: Number(id),
              company_name: companyName,
              contact_name: contactName,
            },
          ])
          .onConflict((oc) =>
            oc.column("id").doUpdateSet({
              company_name: companyName,
              contact_name: contactName,
            })
          )
          .execute();

        const newUser = await db
          .selectFrom("users")
          .selectAll()
          .where("id", "=", Number(id))
          .executeTakeFirst();
        if (!newUser) {
          return new Response("There was an error saving this new user", {
            status: 404,
          });
        }

        return new Response(
          `New user created with the name: ${newUser?.contact_name}`,
          { status: 200 }
        );
      } catch (err) {
        console.log(err);
        console.log((err as any).cause);
        throw err;
      }
    }

    case "delete": {
      if (!id) {
        return new Response('"id" search param is not defined', {
          status: 400,
        });
      }
      if (isNaN(Number(id))) {
        return new Response('"id" search param is not a number', {
          status: 400,
        });
      }

      const user = await db
        .selectFrom("users")
        .selectAll()
        .where("id", "=", Number(id))
        .executeTakeFirst();
      if (!user) {
        return new Response('No user found with the provided "id"', {
          status: 404,
        });
      }

      await db.deleteFrom("users").where("id", "=", Number(id)).execute();
      return new Response(
        `User ${user.contact_name} was successfully deleted`,
        { status: 200 }
      );
    }
  }

  return new Response(`Action must be get/set/delete`, { status: 400 });
}
