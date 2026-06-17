import { ServiceKey } from './Service'

export interface SystemModsService {
  /**
   * Install bundled system mods from the app resources into the instance.
   * These mods are packaged inside the launcher ASAR and cannot be deleted by users.
   * Returns the list of installed system file entries.
   */
  installSystemMods(instancePath: string): Promise<Array<{ path: string; sha1: string; source: 'bundled' }>>

  /**
   * Ensure all system mods are present and up-to-date for the given instance.
   * Replaces any missing or outdated mods with the bundled versions.
   */
  ensureSystemMods(instancePath: string): Promise<void>

  /**
   * Get the path to the bundled system mods directory inside the app resources.
   */
  getSystemModsDir(): Promise<string>
}

export const SystemModsServiceKey: ServiceKey<SystemModsService> = 'SystemModsService'
