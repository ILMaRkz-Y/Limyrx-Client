/* eslint-disable no-template-curly-in-string */
import { config as dotenv } from 'dotenv'
import type { Configuration } from 'electron-builder'

dotenv()

export const config = {
  productName: 'Limyrx Client',
  appId: 'limyrx',
  directories: {
    output: 'build/output',
    buildResources: 'build',
    app: '.',
  },
  protocols: {
    name: 'Limyrx',
    schemes: ['limyrx'],
  },
  // assign publish for auto-updater
  // set this to your own repo!
  publish: [{
    provider: 'github',
    owner: 'ILMaRkz-Y',
    repo: 'Limyrx-Client',
  }],
  files: [{
    from: 'dist',
    to: '.',
    filter: ['**/*.js', '**/*.ico', '**/*.png', '**/*.webp', '**/*.svg', '*.node', '*.dll', '**/*.html', '**/*.css', '**/*.woff2', '**/*.wasm', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.mp3', '**/*.wav', '**/*.ogg', '**/*.mp4', '**/*.webm'],
  }, {
    from: '.',
    to: '.',
    filter: 'package.json',
  }],
  // Bundle the Limyrx Client content (mod jars + manifest) into the packaged
  // app so instances can be created fully offline. electron-builder copies it
  // outside app.asar to <resources>/limyrx-client, which the runtime resolves
  // via process.resourcesPath. Adding a mod later = drop the jar into the
  // repo's limyrx-client folder, bump the manifest, rebuild the installer.
  extraResources: [{
    from: '../limyrx-client',
    to: 'limyrx-client',
    filter: ['**/*'],
  }],
  artifactName: 'limyrx-${version}-${platform}-${arch}.${ext}',
  appx: {
    displayName: 'Limyrx Client',
    applicationId: 'limyrx',
    identityName: 'limyrx',
    backgroundColor: 'transparent',
    publisher: process.env.PUBLISHER,
    publisherDisplayName: 'ILMaRkz',
    setBuildNumber: true,
  },
  dmg: {
    artifactName: 'limyrx-${version}-${arch}.${ext}',
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 130,
        y: 150,
        type: 'file',
      },
    ],
  },
  mac: {
    icon: 'icons/dark.icns',
    darkModeSupport: true,
    target: [
      {
        target: 'dmg',
        arch: ['arm64', 'x64'],
      },
    ],
    extendInfo: {
      NSMicrophoneUsageDescription: 'A Minecraft mod wants to access your microphone.',
      NSCameraUsageDescription: 'Please give us access to your camera',
      'com.apple.security.device.audio-input': true,
      'com.apple.security.device.camera': true,
    },
  },
  win: {
    certificateFile: undefined as string | undefined,
    publisherName: 'ILMaRkz',
    icon: 'icons/dark.ico',
    electronLanguages: ['en-US'],
    target: [
      {
        target: 'zip',
        arch: ['x64'],
      },
      'nsis',
    ],
  },
  linux: {
    executableName: 'limyrx',
    electronLanguages: ['en-US'],
    desktop: {
      MimeType: 'x-scheme-handler/limyrx',
      StartupWMClass: 'limyrx',
    },
    category: 'Game',
    icon: 'icons/dark.icns',
    artifactName: 'limyrx-${version}-${arch}.${ext}',
    target: [
      { target: 'deb', arch: ['x64', 'arm64'] },
      { target: 'rpm', arch: ['x64', 'arm64'] },
      { target: 'AppImage', arch: ['x64', 'arm64'] },
      { target: 'tar.xz', arch: ['x64', 'arm64'] },
      { target: 'pacman', arch: ['x64', 'arm64'] },
    ],
  },
  snap: {
    publish: [
      'github',
    ],
  },
} satisfies Configuration
