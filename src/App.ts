import 'dotenv/config'
import express, { Express } from 'express'

import { dealsGET } from './controllers/Deal'

import { initCrawler } from './services/utils'

export const app: Express = express()
const port: number | undefined = parseInt(process.env.PORT || '8080')
app.set('json spaces', 2)

app.get('/deals', dealsGET);

app.listen(port, async () => {
	console.log(`Listening on port ${port}`)
	// await initCrawler()
})