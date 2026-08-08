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
  /**
   * Optional direct download URL (e.g. a GitHub release asset). When
   * present it is tried before `${version.base}/${path}`.
   */
  url?: string
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

/**
 * The state of one installed file compared against the manifest.
 */
export type LimyrxFileUpdateStatus = 'up-to-date' | 'changed' | 'missing'

/**
 * A single file compared between the manifest and the instance disk.
 */
export interface LimyrxFileUpdate {
  /** Path relative to the instance root, e.g. `mods/limyrx.jar`. */
  path: string
  /** The SHA-1 the manifest expects for this file. */
  expected: string
  /** The SHA-1 found on disk, if the file exists. */
  actual?: string
  status: LimyrxFileUpdateStatus
}

/**
 * The result of comparing an instance's installed content against the
 * Limyrx Client manifest for one Minecraft version.
 */
export interface LimyrxContentUpdate {
  minecraft: string
  /** Per-file comparison result. */
  files: LimyrxFileUpdate[]
  /** Files whose SHA-1 differs from the manifest. */
  changed: number
  /** Files that are not present on disk at all. */
  missing: number
  /** Files already matching the manifest. */
  upToDate: number
  /** True when there is anything to download (`changed + missing > 0`). */
  hasUpdate: boolean
}

export interface LimyrxUpdateResult extends LimyrxInstallResult {
  /** Files that were already up to date and were skipped. */
  skipped: number
}

export interface LimyrxClientService {
  /**
   * Fetch the Limyrx Client manifest (cached after the first successful load).
   */
  getManifest(): Promise<LimyrxManifest>
  /**
   * Clear the cached manifest and fetch a fresh copy from the network. Used
   * before update checks so content pushed by the host since the launcher
   * started is picked up.
   */
  refreshManifest(): Promise<LimyrxManifest>
  /**
   * Download and verify the content of the given client version into an
   * instance's game directory.
   *
   * @param instancePath The instance root (game directory)
   * @param minecraft The Minecraft version to install (must exist in the manifest)
   */
  installContent(instancePath: string, minecraft: string): Promise<LimyrxInstallResult>
  /**
   * Compare the installed content of an instance against the manifest for
   * the given Minecraft version. Reads files and hashes them, downloads
   * nothing.
   *
   * @param instancePath The instance root (game directory)
   * @param minecraft The Minecraft version to check (must exist in the manifest)
   */
  checkContentUpdate(instancePath: string, minecraft: string): Promise<LimyrxContentUpdate>
  /**
   * Download and verify only the files that differ from the manifest
   * (`changed` or `missing`). Files already up to date are skipped.
   * Never deletes anything on disk.
   *
   * @param instancePath The instance root (game directory)
   * @param minecraft The Minecraft version to update (must exist in the manifest)
   */
  updateContent(instancePath: string, minecraft: string): Promise<LimyrxUpdateResult>
}

export const LimyrxClientServiceKey: ServiceKey<LimyrxClientService> = 'LimyrxClientService'
