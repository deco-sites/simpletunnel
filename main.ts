import { PunchmoleServer } from "https://denopkg.com/mcandeia/punchmole@02041f4a9087703e072879f99c6501ac90af9c6b/PunchmoleServer.ts";

const port = Deno.env.get("PORT");
PunchmoleServer(
  port ? +port : 8000, // port number to listen on
  Deno.env.get("API_KEYS")?.split(",") ?? [], // array of api keys (random strings)
  "/_punchmole", // /_punchmole is the default path
  console, // console, {info: {}, debug: {}, error: {}} for no logs or e.g. an instance of log4js
);
