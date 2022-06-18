import crypto from 'crypto'
import oauth1a, { RequestOptions } from 'oauth-1.0a'

export default (request: RequestOptions): oauth1a.Header => {
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

	const authorization: oauth1a.Authorization = oauth.authorize(request, {
		key: process.env.TWITTER_ACCESS_TOKEN || '',
		secret: process.env.TWITTER_ACCESS_SECRET || ''
	})

	return oauth.toHeader(authorization)
}