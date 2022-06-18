export default interface Deal {
	id: string,
	title: string,
	URL: string,
	oldPrice: number | null,
	newPrice: number | null,
	discount: string | null,
	imageURL: string
}