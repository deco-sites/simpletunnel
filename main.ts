import { PunchmoleServer } from "https://esm.sh/gh/mcandeia/punchmole@c2246eaeae94451b913dc23113c28e79a4936406/PunchmoleServer.js";


const port = Deno.env.get("PORT");
PunchmoleServer(
  port ? +port : 8000, // port number to listen on
  Deno.env.get("API_KEYS")?.split(",") ?? [], // array of api keys (random strings)
  "/_punchmole", // /_punchmole is the default path
  console, // console, {info: {}, debug: {}, error: {}} for no logs or e.g. an instance of log4js
);
