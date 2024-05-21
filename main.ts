import { PunchmoleServer } from "https://esm.sh/gh/mcandeia/punchmole@e295d48d6451934612ab6747b63751fa0dd7d6fe/PunchmoleServer.js";

PunchmoleServer(
  Deno.env.get("PORT") ?? 8000, // port number to listen on
  Deno.env.get("API_KEYS")?.split(",") ?? [], // array of api keys (random strings)
  "/_punchmole", // /_punchmole is the default path
  console, // console, {info: {}, debug: {}, error: {}} for no logs or e.g. an instance of log4js
);
