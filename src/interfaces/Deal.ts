export default interface Deal {
	id: string,
	title: string,
	url: string,
	old_price: number | null,
	new_price: number | null,
	discount: string | null,
	image_url: string
}