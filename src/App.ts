import 'dotenv/config'
// import express, { Express } from 'express'

// import { initRoutes } from './services/server'
import { initThreads } from './services/threads'

// const server: Express = express()
// const port: number = parseInt(process.env.PORT || '8080')
// server.set('json spaces', 2)

// initRoutes(server)

// server.listen(port, async () => {
	// console.log(`Listening on port ${port}`)
	initThreads()
// })
