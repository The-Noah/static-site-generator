import {IWebSocketServer} from "../lib.ts";

import {serve} from "https://deno.land/std@0.80.0/http/server.ts";
import {acceptWebSocket, WebSocket} from "https://deno.land/std@0.80.0/ws/mod.ts";

const clients: WebSocket[] = [];

async function handleWs(sock: WebSocket){
  clients.push(sock);
}

const start = async (port: number): Promise<void> => {
  console.log(`websocket server is running on :${port}`);
  for await(const req of serve(`:${port}`)){
    const {conn, r: bufReader, w: bufWriter, headers} = req;
    acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    }).then(handleWs).catch(async (err) => {
      console.error(`failed to accept websocket: ${err}`);
      await req.respond({ status: 400 });
    });
  }
};

const send = (message: string): void => {
  clients.forEach((client: WebSocket) => client.send(message));
};

export default {
  start,
  send
} as IWebSocketServer;
