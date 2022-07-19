import crypto from 'crypto'
import oauth1a, { RequestOptions } from 'oauth-1.0a'

import TwitterAPI from '../config/TwitterAPI'

export const signOAuth = async (method: string, url: string): Promise<void> => {
	try {
		const oauth: oauth1a = new oauth1a({
			consumer: {
				key: process.env.TWITTER_CONSUMER_KEY || '',
				secret: process.env.TWITTER_CONSUMER_SECRET || ''
			},
			signature_method: 'HMAC-SHA1',
			hash_function(base_string: string, key: string) {
				return crypto.createHmac('sha1', key).update(base_string).digest('base64')
			}
		})

		const authorization: oauth1a.Authorization = oauth.authorize(
			{
				url,
				method
			},
			{
				key: process.env.TWITTER_ACCESS_TOKEN || '',
				secret: process.env.TWITTER_ACCESS_SECRET || ''
			}
		)

		TwitterAPI.defaults.headers.common['Authorization'] = oauth.toHeader(authorization).Authorization
	} catch (err: any) {
		console.log('🚀 ~ file: OAuth1.ts ~ line 29 ~ err', err)
	}
}
