import { createApp } from './app'
import { config } from './config'
import { connectMongo } from './db/models'

async function main(): Promise<void> {
    await connectMongo(config.mongoUri)
    const app = await createApp()
    await app.listen({ port: config.port, host: '0.0.0.0' })
}

main().catch((err) => {
    console.error('Failed to start limyrx-api:', err)
    process.exit(1)
})
