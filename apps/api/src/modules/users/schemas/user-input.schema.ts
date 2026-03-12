import { z } from "zod";

const EmailInputSchema = z.string().trim().email().max(254);
const PhoneInputSchema = z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{1,14}$/)
    .max(16);

const CapitalizedNameInputSchema = z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^\p{Lu}/u, "Must start with a capital letter")
    .regex(/^\S+$/, "Must not contain spaces");

const DisplayNameInputSchema = z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^\S+$/, "Must not contain spaces");

export const UserInputSchema = z.object({
    email: EmailInputSchema,
    password: z.string().min(8).max(128),
    first_name: CapitalizedNameInputSchema,
    last_name: CapitalizedNameInputSchema,
    display_name: DisplayNameInputSchema,
    phone: PhoneInputSchema.nullable(),
    profile_photo_url: z.string().trim().url().nullable(),
    bio: z.string().trim().max(500).nullable(),
});
