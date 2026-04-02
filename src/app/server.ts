import * as http from 'http';
import { AddressInfo } from 'net';
import { renderAppHtml } from './ui';
import { WorkspaceManager } from './workspaceManager';
import { logger } from '../util/logger';

export type CodeLensServer = {
  port: number;
  close(): Promise<void>;
};

function sendJson(response: http.ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendHtml(response: http.ServerResponse, html: string): void {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
}

async function readJsonBody(request: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function startCodeLensServer(options?: {
  port?: number;
  pickFolder?: () => Promise<string | undefined>;
}): Promise<CodeLensServer> {
  const workspaceManager = new WorkspaceManager();
  const desiredPort = options?.port ?? Number(process.env.PORT || 4310);
  const pickFolder = options?.pickFolder;

  const server = http.createServer(async (request, response) => {
    try {
      const method = request.method || 'GET';
      const requestUrl = new URL(request.url || '/', `http://${request.headers.host || `localhost:${desiredPort}`}`);
      const pathname = requestUrl.pathname || '/';

      if (method === 'GET' && pathname === '/') {
        sendHtml(response, renderAppHtml());
        return;
      }

      if (method === 'POST' && pathname === '/api/workspaces/open') {
        const body = await readJsonBody(request);
        const workspace = await workspaceManager.open(body.folderPath);
        const finalWorkspace = body.reindex ? await workspaceManager.reindex(workspace.folderPath) : workspace;
        sendJson(response, 200, { workspace: finalWorkspace });
        return;
      }

      if (method === 'POST' && pathname === '/api/system/pick-folder') {
        if (!pickFolder) {
          sendJson(response, 501, { error: 'Folder picking is available only in the desktop app.' });
          return;
        }

        const folderPath = await pickFolder();
        sendJson(response, 200, { folderPath });
        return;
      }

      if (method === 'POST' && pathname === '/api/workspaces/reindex') {
        const body = await readJsonBody(request);
        const workspace = await workspaceManager.reindex(body.folderPath);
        sendJson(response, 200, { workspace });
        return;
      }

      if (method === 'GET' && pathname === '/api/nodes') {
        const folderPath = requestUrl.searchParams.get('folderPath') || '';
        const query = requestUrl.searchParams.get('query') || undefined;
        const kind = requestUrl.searchParams.get('kind') || undefined;
        const nodes = workspaceManager.listNodes(folderPath, query, kind);
        sendJson(response, 200, { nodes });
        return;
      }

      const focusMatch = pathname.match(/^\/api\/focus\/(.+)$/);
      if (method === 'GET' && focusMatch) {
        const folderPath = requestUrl.searchParams.get('folderPath') || '';
        const nodeId = decodeURIComponent(focusMatch[1]);
        const focus = await workspaceManager.getFocus(folderPath, nodeId);
        if (!focus) {
          sendJson(response, 404, { error: `Unknown node: ${nodeId}` });
          return;
        }

        const outwardTrace = workspaceManager.getTrace(folderPath, nodeId, 'outward');
        const inwardTrace = workspaceManager.getTrace(folderPath, nodeId, 'inward');
        sendJson(response, 200, { focus, outwardTrace, inwardTrace });
        return;
      }

      sendJson(response, 404, { error: 'Not found' });
    } catch (error) {
      logger.error('Request failed', error);
      const message = error instanceof Error ? error.message : 'Unknown server error';
      sendJson(response, 500, { error: message });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(desiredPort, () => resolve());
  });

  const actualPort = (server.address() as AddressInfo).port;
  logger.info(`Code Lens app running at http://localhost:${actualPort}`);

  return {
    port: actualPort,
    close: () =>
      new Promise<void>((resolve, reject) => {
        workspaceManager.closeAll();
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  };
}

async function runCliServer(): Promise<void> {
  try {
    const instance = await startCodeLensServer();

    process.on('SIGINT', () => {
      instance.close().finally(() => process.exit(0));
    });
  } catch (error: any) {
    if (error?.code === 'EADDRINUSE') {
      const port = Number(process.env.PORT || 4310);
      logger.error(`Port ${port} is already in use. Stop the existing Code Lens server or start with PORT=${port + 1}.`);
      process.exit(1);
      return;
    }

    logger.error('Server failed to start', error);
    process.exit(1);
  }
}

if (require.main === module) {
  void runCliServer();
}
