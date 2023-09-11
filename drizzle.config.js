export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "libsql",
  dbCredentials: {
    url: "file:./database.db",
  },
};
