import { Request, Response } from 'express'

import Deal from '../interfaces/Deal'

import { getDeals } from '../services/Deal'

export const dealsGET = async (req: Request, res: Response): Promise<void> => {
	const deals: Deal[] = await getDeals(req.query)
	res.json(deals)
}