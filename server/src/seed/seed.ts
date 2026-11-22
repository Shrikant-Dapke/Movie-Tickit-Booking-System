import 'dotenv/config';
import mongoose from 'mongoose';
import { hashPassword } from '../lib/password.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Screen } from '../models/Screen.js';
import { Seat } from '../models/Seat.js';
import { Show } from '../models/Show.js';
import { Promo } from '../models/Promo.js';
import { SeatHold } from '../models/SeatHold.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';

const poster = (path: string) => `https://image.tmdb.org/t/p/w500${path}`;
const trailer = (id: string) => `https://www.youtube.com/embed/${id}`;

const movies = [
  {
    title: 'Dune: Part Two', description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. A journey beyond fear into the destiny of an empire.',
    genre: ['Sci-Fi', 'Adventure'], language: 'English', format: ['2D', '3D', 'IMAX'], duration: 166, releaseDate: new Date('2024-03-01'),
    certificate: 'UA13+', rating: 8.8, cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
    poster: poster('/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'), backdrop: poster('/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg'), trailerUrl: trailer('Way9Dexny3w'),
    status: 'showing', featured: true, trending: true,
  },
  {
    title: 'Interstellar', description: 'A team of explorers travels beyond this galaxy through a wormhole to discover whether mankind has a future among the stars.',
    genre: ['Sci-Fi', 'Drama'], language: 'English', format: ['2D', 'IMAX'], duration: 169, releaseDate: new Date('2014-11-07'),
    certificate: 'UA13+', rating: 8.7, cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    poster: poster('/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'), backdrop: poster('/xJHokMbljvjADYdit5fK5VQsXEG.jpg'), trailerUrl: trailer('zSWdZVtXT7E'),
    status: 'showing', featured: true, trending: true,
  },
  {
    title: 'The Batman', description: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.',
    genre: ['Action', 'Crime'], language: 'English', format: ['2D', 'IMAX'], duration: 176, releaseDate: new Date('2022-03-04'),
    certificate: 'UA16+', rating: 7.8, cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano'],
    poster: poster('/74xTEgt7R36Fpooo50r9T25onhq.jpg'), backdrop: poster('/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg'), trailerUrl: trailer('mqqft2x_Aa4'),
    status: 'showing', featured: true, trending: false,
  },
  {
    title: 'Spider-Man: Across the Spider-Verse', description: 'Miles Morales returns for the next chapter of the Spider-Verse saga, an epic adventure that transports him through the multiverse.',
    genre: ['Animation', 'Action'], language: 'English', format: ['2D', '3D'], duration: 140, releaseDate: new Date('2023-06-02'),
    certificate: 'UA', rating: 8.6, cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac'],
    poster: poster('/8Vt6mWEReuy4Of61Lnj5Xjbu9B2.jpg'), backdrop: poster('/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg'), trailerUrl: trailer('cqGjhVJWtEg'),
    status: 'showing', featured: false, trending: true,
  },
  {
    title: 'Jawan', description: 'A high-octane action thriller about a man on a mission who takes on the establishment to fight for justice.',
    genre: ['Action', 'Thriller'], language: 'Hindi', format: ['2D', 'IMAX'], duration: 169, releaseDate: new Date('2023-09-07'),
    certificate: 'UA16+', rating: 7.0, cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi'],
    poster: poster('/jFt1gS4BGHlK8xt76Y3bUn4c6qr.jpg'), backdrop: poster('/rLb2cwF3Pazuxuj0OiWNQtiOmna.jpg'), trailerUrl: trailer('CMiVVP1GDGA'),
    status: 'showing', featured: false, trending: true,
  },
  {
    title: '12th Fail', description: 'The inspiring true story of Manoj Kumar Sharma, who overcame immense odds to clear the UPSC examination and become an IPS officer.',
    genre: ['Drama', 'Biography'], language: 'Hindi', format: ['2D'], duration: 147, releaseDate: new Date('2023-10-27'),
    certificate: 'UA13+', rating: 9.0, cast: ['Vikrant Massey', 'Medha Rana', 'Ramachandra Raju'],
    poster: poster('/kCGlIMHnOm8JPXq3rXE0fNZp7sC.jpg'), backdrop: poster('/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg'), trailerUrl: trailer('ep7I8dKlmVE'),
    status: 'showing', featured: false, trending: false,
  },
  {
    title: 'Oppenheimer', description: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    genre: ['Drama', 'History'], language: 'English', format: ['2D', 'IMAX'], duration: 180, releaseDate: new Date('2023-07-21'),
    certificate: 'UA16+', rating: 8.6, cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'],
    poster: poster('/ptpr0kGAckfQkJeJIt8st5dglvd.jpg'), backdrop: poster('/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg'), trailerUrl: trailer('uYPbbksJxIg'),
    status: 'showing', featured: false, trending: false,
  },
  {
    title: 'The Marvels', description: 'Carol Danvers, Monica Rambeau and Ms. Marvel must team up to save the universe from a growing crisis.',
    genre: ['Action', 'Sci-Fi'], language: 'English', format: ['2D', '3D'], duration: 105, releaseDate: new Date('2026-12-15'),
    certificate: 'UA13+', rating: 7.2, cast: ['Brie Larson', 'Teyonah Parris', 'Iman Vellani'],
    poster: poster('/A6T9wOtGxaEF3uuNA6+55EtKUnu.jpg'), backdrop: poster('/tiFpWolj83Y6Y9mIfThkPq6UVvh.jpg'), trailerUrl: trailer('2ER8_nH0d-I'),
    status: 'upcoming', featured: false, trending: false,
  },
];

const theatreSpecs = [
  { name: 'CineBook Phoenix', city: 'Pune', address: 'Phoenix Marketcity, Vimannagar, Pune 411014', phone: '020-66810000', amenities: ['IMAX', 'Dolby Atmos', 'Food & Beverage', 'Parking'] },
  { name: 'CineBook Khar', city: 'Mumbai', address: 'Linking Road, Khar West, Mumbai 400052', phone: '022-26400000', amenities: ['Recliner', 'Dolby Atmos', 'Parking'] },
  { name: 'CineBook Orion', city: 'Bengaluru', address: 'Orion Mall, Rajajinagar, Bengaluru 560010', phone: '080-41000000', amenities: ['IMAX', 'Food & Beverage', 'Parking'] },
];

const categorySpec = [
  { name: 'Regular' as const, startRow: 0, endRow: 4, basePrice: 220, color: '#64748b' },
  { name: 'Premium' as const, startRow: 5, endRow: 7, basePrice: 350, color: '#e50914' },
  { name: 'Recliner' as const, startRow: 8, endRow: 9, basePrice: 550, color: '#a855f7' },
];

const buildSeats = (screenId: string) =>
  categorySpec.flatMap((category) =>
    Array.from({ length: category.endRow - category.startRow + 1 }, (_, index) => {
      const rowIndex = category.startRow + index;
      const row = String.fromCharCode(65 + rowIndex);
      return Array.from({ length: 10 }, (_, col) => ({
        screen: new mongoose.Types.ObjectId(screenId),
        label: `${row}${col + 1}`,
        row,
        number: col + 1,
        category: category.name,
        basePrice: category.basePrice,
      }));
    }),
  ).flat();

const run = async () => {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Seeding CineBook into ${env.MONGODB_URI}`);

  await Promise.all([SeatHold.deleteMany({}), Payment.deleteMany({}), Booking.deleteMany({}), Show.deleteMany({}), Seat.deleteMany({}), Screen.deleteMany({}), Theatre.deleteMany({}), Movie.deleteMany({}), Promo.deleteMany({})]);

  const [adminHash, customerHash] = await Promise.all([hashPassword('Admin123!'), hashPassword('Customer123!')]);
  await User.deleteMany({});
  await User.create([
    { name: 'CineBook Admin', email: 'admin@cinebook.demo', passwordHash: adminHash, role: 'admin' },
    { name: 'Demo Customer', email: 'customer@cinebook.demo', passwordHash: customerHash, role: 'customer', phone: '9876543210' },
  ]);

  const movieDocs = await Movie.insertMany(movies);
  const theatreDocs = await Theatre.insertMany(theatreSpecs);
  const screens = [];
  for (const theatre of theatreDocs) {
    for (const [index, format] of ['2D', 'IMAX', '3D'].entries()) {
      screens.push({
        theatre: theatre._id,
        name: `Screen ${index + 1}`,
        format,
        rows: 10,
        seatsPerRow: 10,
        categories: categorySpec,
      });
    }
  }
  const screenDocs = await Screen.insertMany(screens);
  const seats = screenDocs.flatMap((screen) => buildSeats(String(screen._id)));
  await Seat.insertMany(seats);

  const shows = [];
  const today = new Date();
  for (let day = 0; day < 7; day += 1) {
    const date = new Date(today.getTime() + day * 86_400_000).toISOString().slice(0, 10);
    for (const [movieIndex, movie] of movieDocs.entries()) {
      const theatre = theatreDocs[movieIndex % theatreDocs.length];
      const theatreScreens = screenDocs.filter((screen) => String(screen.theatre) === String(theatre._id));
      const matching = theatreScreens.filter((screen) => movie.format.includes(screen.format));
      const chosen = (matching.length ? matching : theatreScreens)[day % (matching.length || theatreScreens.length)];
      for (const time of ['10:30', '13:45', '17:15', '20:30']) {
        if (movie.status === 'upcoming' && day < 3) continue;
        // Never seed a show that has already started — otherwise customers can
        // select it but checkout is correctly rejected.
        if (new Date(`${date}T${time}:00`).getTime() <= Date.now()) continue;
        shows.push({
          movie: movie._id,
          theatre: theatre._id,
          screen: chosen._id,
          date,
          time,
          format: chosen.format,
          pricing: Object.fromEntries(categorySpec.map((c) => [c.name, c.basePrice + (chosen.format === 'IMAX' ? 120 : chosen.format === '3D' ? 80 : 0)])),
          status: 'scheduled',
        });
      }
    }
  }
  await Show.insertMany(shows);

  await Promo.insertMany([
    { code: 'CINEBOOK10', description: '10% off up to ₹150', discountPercent: 10, maxDiscount: 150, minAmount: 0, active: true },
    { code: 'FIRSTSHOW20', description: '20% off up to ₹250 on bookings above ₹500', discountPercent: 20, maxDiscount: 250, minAmount: 500, active: true },
  ]);

  console.log(`Seeded ${movieDocs.length} movies, ${theatreDocs.length} theatres, ${screenDocs.length} screens, ${seats.length} seats, ${shows.length} shows and 2 promo codes.`);
  console.log('Demo admin: admin@cinebook.demo / Admin123!');
  console.log('Demo customer: customer@cinebook.demo / Customer123!');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
