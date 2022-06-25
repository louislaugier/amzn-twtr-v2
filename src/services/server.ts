import { Express } from 'express'
import { dealsGET } from '../controllers/Deal';

export const initRoutes = (server: Express): void => {
	server.get('/deals', dealsGET);

	server.use('/api/v1', server)
}