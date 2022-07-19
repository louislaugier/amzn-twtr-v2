CREATE TABLE "public"."deal" (
	"id" varchar NOT NULL,
	"title" text NOT NULL,
	"url" varchar NOT NULL,
	"oldPrice" float4,
	"newPrice" float4,
	"discount" varchar,
	"imageUrl" varchar NOT NULL,
	"tweetId" varchar,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."account" (
	"id" varchar NOT NULL,
	"isFollowed" boolean NOT NULL DEFAULT FALSE,
	PRIMARY KEY ("id")
);
