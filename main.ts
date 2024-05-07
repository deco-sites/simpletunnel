import { PunchmoleServer } from "https://esm.sh/gh/mcandeia/punchmole@168d33ee3056437e4162fda863386b557197880a/PunchmoleServer.js";

PunchmoleServer(
  Deno.env.get("PORT") ?? 8000, // port number to listen on
  Deno.env.get("API_KEYS")?.split(",") ?? [], // array of api keys (random strings)
  "/_punchmole", // /_punchmole is the default path
  console, // console, {info: {}, debug: {}, error: {}} for no logs or e.g. an instance of log4js
);
