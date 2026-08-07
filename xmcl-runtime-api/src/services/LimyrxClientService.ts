import type { ServiceKey } from './Service'

/**
 * A single file delivered by the Limyrx Client platform.
 */
export interface LimyrxManifestFile {
  /**
   * Path relative to the instance root, e.g. `mods/limyrx.jar` or
   * `config/limyrx.json`. Mods and settings are placed directly into the
   * instance game directory.
   */
  path: string
  /** SHA-1 hex digest of the file content, used to verify the download. */
  sha1: string
}

/**
 * The content bundle for one Minecraft version of the Limyrx Client.
 */
export interface LimyrxManifestVersion {
  /** The Minecraft version this bundle targets, e.g. `1.8.9`. */
  minecraft: string
  /** The Forge version the client runs on, e.g. `1.8.9-11.15.1.2318-1.8.9`. */
  forge: string
  /**
   * Base URL the files are resolved against (`${base}/${file.path}`).
   * Lives in the manifest so the host can move without a launcher update.
   */
  base: string
  /** The mods / settings / resources to install into the instance. */
  files: LimyrxManifestFile[]
}

/**
 * The Limyrx Client manifest: a JSON document hosted on the client's content
 * host (e.g. GitHub Releases / jsDelivr) describing every client version and
 * the files each one needs.
 */
export interface LimyrxManifest {
  id: string
  name: string
  /** Keyed by Minecraft version. */
  versions: Record<string, LimyrxManifestVersion>
}

export interface LimyrxInstallResult {
  installed: number
  minecraft: string
}

export interface LimyrxClientService {
  /**
   * Fetch the Limyrx Client manifest (cached after the first successful load).
   */
  getManifest(): Promise<LimyrxManifest>
  /**
   * Download and verify the content of the given client version into an
   * instance's game directory.
   *
   * @param instancePath The instance root (game directory)
   * @param minecraft The Minecraft version to install (must exist in the manifest)
   */
  installContent(instancePath: string, minecraft: string): Promise<LimyrxInstallResult>
}

export const LimyrxClientServiceKey: ServiceKey<LimyrxClientService> = 'LimyrxClientService'
