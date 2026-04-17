CREATE TYPE "public"."car_color" AS ENUM('WHITE', 'BLACK', 'SILVER', 'GRAY', 'RED', 'BLUE', 'BROWN', 'GREEN', 'YELLOW', 'ORANGE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."country_code" AS ENUM('AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'CH');--> statement-breakpoint
ALTER TABLE "cars" DROP CONSTRAINT "cars_country_code_chk";--> statement-breakpoint
ALTER TABLE "cars" DROP CONSTRAINT "cars_color_len_chk";--> statement-breakpoint
ALTER TABLE "cars" DROP CONSTRAINT "cars_spz_len_chk";--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "country_code" SET DATA TYPE "public"."country_code" USING "country_code"::"public"."country_code";--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "color" SET DATA TYPE "public"."car_color" USING "color"::"public"."car_color";--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_spz_format_chk" CHECK ("cars"."spz" ~ '^[A-Z0-9]+$');--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_spz_len_chk" CHECK (char_length("cars"."spz") BETWEEN 2 AND 12);