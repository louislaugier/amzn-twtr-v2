DROP TABLE IF EXISTS "public"."deal";

CREATE TABLE "public"."deal" (
    "id" varchar NOT NULL,
    "title" text NOT NULL,
    "url" varchar NOT NULL,
    "old_price" float4,
    "new_price" float4,
    "discount" varchar,
    "image_url" varchar NOT NULL,
    PRIMARY KEY ("id")
);

