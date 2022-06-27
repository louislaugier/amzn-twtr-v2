import { Query } from 'express-serve-static-core'

import db from '../config/PostgreSQL'
import { sleep } from './threads'

export const getRows = async (table: string, query: Query = {}): Promise<any[]> => {
	try {
		let rows: any[] = []
		await db.select().table(table).where(...formatWhere(query)).orderBy(...formatOrderBy(query)).limit(query.limit ?? 10000).offset(query.offset ?? 0).then((res: any[]) => rows = res)

		return rows
	} catch (err: any) {
        console.log("🚀 ~ file: utils.ts ~ line 14 ~ getRows ~ err", err)
		await sleep(0.5)
		return await getRows(table, query)
	}
}

export const insertRows = async (table: string, rows: any[], countRowsAffected: boolean = false): Promise<number> => {
	try {
		let oldCount: number = 0
		let newCount: number = 0
		if (countRowsAffected) oldCount = await getRowsCount(table)

		await db(table).insert(rows).onConflict('id').ignore().then((res: any) => {})

		if (countRowsAffected) {
			newCount = await getRowsCount(table)
			console.log(`Done saving ${rows.length.toString()} new ${table}${rows.length ? 's' : ''}`)
			const rowsAffected: number =  newCount - oldCount
			return rowsAffected
		}
		return 0
	} catch (err: any) {
        console.log("🚀 ~ file: utils.ts ~ line 35 ~ insertRows ~ err", err)
		await sleep(0.5)
		return await insertRows(table, rows, countRowsAffected)
	}
}

export const updateRows = async (table: string, where: any, values: any): Promise<void> => {
	try {
		await db(table).where(...formatWhere(where)).update(values).then((res: any) => {})
	} catch (err: any) {
        console.log("🚀 ~ file: utils.ts ~ line 14 ~ updateRows ~ err", err)
		await sleep(0.5)
		return await updateRows(table, where, values)
	}
}

export const deleteRows = async (table: string, where: any): Promise<void> => {
	try {
		await db(table).where(...formatWhere(where)).del().then((res: any) => {})
	} catch (err: any) {
        console.log("🚀 ~ file: utils.ts ~ line 14 ~ updateRows ~ err", err)
		await sleep(0.5)
		return await deleteRows(table, where)
	}
}

export const getRowsCount = async (table: string): Promise<number> => {
	try {
		let count: number = 0
		await db.raw(`select count(*) from ${table}`).then((res: any) => count = res)
		return count
	} catch (err: any) {
		console.log("🚀 ~ file: utils.ts ~ line 47 ~ insertRows ~ err", err)
		await sleep(0.5)
		return await getRowsCount(table)
	}
}

// needs orWhere support
const formatWhere = (query: Query): Array<object> | Array<number> => {
	let where: any = {}
	for (let i: number = 0; i < Object.keys(query).length; i++) {
		const param: string = Object.keys(query)[i]
		if (param !== 'limit' && param !== 'offset' && param !== 'orderby' && param !== 'order') where[param] = query[param]
	}

	if (!Object.keys(where).length) return [1, 1]
	return [where]
}

const formatOrderBy = (query: Query): Array<string> => {
	const defaultParams: Array<string> = ['id', 'asc']
	if (query.orderby) {
		const orderby: Array<string> = []
		orderby.push(typeof query.orderby === 'string' ? query.orderby : defaultParams[0])
		if (query.order) orderby.push(typeof query.order === 'string' ? query.order : defaultParams[1])
		return orderby
	} else return defaultParams
}