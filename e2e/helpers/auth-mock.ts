import { createServer, type AddressInfo } from 'net'
import { Server, IncomingMessage, ServerResponse } from 'http'

export interface MsaMockFixtures {
  oauthToken: Record<string, unknown>
  xboxAuthenticate: Record<string, unknown>
  xstsAuthorize: Record<string, unknown>
  minecraftLogin: Record<string, unknown>
  minecraftProfile: Record<string, unknown>
  gameOwnership: Record<string, unknown>
  sessionJoin: { status: number; body: string }
}

const DEFAULT_FIXTURES: MsaMockFixtures = {
  oauthToken: {
    token_type: 'Bearer',
    scope: 'XboxLive.signin XboxLive.offline_access',
    expires_in: 3600,
    ext_expires_in: 3600,
    access_token: 'mock_msa_access_token',
    refresh_token: 'mock_msa_refresh_token',
    id_token: 'mock_id_token',
  },
  xboxAuthenticate: {
    IssueInstant: '2025-01-01T00:00:00Z',
    NotAfter: '2025-02-01T00:00:00Z',
    Token: 'mock_xbox_token',
    DisplayClaims: { xui: [{ uhs: 'mock_user_hash', xid: 'mock_xbox_id' }] },
  },
  xstsAuthorize: {
    IssueInstant: '2025-01-01T00:00:00Z',
    NotAfter: '2025-02-01T00:00:00Z',
    Token: 'mock_xsts_token',
    DisplayClaims: { xui: [{ uhs: 'mock_user_hash', xid: 'mock_xbox_id' }] },
  },
  minecraftLogin: {
    username: 'MockMinecraftUser',
    access_token: 'mock_mc_access_token',
    token_type: 'Bearer',
    expires_in: 86400,
  },
  minecraftProfile: {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'MockMinecraftUser',
    skins: [{ id: 'skin1', state: 'ACTIVE', url: 'http://example.com/skin.png', variant: 'CLASSIC', alias: 'STEVE' }],
    capes: [],
  },
  gameOwnership: {
    items: [{ name: 'game_minecraft', signature: 'mock_sig' }],
    signature: 'mock_ownership_sig',
    keyId: '1',
  },
  sessionJoin: { status: 204, body: '' },
}

export class MsaMockServer {
  private server: Server
  private port = 0
  private fixtures: MsaMockFixtures

  constructor(fixtures?: Partial<MsaMockFixtures>) {
    this.fixtures = { ...DEFAULT_FIXTURES, ...fixtures }
    this.server = createServer((req, res) => this.handleRequest(req, res))
  }

  getBaseUrl() {
    return `http://localhost:${this.port}`
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    const url = req.url ?? ''
    const method = req.method ?? 'GET'

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-SKU, x-client-Ver, client-request-id, return-client-request-id')

    if (method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const json = (data: unknown, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    }

    if (url.includes('/consumers/oauth2/v2.0/token')) {
      json(this.fixtures.oauthToken)
    } else if (url.includes('/user/authenticate')) {
      json(this.fixtures.xboxAuthenticate)
    } else if (url.includes('/xsts/authorize')) {
      json(this.fixtures.xstsAuthorize)
    } else if (url.includes('/authentication/login_with_xbox')) {
      json(this.fixtures.minecraftLogin)
    } else if (url.includes('/minecraft/profile')) {
      json(this.fixtures.minecraftProfile)
    } else if (url.includes('/entitlements/mcstore')) {
      json(this.fixtures.gameOwnership)
    } else if (url.includes('/session/minecraft/join')) {
      res.writeHead(this.fixtures.sessionJoin.status, { 'Content-Type': 'text/plain' })
      res.end(this.fixtures.sessionJoin.body)
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(0, '127.0.0.1', () => {
        this.port = (this.server.address() as AddressInfo).port
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve())
    })
  }
}

let mockServer: MsaMockServer | undefined

export async function installMock(): Promise<string> {
  mockServer = new MsaMockServer()
  await mockServer.start()
  return mockServer.getBaseUrl()
}

export async function uninstallMock(): Promise<void> {
  if (mockServer) {
    await mockServer.stop()
    mockServer = undefined
  }
}

export function createMockFetch(realFetch: typeof fetch, baseUrl: string): typeof fetch {
  const hostMap: Record<string, string> = {
    'login.microsoftonline.com': baseUrl,
    'user.auth.xboxlive.com': baseUrl,
    'xsts.auth.xboxlive.com': baseUrl,
    'api.minecraftservices.com': baseUrl,
    'sessionserver.mojang.com': baseUrl,
  }

  return async (input, init) => {
    const url = typeof input === 'string' ? new URL(input) : input instanceof URL ? input : new URL(input.url)
    const target = hostMap[url.hostname]
    if (target) {
      const mockUrl = new URL(url.pathname + url.search, target)
      const headers = init?.headers ? new Headers(init.headers) : new Headers()
      headers.set('Host', url.hostname)
      return realFetch(mockUrl.toString(), { ...init, headers })
    }
    return realFetch(input, init)
  }
}
