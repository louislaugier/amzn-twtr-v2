export const sleep = async (minutes: number): Promise<unknown> => {
	console.log(`Idling for ${minutes} minutes...`)
	return new Promise(resolve => setTimeout(resolve, minutes * 60000))
}