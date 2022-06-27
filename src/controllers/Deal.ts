import { Request, Response } from 'express'

import Deal from '../interfaces/Deal'

import { getRows } from '../utils/PostgreSQL'


export const dealsGET = async (req: Request, res: Response): Promise<void> => {
	const deals: Deal[] = await getRows('deal', req.query)
	res.json(deals)
}