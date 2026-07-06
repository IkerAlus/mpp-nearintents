import * as http from 'node:http'
import type * as net from 'node:net'

export type TestServer = http.Server & {
  close: () => void
  port: number
  url: string
}

/** Wraps a node HTTP server so tests can tear it down without lingering sockets. */
export function wrapServer(
  server: http.Server,
  options: { port: number; url: string },
): TestServer {
  const sockets = new Set<net.Socket>()
  let closed = false

  server.keepAliveTimeout = 1
  server.maxRequestsPerSocket = 1

  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.setKeepAlive(false)
    socket.on('close', () => sockets.delete(socket))
  })

  const close = () => {
    if (closed) return
    closed = true

    server.unref()
    server.close(() => {})
    server.closeIdleConnections?.()
    server.closeAllConnections?.()

    for (const socket of sockets) {
      socket.unref()
      socket.destroy()
    }
  }

  return Object.assign(server, { close, port: options.port, url: options.url }) as TestServer
}

/** Starts an in-process HTTP server on an ephemeral port. */
export async function createServer(handleRequest: http.RequestListener): Promise<TestServer> {
  const server = http.createServer(handleRequest)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as { port: number }
  return wrapServer(server, { port, url: `http://localhost:${port}` })
}
