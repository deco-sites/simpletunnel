import { PunchmoleServer } from "https://denopkg.com/mcandeia/punchmole@bb09fd1f66331ff76482bcf8fd1698d7db21503d/PunchmoleServer.ts";

const port = Deno.env.get("PORT");
PunchmoleServer(
  port ? +port : 8000, // port number to listen on
  Deno.env.get("API_KEYS")?.split(",") ?? [], // array of api keys (random strings)
  "/_punchmole", // /_punchmole is the default path
  console, // console, {info: {}, debug: {}, error: {}} for no logs or e.g. an instance of log4js
);
