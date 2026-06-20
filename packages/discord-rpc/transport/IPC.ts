import { CUSTOM_RPC_ERROR_CODE, Transport, type TransportOptions } from '../structures/Transport'
import { RPCError } from '../utils/RPCError'
import { randomUUID } from 'crypto'
import path from 'path'
import net from 'net'
import fs from 'fs'

export enum IPC_OPCODE {
  HANDSHAKE,
  FRAME,
  CLOSE,
  PING,
  PONG,
}

export type FormatFunction = (id: number) => [path: string, skipCheck?: boolean]

export type IPCTransportOptions = {
  pathList?: FormatFunction[]
} & TransportOptions

const defaultPathList: FormatFunction[] = [
  (id: number): [string, boolean] => {
    // Windows path

    const isWindows = process.platform === 'win32'

    return [isWindows ? `\\\\?\\pipe\\discord-ipc-${id}` : '', isWindows]
  },
  (id: number): [string] => {
    // macOS / Linux path

    if (process.platform === 'win32') return ['']

    const {
      env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP },
    } = process

    const prefix = fs.realpathSync(XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`)
    return [path.join(prefix, `discord-ipc-${id}`)]
  },
  (id: number): [string] => {
    // snap

    if (process.platform === 'win32') return ['']

    const {
      env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP },
    } = process

    const prefix = fs.realpathSync(XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`)
    return [path.join(prefix, 'snap.discord', `discord-ipc-${id}`)]
  },
  (id: number): [string] => {
    // flatpak

    if (process.platform === 'win32') return ['']

    const {
      env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP },
    } = process

    const prefix = fs.realpathSync(XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`)
    return [path.join(prefix, 'app', 'com.discordapp.Discord', `discord-ipc-${id}`)]
  },
]

const createSocket = async (path: string): Promise<net.Socket> => {
  return new Promise((resolve, reject) => {
    const onError = (e: any) => {
      socket.removeListener('conect', onConnect)
      reject(e)
    }

    const onConnect = () => {
      socket.removeListener('error', onError)
      resolve(socket)
    }

    const socket = net.createConnection(path)

    socket.once('connect', onConnect)
    socket.once('error', onError)
  })
}

export class IPCTransport extends Transport {
  pathList: FormatFunction[] = defaultPathList

  private socket?: net.Socket

  get isConnected() {
    return this.socket !== undefined && this.socket.readyState === 'open'
  }

  constructor(options: IPCTransportOptions) {
    super(options)

    this.pathList = options.pathList ?? this.pathList
  }

  private async getSocket(): Promise<net.Socket> {
    if (this.socket) return this.socket

    const pathList = this.pathList
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      for (const formatFunc of pathList) {
        const tryCreateSocket = async (path: string) => {
          const socket = await createSocket(path).catch(() => undefined)
          return socket
        }

        const handleSocketId = async (id: number): Promise<net.Socket | undefined> => {
          const [socketPath, skipCheck] = formatFunc(id)

          if (!socketPath || socketPath.trim() === '') return undefined

          if (!skipCheck && !fs.existsSync(path.dirname(socketPath))) return

          const socket = await tryCreateSocket(socketPath)
          return socket
        }

        if (this.client.pipeId) {
          const socket = await handleSocketId(this.client.pipeId)
          if (socket) {
            resolve(socket)
            break
          }
        } else {
          for (let i = 0; i < 10; i++) {
            const socket = await handleSocketId(i)
            if (socket) {
              resolve(socket)
              break
            }
          }
        }
      }

      reject(new RPCError(CUSTOM_RPC_ERROR_CODE.RPC_COULD_NOT_CONNECT, 'Could not connect'))
    })
  }

  async connect(): Promise<void> {
    if (!this.socket) {
      this.socket = await this.getSocket().catch((err) => {
        throw err
      })
    }

    this.emit('open')

    this.send(
      {
        v: 1,
        client_id: this.client.clientId,
      },
      IPC_OPCODE.HANDSHAKE,
    )

    // Accumulation buffer for partial/incomplete IPC frames
    let buffer = Buffer.alloc(0)

    this.socket.on('data', (chunk) => {
      this.client.emit(
        'debug',
        `SERVER => CLIENT | ${chunk
          .toString('hex')
          .match(/.{1,2}/g)
          ?.join(' ')
          .toUpperCase()}`,
      )

      // Append new data to the accumulation buffer
      buffer = Buffer.concat([buffer, chunk])

      // Process as many complete frames as possible
      while (buffer.length >= 8) {
        const length = buffer.readUInt32LE(4)
        const frameSize = 8 + length

        if (buffer.length < frameSize) {
          // Wait for more data
          break
        }

        const op = buffer.readUInt32LE(0)
        let parsedData: any = undefined

        if (length > 0) {
          try {
            parsedData = JSON.parse(buffer.subarray(8, frameSize).toString())
          } catch (e) {
            this.client.emit('debug', 'Failed to parse IPC frame', e)
            // Skip malformed frame
            buffer = buffer.subarray(frameSize)
            continue
          }
        }

        this.client.emit('debug', `SERVER => CLIENT | OPCODE.${IPC_OPCODE[op]} |`, parsedData)

        switch (op) {
          case IPC_OPCODE.FRAME: {
            this.emit('message', parsedData)
            break
          }
          case IPC_OPCODE.CLOSE: {
            this.emit('close', parsedData)
            break
          }
          case IPC_OPCODE.PING: {
            this.send(parsedData, IPC_OPCODE.PONG)
            this.emit('ping')
            break
          }
        }

        // Remove the processed frame from the buffer
        buffer = buffer.subarray(frameSize)
      }
    })

    this.socket.on('close', () => {
      this.socket = undefined
      this.emit('close', 'Closed by Discord')
    })
  }

  send(message?: any, op: IPC_OPCODE = IPC_OPCODE.FRAME): void {
    this.client.emit('debug', `CLIENT => SERVER | OPCODE.${IPC_OPCODE[op]} |`, message)

    const dataBuffer = message ? Buffer.from(JSON.stringify(message)) : Buffer.alloc(0)

    const packet = Buffer.alloc(8)
    packet.writeUInt32LE(op, 0)
    packet.writeUInt32LE(dataBuffer.length, 4)

    this.socket?.write(Buffer.concat([packet, dataBuffer]))
  }

  ping(): void {
    this.send(randomUUID(), IPC_OPCODE.PING)
  }

  close(): Promise<void> {
    if (!this.socket) return new Promise((resolve) => resolve())

    return new Promise((resolve) => {
      this.socket!.once('close', () => {
        this.emit('close', 'Closed by client')
        this.socket = undefined
        resolve()
      })
      this.socket!.end()
    })
  }
}
