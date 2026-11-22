import { z } from 'zod';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');
const imageRef = z.string().refine(
  (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
  'Provide an image URL or upload a poster',
);
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date');
export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
}).refine((v) => Object.keys(v).length > 0, 'Provide at least one field');

const stringList = z.array(z.string().trim().min(1)).default([]);

export const movieSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(10).max(4000),
  synopsis: z.string().trim().max(4000).optional(),
  director: z.string().trim().max(120).optional(),
  popularity: z.number().min(0).max(1000).optional(),
  genre: stringList,
  language: z.string().trim().min(1).max(40).default('English'),
  format: z.array(z.enum(['2D', '3D', 'IMAX'])).default(['2D']),
  duration: z.number().int().min(1).max(600),
  releaseDate: z.coerce.date(),
  certificate: z.string().trim().max(20).default('UA'),
  rating: z.number().min(0).max(10).default(0),
  cast: stringList,
  poster: imageRef,
  backdrop: imageRef.optional().or(z.literal('')),
  trailerUrl: z.string().trim().url().optional().or(z.literal('')),
  status: z.enum(['showing', 'upcoming']).default('showing'),
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
});

export const theatreSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().max(80).optional(),
  chain: z.string().trim().max(80).optional(),
  address: z.string().trim().min(4).max(240),
  phone: z.string().trim().max(20).optional(),
  amenities: stringList,
});

const categorySchema = z.object({
  name: z.enum(['Regular', 'Premium', 'Recliner']),
  startRow: z.number().int().min(0),
  endRow: z.number().int().min(0),
  basePrice: z.number().int().min(1).max(100000),
  color: z.string().trim().max(30).optional(),
});

export const screenBaseSchema = z.object({
  name: z.string().trim().min(1).max(60),
  format: z.enum(['2D', '3D', 'IMAX']).default('2D'),
  rows: z.number().int().min(1).max(26),
  seatsPerRow: z.number().int().min(1).max(30),
  categories: z.array(categorySchema).min(1),
});

export const screenSchema = screenBaseSchema.refine((v) => v.categories.every((c) => c.startRow <= c.endRow && c.endRow < v.rows), {
  message: 'Category row ranges must be ordered and within the screen',
  path: ['categories'],
});

export const showSchema = z.object({
  movie: objectId,
  theatre: objectId,
  screen: objectId,
  date: dateString,
  time: timeString,
  format: z.enum(['2D', '3D', 'IMAX']).default('2D'),
  pricing: z.object({
    Regular: z.number().int().min(1),
    Premium: z.number().int().min(1),
    Recliner: z.number().int().min(1),
  }),
  status: z.enum(['scheduled', 'cancelled']).default('scheduled'),
});

export const holdsSchema = z.object({
  seats: z.array(z.string().trim().min(1)).min(1, 'Select at least one seat').max(8, 'You can select at most 8 seats'),
}).superRefine((value, ctx) => {
  if (new Set(value.seats).size !== value.seats.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['seats'], message: 'Duplicate seats are not allowed' });
  }
});

export const bookingSchema = z.object({
  showId: objectId,
  seats: z.array(z.string().trim().min(1)).min(1).max(8),
  promoCode: z.string().trim().max(30).optional(),
}).superRefine((value, ctx) => {
  if (new Set(value.seats).size !== value.seats.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['seats'], message: 'Duplicate seats are not allowed' });
  }
});

export const paySchema = z.object({
  method: z.enum(['card', 'upi', 'netbanking']),
  outcome: z.enum(['success', 'failure']).default('success'),
});

export const promoSchema = z.object({ code: z.string().trim().min(1).max(30), amount: z.number().min(0) });

export const movieQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  genre: z.string().trim().optional(),
  language: z.string().trim().optional(),
  format: z.string().trim().optional(),
  status: z.enum(['showing', 'upcoming']).optional(),
  featured: z.enum(['true', 'false']).optional(),
});

export const showQuerySchema = z.object({
  movie: objectId.optional(),
  theatre: objectId.optional(),
  city: z.string().trim().optional(),
  date: dateString.optional(),
  format: z.enum(['2D', '3D', 'IMAX']).optional(),
  status: z.enum(['scheduled', 'cancelled']).optional(),
});

export const bookingQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'failed', 'cancelled']).optional(),
  search: z.string().trim().max(120).optional(),
});
