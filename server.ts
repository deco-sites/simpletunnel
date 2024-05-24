
function generateRandomId(): string {
  return crypto.randomUUID();
}

interface RequestObject {
  id: string;
  requestObject: Request;
  responseObject: Response;
  bodyStream?: TransformStream;
}

export function PunchmoleServer(
  port: number,
  apiKeys: string[],
  endpointUrlPath = "/_punchmole",
  log = console,
) {
  if (apiKeys.filter((v) => v !== "").length === 0) {
    throw new Error("Invalid API keys, please check apiKeys argument");
  }

  const domainsToConnections: Record<string, { status: string; socket: WebSocket }> = {};
  let openRequests: RequestObject[] = [];
  const openWebsocketConnections: Record<string, WebSocket> = {};

  function getRequestObject(id: string) {
    return openRequests.find((v) => v.id === id);
  }

  const handleUpgrade = (req: Request) => {
    const { socket, response } = Deno.upgradeWebSocket(req);
    let domain: string;
    socket.onopen = () => {
      log.info(new Date(), "Client connection open", req.headers, req.url);
    };

    socket.onclose = () => {
      domain && log.info(new Date(), "Connection closed", domain);
      domain && delete domainsToConnections[domain];
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      let request: RequestObject | undefined = undefined;
      if (message.id) {
        request = getRequestObject(message.id);
      }
      switch (message.type) {
        case "register":
          if (apiKeys.includes(message.apiKey)) {
            log.info(new Date(), "Registering socket for domain", message);
            domainsToConnections[message.domain] = {
              status: "alive",
              socket: socket,
            };
            domain = message.domain;
            socket.send(
              JSON.stringify({ type: "registered", domain: message.domain }),
            );
          } else {
            log.error(
              new Date(),
              "Given API key is wrong/not recognised, stopping connection",
              message,
            );
            await socket.send(
              JSON.stringify({ type: "error", message: "Invalid API key" }),
            );
            socket.close();
          }
          break;
        case "response-start":
          log.info(
            new Date(),
            "Response start, request ID",
            message.id,
            message.headers,
          );
          if (request) {
            request.responseObject.headers.set("status", message.statusCode);
            request.responseObject.headers.set("statusMessage", message.statusMessage);
            // @ts-ignore: "trust-me"
            Object.entries(message.headers).forEach(([key, value]: [string, string]) => {
              request.responseObject.headers.set(key, value);
            });
            request.requestObject?.signal?.addEventListener?.("abort", () => {
              log.info(
                new Date(),
                "Connection closed, stop sending data",
                message.id,
              );
              openRequests = openRequests.filter((v) => v.id !== message.id);
              socket.send(
                JSON.stringify({ type: "request-end", id: message.id }),
              );
            });
          } else {
            log.error(
              new Date(),
              "Didn't find response object, probably dead?",
            );
          }
          break;
        case "data":
          if (request) {
            const data = new Uint8Array(message.data);
            try {
              await request.bodyStream?.writable.getWriter().write(data);
            } catch (err) {
              console.log("Request was aborted");
            }
          } else {
            log.error(
              new Date(),
              "Didn't find response object, unable to send data",
              message.id,
            );
          }
          break;
        case "data-end":
          log.info(
            new Date(),
            "Finishing sending data for request",
            message.id,
          );
          if (request) {
            request.bodyStream?.writable?.close();
          } else {
            log.error(
              new Date(),
              "Didn't find response object, unable to send data",
            );
          }
          break;
        case "websocket-connection-closed":
          try {
            openWebsocketConnections[message.id].close();
          } catch (e) {
            log.info(
              new Date(),
              "Error closing websocket connection, probably already closed",
              message.id,
              e,
            );
          }
          break;
        case "websocket-message":
          const userSocket = openWebsocketConnections[message.id];
          if (userSocket) {
            log.debug(
              new Date(),
              "Sending websocket message received from proxied service to client",
              message.id,
            );
            userSocket.send(message.rawData);
          }
          break;
      }
    };

    socket.onerror = (err) => {
      log.error(new Date(), "WebSocket error", err);
    };
    return response;
  };

  const handleRequest = async (req: Request): Promise<Response> => {
    if (req.url.endsWith(endpointUrlPath)) {
      return handleUpgrade(req);
    } else {
      const requestedDomain = new URL(req.url).hostname;
      const foreignHost = domainsToConnections[requestedDomain];

      log.debug(new Date(), "Request started for", requestedDomain, req.method, req.url);

      if (foreignHost && foreignHost.status === "alive") {
        log.debug(new Date(), "-> Found endpoint", req.url, req.headers);

        const requestForward = {
          type: "request-start",
          date: new Date(),
          domain: requestedDomain,
          id: generateRandomId(),
          method: req.method,
          url: new URL(req.url).pathname,
          headers: [...req.headers.entries()].reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>),
          body: await req.text(),
        };

        log.debug(new Date(), "-> Forward to remote client", JSON.stringify(requestForward));
        // Create a writable stream using TransformStream
        const stream = new TransformStream();
        const resp = new Response(stream.readable);
        openRequests.push({
          ...requestForward,
          requestObject: req,
          responseObject: resp,
        });

        foreignHost.socket.send(JSON.stringify(requestForward));

        req.body?.getReader().read().then(({ value }) => {
          if (value) {
            log.debug(new Date(), "--> Request data received", requestForward.id, value.length);
            foreignHost.socket.send(JSON.stringify({
              type: "request-data",
              date: new Date(),
              id: requestForward.id,
              data: value,
            }));
          }
        }).catch(() => {
          log.debug(new Date(), "--> Request data reception ended", requestForward.id);
          foreignHost.socket.send(JSON.stringify({
            type: "request-data-end",
            date: new Date(),
            id: requestForward.id,
          }));
        });

        return resp;
      } else {
        return new Response("No registration for domain and/or remote service not available", { status: 503 });
      }
    }
  };

  Deno.serve({ handler: handleRequest, port });

  log.info(new Date(), `Server is listening on port ${port}`);
}