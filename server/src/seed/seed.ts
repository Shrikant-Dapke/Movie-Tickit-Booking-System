/**
 * CineBook demonstration seed — SAFE AND REPEATABLE.
 *
 * Every document gets a deterministic ObjectId derived from a stable key, so
 * running this script any number of times upserts the same records instead of
 * duplicating them. Existing user accounts and real bookings are never deleted
 * or modified. Demo bookings are marked with `seeded: true` so they can be
 * distinguished from genuine activity and removed with `npm run seed:reset`.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import mongoose, { type Types } from 'mongoose';
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

const oid = (key: string): Types.ObjectId =>
  new mongoose.Types.ObjectId(createHash('sha1').update(`cinebook:${key}`).digest('hex').slice(0, 24));

const poster = (file: string) => `https://image.tmdb.org/t/p/w500/${file}`;
const backdrop = (file: string) => `https://image.tmdb.org/t/p/w1280/${file}`;
const trailer = (key?: string) => (key ? `https://www.youtube.com/embed/${key}` : undefined);

const localDate = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const isFuture = (date: string, time: string) => new Date(`${date}T${time}:00`).getTime() > Date.now();

type MovieSeed = {
  key: string; title: string; overview: string; synopsis: string; director: string;
  cast: string[]; genre: string[]; language: string; format: string[]; duration: number;
  releaseDate: string; certificate: string; rating: number; popularity: number;
  posterFile: string; backdropFile: string; trailerKey?: string;
  status: 'showing' | 'upcoming'; featured?: boolean; trending?: boolean;
};

// 25 real films. Every poster/backdrop URL was verified against TMDB's CDN
// (HTTP 200, image/jpeg) before being included here.
const movies: MovieSeed[] = [
  { key: 'dune-2', title: 'Dune: Part Two', overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', synopsis: 'Facing a choice between the love of his life and the fate of the universe, Paul must prevent a terrible future only he can foresee. Destiny becomes a powerful force as he is drawn into a war against the House of Harkonnen.', director: 'Denis Villeneuve', cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler', 'Florence Pugh'], genre: ['Sci-Fi', 'Adventure'], language: 'English', format: ['2D', '3D', 'IMAX'], duration: 166, releaseDate: '2024-03-01', certificate: 'UA13+', rating: 8.8, popularity: 98, posterFile: '6izwz7rsy95ARzTR3poZ8H6c5pp.jpg', backdropFile: 'eZ239CUp1d6OryZEBPnO2n87gMG.jpg', trailerKey: 'Way9Dexny3w', status: 'showing', featured: true, trending: true },
  { key: 'interstellar', title: 'Interstellar', overview: 'Explorers travel through a wormhole in search of a new home for humanity.', synopsis: 'With Earth becoming uninhabitable, a team of explorers crosses Saturn, enters a wormhole and confronts the limits of time, love and human survival beyond the galaxy.', director: 'Christopher Nolan', cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'], genre: ['Sci-Fi', 'Drama'], language: 'English', format: ['2D', 'IMAX'], duration: 169, releaseDate: '2014-11-07', certificate: 'UA13+', rating: 8.7, popularity: 94, posterFile: 'yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg', backdropFile: '8sNiAPPYU14PUepFNeSNGUTiHW.jpg', trailerKey: '827FNDpQWrQ', status: 'showing', featured: true, trending: true },
  { key: 'the-batman', title: 'The Batman', overview: 'Batman uncovers corruption in Gotham City while pursuing a serial killer.', synopsis: 'In his second year of fighting crime, Bruce Wayne follows a trail of cryptic clues left by the Riddler, forcing him to confront the city’s rot and his own family history.', director: 'Matt Reeves', cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano', 'Jeffrey Wright'], genre: ['Action', 'Crime', 'Thriller'], language: 'English', format: ['2D', 'IMAX'], duration: 176, releaseDate: '2022-03-04', certificate: 'UA16+', rating: 7.8, popularity: 86, posterFile: '74xTEgt7R36Fpooo50r9T25onhq.jpg', backdropFile: 'rvtdN5XkWAfGX6xDuPL6yYS2seK.jpg', trailerKey: 'NLOp_6uPccQ', status: 'showing', featured: true },
  { key: 'spiderverse', title: 'Spider-Man: Across the Spider-Verse', overview: 'Miles Morales journeys across the multiverse and meets a team of Spider-People.', synopsis: 'After reuniting with Gwen Stacy, Miles is catapulted into a universe of Spider-People charged with protecting the very fabric of the multiverse — and must redefine what it means to be a hero.', director: 'Joaquim Dos Santos', cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Jake Johnson'], genre: ['Animation', 'Action', 'Adventure'], language: 'English', format: ['2D', '3D'], duration: 140, releaseDate: '2023-06-02', certificate: 'UA', rating: 8.6, popularity: 90, posterFile: '8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdropFile: 'kVd3a9YeLGkoeR50jGEXM6EqseS.jpg', trailerKey: 'BbXJ3_AQE_o', status: 'showing', trending: true },
  { key: 'jawan', title: 'Jawan', overview: 'A high-octane action thriller about a man on a mission to fight injustice.', synopsis: 'A feared jailer and a mysterious vigilante join forces to expose corruption at the highest levels, turning a personal mission into a revolution for the common man.', director: 'Atlee', cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi', 'Sanya Malhotra'], genre: ['Action', 'Thriller'], language: 'Hindi', format: ['2D', 'IMAX'], duration: 169, releaseDate: '2023-09-07', certificate: 'UA16+', rating: 7.4, popularity: 88, posterFile: 'jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg', backdropFile: '5LtSjMNw6j3LkG29Oa4O0iY5U8.jpg', trailerKey: 'VAdGW7QDJiU', status: 'showing', trending: true },
  { key: '12th-fail', title: '12th Fail', overview: 'The inspiring true story of a student who overcame immense odds to clear the UPSC exam.', synopsis: 'Manoj Kumar Sharma, failed twelfth-grade student, migrates to Delhi and survives countless hardships to become an IPS officer — a testament to resilience and the power of education.', director: 'Vidhu Vinod Chopra', cast: ['Vikrant Massey', 'Medha Rana', 'Ramachandra Raju'], genre: ['Drama', 'Biography'], language: 'Hindi', format: ['2D'], duration: 147, releaseDate: '2023-10-27', certificate: 'UA13+', rating: 9.0, popularity: 80, posterFile: 'eebUPRI4Z5e1Z7Hev4JZAwMIFkX.jpg', backdropFile: '6RV2o8PBCEyw9ylOWViV1CtULIF.jpg', trailerKey: '3fi39FWuXT8', status: 'showing' },
  { key: 'oppenheimer', title: 'Oppenheimer', overview: 'The story of J. Robert Oppenheimer and the atomic bomb.', synopsis: 'As the Manhattan Project races to beat the Axis powers, a brilliant physicist carries the weight of a discovery that will change warfare and haunt him forever.', director: 'Christopher Nolan', cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.', 'Matt Damon'], genre: ['Drama', 'History', 'Thriller'], language: 'English', format: ['2D', 'IMAX'], duration: 180, releaseDate: '2023-07-21', certificate: 'UA16+', rating: 8.6, popularity: 87, posterFile: '8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdropFile: 'neeNHeXjMF5fXoCJRsOmkNGC7q.jpg', trailerKey: 'bK6ldnjE3Y0', status: 'showing', featured: true },
  { key: 'the-marvels', title: 'The Marvels', overview: 'Three heroes team up against a crisis threatening the universe.', synopsis: 'Carol Danvers, Monica Rambeau and Ms. Marvel discover their powers are entangled and must work together when a surprising new enemy appears.', director: 'Nia DaCosta', cast: ['Brie Larson', 'Teyonah Parris', 'Iman Vellani'], genre: ['Action', 'Sci-Fi'], language: 'English', format: ['2D', '3D'], duration: 105, releaseDate: '2026-12-15', certificate: 'UA13+', rating: 7.2, popularity: 70, posterFile: '9GBhzXMFjgcZ3FdR9w3bUMMTps5.jpg', backdropFile: 'feSiISwgEpVzR1v3zv2n2AU4ANJ.jpg', trailerKey: '2ER8_nH0d-I', status: 'upcoming' },
  { key: 'endgame', title: 'Avengers: Endgame', overview: 'The Avengers assemble for a final battle against Thanos.', synopsis: 'Five years after the snap, the remaining heroes mount a desperate plan to reverse the devastation and face the Mad Titan one last time.', director: 'Anthony Russo, Joe Russo', cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo', 'Chris Hemsworth'], genre: ['Action', 'Sci-Fi', 'Adventure'], language: 'English', format: ['2D', '3D', 'IMAX'], duration: 181, releaseDate: '2019-04-26', certificate: 'UA13+', rating: 8.4, popularity: 92, posterFile: 'jtDv3lCnST0fZRvdYFwR5CVwK2x.jpg', backdropFile: '7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg', trailerKey: 'hA6hldpSTF8', status: 'showing', trending: true },
  { key: 'infinity-war', title: 'Avengers: Infinity War', overview: 'The Avengers face an enemy powerful enough to destroy the universe.', synopsis: 'As Thanos hunts the six Infinity Stones, heroes from across the cosmos must unite — and old alliances are tested to breaking point.', director: 'Anthony Russo, Joe Russo', cast: ['Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo', 'Josh Brolin'], genre: ['Action', 'Sci-Fi', 'Adventure'], language: 'English', format: ['2D', '3D', 'IMAX'], duration: 149, releaseDate: '2018-04-27', certificate: 'UA13+', rating: 8.5, popularity: 89, posterFile: '7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', backdropFile: 'mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg', trailerKey: 'sAOzrChqmd0', status: 'showing' },
  { key: 'wakanda-forever', title: 'Black Panther: Wakanda Forever', overview: 'Wakanda defends its future after the death of King T’Challa.', synopsis: 'Grief-stricken but resolute, Shuri and the Wakandan council confront a powerful underwater kingdom while the world schemes for vibranium.', director: 'Ryan Coogler', cast: ['Letitia Wright', 'Tenoch Huerta', 'Lupita Nyong’o', 'Danai Gurira'], genre: ['Action', 'Sci-Fi', 'Drama'], language: 'English', format: ['2D', 'IMAX'], duration: 161, releaseDate: '2022-11-11', certificate: 'UA13+', rating: 7.4, popularity: 78, posterFile: 'sv1xJUazXeYqALzczSZ3O6nkH75.jpg', backdropFile: '83H0C66AcvkwpG2738VCTHMY9uv.jpg', trailerKey: 'RlOB3UALvrQ', status: 'showing' },
  { key: 'top-gun', title: 'Top Gun: Maverick', overview: 'Maverick trains a new generation of elite naval aviators.', synopsis: 'More than thirty years after his first mission, Pete Mitchell returns to train a team for an impossible assignment that demands the ultimate sacrifice.', director: 'Joseph Kosinski', cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly', 'Jon Hamm'], genre: ['Action', 'Drama'], language: 'English', format: ['2D', 'IMAX'], duration: 131, releaseDate: '2022-05-27', certificate: 'UA13+', rating: 8.2, popularity: 84, posterFile: 'n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg', backdropFile: 'AaV1YIdWKnjAIAOe8UUKBFm327v.jpg', trailerKey: 'qSqVVswa420', status: 'showing', trending: true },
  { key: 'barbie', title: 'Barbie', overview: 'Barbie and Ken leave Barbie Land for an adventure in the real world.', synopsis: 'After an existential crisis, Barbie travels to the real world with Ken, discovering both the joys and contradictions of being human.', director: 'Greta Gerwig', cast: ['Margot Robbie', 'Ryan Gosling', 'America Ferrera', 'Kate McKinnon'], genre: ['Comedy', 'Fantasy', 'Adventure'], language: 'English', format: ['2D'], duration: 114, releaseDate: '2023-07-21', certificate: 'UA13+', rating: 7.0, popularity: 82, posterFile: 'iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', backdropFile: '1esAE8sLJRWWFsLLeh5r3g2WanI.jpg', trailerKey: '8zIf0XvoL9Y', status: 'showing' },
  { key: 'mission-impossible', title: 'Mission: Impossible - Dead Reckoning', overview: 'Ethan Hunt hunts a rogue artificial intelligence.', synopsis: 'With a powerful AI threatening global security, Ethan Hunt and his team race to find the key to controlling it before it falls into the wrong hands.', director: 'Christopher McQuarrie', cast: ['Tom Cruise', 'Hayley Atwell', 'Ving Rhames', 'Simon Pegg'], genre: ['Action', 'Thriller', 'Adventure'], language: 'English', format: ['2D', 'IMAX'], duration: 163, releaseDate: '2023-07-12', certificate: 'UA16+', rating: 7.7, popularity: 81, posterFile: 'NNxYkU70HPurnNCSiCjYAmacwm.jpg', backdropFile: '628Dep6AxEtDxjZoGP78TsOxYbK.jpg', trailerKey: '2m1drlOZSDw', status: 'showing' },
  { key: 'pathaan', title: 'Pathaan', overview: 'A covert agent races to stop a dangerous terror plot.', synopsis: 'Called back from exile, Pathaan must confront a former colleague turned enemy and prevent a strike that could plunge the subcontinent into chaos.', director: 'Siddharth Anand', cast: ['Shah Rukh Khan', 'Deepika Padukone', 'John Abraham'], genre: ['Action', 'Thriller'], language: 'Hindi', format: ['2D', 'IMAX'], duration: 147, releaseDate: '2023-01-25', certificate: 'UA16+', rating: 7.1, popularity: 79, posterFile: 'arf00BkwvXo0CFKbaD9OpqdE4Nu.jpg', backdropFile: 'o0nLkPesXPugGw0rB15hDhZd1DX.jpg', trailerKey: '9oYlBZ_qQng', status: 'showing' },
  { key: 'animal', title: 'Animal', overview: 'A violent family drama of love, revenge and loyalty.', synopsis: 'After his father is attacked, a privileged young man descends into a world of vengeance where his relationships with his father, wife and brother are tested.', director: 'Sandeep Reddy Vanga', cast: ['Ranbir Kapoor', 'Anil Kapoor', 'Bobby Deol', 'Rashmika Mandanna'], genre: ['Action', 'Drama', 'Crime'], language: 'Hindi', format: ['2D', 'IMAX'], duration: 156, releaseDate: '2023-12-01', certificate: 'A', rating: 7.0, popularity: 83, posterFile: 'hr9rjR3J0xBBKmlJ4n3gHId9ccx.jpg', backdropFile: 'lprsAHkwMxk2iC6VZxNmV0H7g1t.jpg', trailerKey: '6DfaBq2rVoE', status: 'showing' },
  { key: 'rrr', title: 'RRR', overview: 'Two revolutionaries unite against colonial rule.', synopsis: 'Fictionalised friendships and heroism collide as two real-life freedom fighters discover their shared purpose and ignite a rebellion.', director: 'S. S. Rajamouli', cast: ['N. T. Rama Rao Jr.', 'Ram Charan', 'Alia Bhatt', 'Ajay Devgn'], genre: ['Action', 'Drama', 'History'], language: 'Telugu', format: ['2D', 'IMAX'], duration: 187, releaseDate: '2022-03-25', certificate: 'UA16+', rating: 8.0, popularity: 85, posterFile: 'wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg', backdropFile: 'i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg', trailerKey: 'BwrZfGq1HlQ', status: 'showing', trending: true },
  { key: 'kgf-2', title: 'KGF: Chapter 2', overview: 'Rocky raises his rebellion to an epic scale.', synopsis: 'After a devastating betrayal, Rocky vows to fulfil a promise to his mother by conquering the gold mines and the powers that control them.', director: 'Prashanth Neel', cast: ['Yash', 'Sanjay Dutt', 'Raveena Tandon', 'Srinidhi Shetty'], genre: ['Action', 'Drama'], language: 'Kannada', format: ['2D', 'IMAX'], duration: 168, releaseDate: '2022-04-14', certificate: 'UA16+', rating: 7.3, popularity: 77, posterFile: 'khNVygolU0TxLIDWff5tQlAhZ23.jpg', backdropFile: 'nsV5Mfi9FAV4w8eDsdr7uqVswOk.jpg', trailerKey: 'Qah9sSIXJqk', status: 'showing' },
  { key: 'inception', title: 'Inception', overview: 'A thief steals secrets from dreams.', synopsis: 'Dom Cobb is offered a chance at redemption: instead of stealing an idea, he must plant one deep inside a target’s subconscious before the dream collapses.', director: 'Christopher Nolan', cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'], genre: ['Sci-Fi', 'Action', 'Thriller'], language: 'English', format: ['2D', 'IMAX'], duration: 148, releaseDate: '2010-07-16', certificate: 'UA13+', rating: 8.8, popularity: 91, posterFile: 'xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg', backdropFile: '8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg', trailerKey: 'Jvurpf91omw', status: 'showing', featured: true },
  { key: 'dark-knight', title: 'The Dark Knight', overview: 'Batman faces an anarchic criminal mastermind.', synopsis: 'With help from Lieutenant Gordon and District Attorney Dent, Batman takes on the Joker — a criminal whose reign of chaos forces the hero to confront his own limits.', director: 'Christopher Nolan', cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Gary Oldman'], genre: ['Action', 'Crime', 'Drama'], language: 'English', format: ['2D', 'IMAX'], duration: 152, releaseDate: '2008-07-18', certificate: 'UA16+', rating: 9.0, popularity: 95, posterFile: 'qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdropFile: 'cfT29Im5VDvjE0RpyKOSdCKZal7.jpg', trailerKey: 'kmJLuwP3MbY', status: 'showing', featured: true },
  { key: 'parasite', title: 'Parasite', overview: 'A poor family infiltrates a wealthy household.', synopsis: 'The Kims scheme their way into the Parks’ lives one job at a time, until a discovery beneath the beautiful house reveals a colder, deeper inequality.', director: 'Bong Joon-ho', cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik'], genre: ['Thriller', 'Drama', 'Comedy'], language: 'Korean', format: ['2D'], duration: 132, releaseDate: '2019-05-30', certificate: 'A', rating: 8.5, popularity: 76, posterFile: '7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', backdropFile: 'TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', trailerKey: 'CEIwFAQ-Rec', status: 'showing' },
  { key: 'whiplash', title: 'Whiplash', overview: 'A young drummer is pushed to his limit by a brutal instructor.', synopsis: 'Aspiring jazz drummer Andrew Neiman enrols at a prestigious conservatory where a terrifying teacher drives him to the edge of obsession and greatness.', director: 'Damien Chazelle', cast: ['Miles Teller', 'J.K. Simmons', 'Melissa Benoist'], genre: ['Drama', 'Music'], language: 'English', format: ['2D'], duration: 107, releaseDate: '2014-10-10', certificate: 'UA16+', rating: 8.5, popularity: 74, posterFile: '7fn624j5lj3xTme2SgiLCeuedmO.jpg', backdropFile: 'fRGxZuo7jJUWQsVg9PREb98Aclp.jpg', trailerKey: 'kYzFY-uBYj8', status: 'showing' },
  { key: 'spirited-away', title: 'Spirited Away', overview: 'A girl enters a world of spirits and must save her parents.', synopsis: 'Ten-year-old Chihiro wanders into a bathhouse for gods, where she must work, remember her name and find courage to free her parents.', director: 'Hayao Miyazaki', cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'], genre: ['Animation', 'Fantasy', 'Adventure'], language: 'Japanese', format: ['2D'], duration: 125, releaseDate: '2001-07-20', certificate: 'UA', rating: 8.6, popularity: 72, posterFile: '39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', backdropFile: 'm4TUa2ciEWSlk37rOsjiSIvZDXE.jpg', trailerKey: 'ByXuk9QqQkk', status: 'showing' },
  { key: 'your-name', title: 'Your Name', overview: 'Two teenagers begin swapping bodies across distance.', synopsis: 'A girl in a mountain town and a boy in Tokyo start exchanging bodies in dreams, building a bond that becomes a race against time and memory.', director: 'Makoto Shinkai', cast: ['Ryunosuke Kamiki', 'Mone Kamishiraishi', 'Masami Nagasawa'], genre: ['Animation', 'Romance', 'Fantasy'], language: 'Japanese', format: ['2D'], duration: 106, releaseDate: '2016-08-26', certificate: 'UA', rating: 8.5, popularity: 73, posterFile: 'vfJFJPepRKapMd5G2ro7klIRysq.jpg', backdropFile: 'mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg', status: 'showing' },
  { key: 'la-la-land', title: 'La La Land', overview: 'A jazz pianist and an aspiring actress fall in love in Los Angeles.', synopsis: 'Sebastian and Mia chase their dreams while falling for one another, discovering that love and ambition rarely follow the same schedule.', director: 'Damien Chazelle', cast: ['Ryan Gosling', 'Emma Stone', 'John Legend', 'Rosemarie DeWitt'], genre: ['Romance', 'Musical', 'Drama'], language: 'English', format: ['2D'], duration: 128, releaseDate: '2016-12-09', certificate: 'UA13+', rating: 8.0, popularity: 75, posterFile: 'uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', backdropFile: 'nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg', status: 'showing' },
];

type TheatreSeed = {
  key: string; name: string; chain: string; city: string; area: string; address: string;
  phone: string; amenities: string[]; tier: number; screens: Array<{ name: string; format: '2D' | '3D' | 'IMAX'; rows: number; seatsPerRow: number }>;
};

const theatres: TheatreSeed[] = [
  { key: 'pune-phoenix', name: 'PVR Phoenix Marketcity', chain: 'PVR Cinemas', city: 'Pune', area: 'Vimannagar', address: 'Phoenix Marketcity, East Count Road, Vimannagar, Pune 411014', phone: '020-66810000', amenities: ['IMAX', 'Dolby Atmos', 'Food & Beverage', 'Parking'], tier: 2, screens: [{ name: 'Screen 1', format: 'IMAX', rows: 10, seatsPerRow: 10 }, { name: 'Screen 2', format: '2D', rows: 9, seatsPerRow: 10 }, { name: 'Screen 3', format: '3D', rows: 8, seatsPerRow: 10 }] },
  { key: 'pune-deccan', name: 'INOX RDeccan', chain: 'INOX Leisure', city: 'Pune', area: 'Deccan Gymkhana', address: 'RDeccan Mall, Karve Road, Deccan Gymkhana, Pune 411004', phone: '020-25650000', amenities: ['Dolby Atmos', 'Parking'], tier: 1, screens: [{ name: 'Screen 1', format: '2D', rows: 9, seatsPerRow: 10 }, { name: 'Screen 2', format: '3D', rows: 8, seatsPerRow: 10 }] },
  { key: 'pune-kothrud', name: 'Cinépolis Fun Time', chain: 'Cinépolis', city: 'Pune', area: 'Kothrud', address: 'Fun Time Multiplex, Karve Nagar Road, Kothrud, Pune 411038', phone: '020-25450000', amenities: ['Recliner', 'Food & Beverage'], tier: 1, screens: [{ name: 'Screen 1', format: '2D', rows: 10, seatsPerRow: 10 }, { name: 'Screen 2', format: '2D', rows: 8, seatsPerRow: 10 }] },
  { key: 'mumbai-bkc', name: 'PVR Jio World Drive', chain: 'PVR Cinemas', city: 'Mumbai', area: 'Bandra Kurla Complex', address: 'Jio World Drive, BKC, Bandra East, Mumbai 400051', phone: '022-66200000', amenities: ['IMAX', 'Dolby Cinema', 'Recliner', 'Parking'], tier: 3, screens: [{ name: 'Screen 1', format: 'IMAX', rows: 10, seatsPerRow: 10 }, { name: 'Screen 2', format: '2D', rows: 10, seatsPerRow: 10 }, { name: 'Screen 3', format: '3D', rows: 9, seatsPerRow: 10 }] },
  { key: 'mumbai-andheri', name: 'INOX Megaplex', chain: 'INOX Leisure', city: 'Mumbai', area: 'Andheri West', address: 'Fun Republic Mall, New Link Road, Andheri West, Mumbai 400053', phone: '022-26740000', amenities: ['IMAX', 'Food & Beverage', 'Parking'], tier: 2, screens: [{ name: 'Screen 1', format: 'IMAX', rows: 10, seatsPerRow: 10 }, { name: 'Screen 2', format: '2D', rows: 9, seatsPerRow: 10 }] },
  { key: 'mumbai-cinepolis', name: 'Cinépolis Andheri', chain: 'Cinépolis', city: 'Mumbai', area: 'Andheri East', address: 'Cinépolis, Chakala Road, Andheri East, Mumbai 400099', phone: '022-28310000', amenities: ['Recliner', 'Parking'], tier: 2, screens: [{ name: 'Screen 1', format: '2D', rows: 10, seatsPerRow: 10 }, { name: 'Screen 2', format: '3D', rows: 8, seatsPerRow: 10 }] },
  { key: 'blr-orion', name: 'PVR Orion Mall', chain: 'PVR Cinemas', city: 'Bengaluru', area: 'Rajajinagar', address: 'Orion Mall, Dr. Rajkumar Road, Rajajinagar, Bengaluru 560010', phone: '080-41000000', amenities: ['IMAX', 'Dolby Atmos', 'Parking'], tier: 2, screens: [{ name: 'Screen 1', format: 'IMAX', rows: 10, seatsPerRow: 10 }, { name: 'Screen 2', format: '2D', rows: 9, seatsPerRow: 10 }, { name: 'Screen 3', format: '3D', rows: 8, seatsPerRow: 10 }] },
  { key: 'blr-garuda', name: 'INOX Garuda', chain: 'INOX Leisure', city: 'Bengaluru', area: 'Malleshwaram', address: 'Garuda Mall, Magrath Road, Ashok Nagar, Bengaluru 560025', phone: '080-41110000', amenities: ['Food & Beverage', 'Parking'], tier: 1, screens: [{ name: 'Screen 1', format: '2D', rows: 9, seatsPerRow: 10 }, { name: 'Screen 2', format: '2D', rows: 8, seatsPerRow: 10 }] },
  { key: 'hyd-gachibowli', name: 'PVR Electro Mall', chain: 'PVR Cinemas', city: 'Hyderabad', area: 'Gachibowli', address: 'Electro Mall, Gachibowli Main Road, Hyderabad 500032', phone: '040-66300000', amenities: ['IMAX', 'Recliner', 'Parking'], tier: 2, screens: [{ name: 'Screen 1', format: 'IMAX', rows: 10, seatsPerRow: 10 }, { name: 'Screen 2', format: '2D', rows: 9, seatsPerRow: 10 }] },
  { key: 'chennai-anna-nagar', name: 'Cinépolis RK Cineplex', chain: 'Cinépolis', city: 'Chennai', area: 'Anna Nagar', address: 'RK Cineplex, 100 Feet Road, Anna Nagar, Chennai 600040', phone: '044-42100000', amenities: ['Dolby Atmos', 'Food & Beverage'], tier: 1, screens: [{ name: 'Screen 1', format: '2D', rows: 10, seatsPerRow: 10 }, { name: 'Screen 2', format: '3D', rows: 8, seatsPerRow: 10 }] },
];

const categoryFor = (tier: number) => [
  { name: 'Regular' as const, startRow: 0, endRow: 4, basePrice: 160 + tier * 30, color: '#64748b' },
  { name: 'Premium' as const, startRow: 5, endRow: 7, basePrice: 260 + tier * 40, color: '#e50914' },
  { name: 'Recliner' as const, startRow: 8, endRow: 9, basePrice: 420 + tier * 60, color: '#a855f7' },
];

const run = async () => {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Seeding CineBook (idempotent) into ${env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@')}`);

  // ---- Users: $setOnInsert preserves any account that already exists ----
  const hashes = await Promise.all([
    hashPassword('Admin123!'),
    hashPassword('Customer123!'),
  ]);
  const demoUsers = [
    { key: 'admin', name: 'CineBook Admin', email: 'admin@cinebook.demo', role: 'admin', city: 'Pune', seeded: true, passwordHash: hashes[0] },
    { key: 'customer', name: 'Demo Customer', email: 'customer@cinebook.demo', role: 'customer', city: 'Pune', phone: '9876543210', seeded: true, passwordHash: hashes[1] },
    { key: 'priya', name: 'Priya Sharma', email: 'priya@cinebook.demo', role: 'customer', city: 'Mumbai', phone: '9820011223', seeded: true, passwordHash: hashes[1] },
    { key: 'arjun', name: 'Arjun Mehta', email: 'arjun@cinebook.demo', role: 'customer', city: 'Bengaluru', phone: '9845011224', seeded: true, passwordHash: hashes[1] },
  ];
  for (const user of demoUsers) {
    await User.updateOne(
      { email: user.email },
      { $setOnInsert: { ...user, _id: oid(`user:${user.key}`) } },
      { upsert: true },
    );
  }

  // ---- Movies ----
  for (const movie of movies) {
    await Movie.updateOne(
      { _id: oid(`movie:${movie.key}`) },
      {
        $set: {
          title: movie.title,
          description: movie.overview,
          synopsis: movie.synopsis,
          director: movie.director,
          popularity: movie.popularity,
          genre: movie.genre,
          language: movie.language,
          format: movie.format,
          duration: movie.duration,
          releaseDate: new Date(movie.releaseDate),
          certificate: movie.certificate,
          rating: movie.rating,
          cast: movie.cast,
          poster: poster(movie.posterFile),
          backdrop: backdrop(movie.backdropFile),
          trailerUrl: trailer(movie.trailerKey),
          status: movie.status,
          featured: !!movie.featured,
          trending: !!movie.trending,
          seeded: true,
        },
        $setOnInsert: { _id: oid(`movie:${movie.key}`) },
      },
      { upsert: true },
    );
  }
  // Movie model has no `seeded` path; store the marker with strict:false upserts.
  await Movie.collection.updateMany({ title: { $in: movies.map((m) => m.title) } }, { $set: { seeded: true } });

  // ---- Theatres, screens and seats ----
  const screenRefs: Array<{ theatreKey: string; screenId: Types.ObjectId; format: string; tier: number; rows: number; seatsPerRow: number; categories: ReturnType<typeof categoryFor> }> = [];
  for (const theatre of theatres) {
    await Theatre.updateOne(
      { _id: oid(`theatre:${theatre.key}`) },
      {
        $set: { name: theatre.name, chain: theatre.chain, city: theatre.city, area: theatre.area, address: theatre.address, phone: theatre.phone, amenities: theatre.amenities, seeded: true },
        $setOnInsert: { _id: oid(`theatre:${theatre.key}`) },
      },
      { upsert: true },
    );
    await Theatre.collection.updateOne({ _id: oid(`theatre:${theatre.key}`) }, { $set: { seeded: true } });

    for (const screen of theatre.screens) {
      const screenId = oid(`screen:${theatre.key}:${screen.name}`);
      const categories = categoryFor(theatre.tier);
      await Screen.updateOne(
        { _id: screenId },
        {
          $set: { theatre: oid(`theatre:${theatre.key}`), name: screen.name, format: screen.format, rows: screen.rows, seatsPerRow: screen.seatsPerRow, categories, seeded: true },
          $setOnInsert: { _id: screenId },
        },
        { upsert: true },
      );
      await Screen.collection.updateOne({ _id: screenId }, { $set: { seeded: true } });
      screenRefs.push({ theatreKey: theatre.key, screenId, format: screen.format, tier: theatre.tier, rows: screen.rows, seatsPerRow: screen.seatsPerRow, categories });

      for (let rowIndex = 0; rowIndex < screen.rows; rowIndex += 1) {
        const row = String.fromCharCode(65 + rowIndex);
        for (let col = 1; col <= screen.seatsPerRow; col += 1) {
          const category = categories.find((c) => rowIndex >= c.startRow && rowIndex <= c.endRow) ?? categories[0];
          const seatId = oid(`seat:${theatre.key}:${screen.name}:${row}${col}`);
          await Seat.updateOne(
            { _id: seatId },
            {
              $set: { screen: screenId, label: `${row}${col}`, row, number: col, category: category.name, basePrice: category.basePrice, seeded: true },
              $setOnInsert: { _id: seatId },
            },
            { upsert: true },
          );
        }
      }
    }
  }
  await Seat.collection.updateMany({ screen: { $in: screenRefs.map((s) => s.screenId) } }, { $set: { seeded: true } });

  // ---- Shows: deterministic keys, future only for public scheduling ----
  const showTimes = ['09:30', '14:15', '19:45'];
  const showingMovies = movies.filter((movie) => movie.status === 'showing');
  const showRefs: Array<{ key: string; movieKey: string; theatreKey: string; screenId: Types.ObjectId; date: string; time: string; format: string; pricing: Record<string, number> }> = [];

  for (let day = -1; day <= 7; day += 1) {
    const date = localDate(day);
    showingMovies.forEach((movie, movieIndex) => {
      const theatre = theatres[(movieIndex + Math.max(day, 0)) % theatres.length];
      const screensForTheatre = screenRefs.filter((s) => s.theatreKey === theatre.key);
      const screen = screensForTheatre[movieIndex % screensForTheatre.length];
      showTimes.forEach((time, timeIndex) => {
        if (!isFuture(date, time)) return;
        const key = `show:${movie.key}:${date}:${time}:${theatre.key}`;
        const pricing = Object.fromEntries(
          screen.categories.map((c) => [c.name, c.basePrice + (screen.format === 'IMAX' ? 120 : screen.format === '3D' ? 60 : 0) + (theatre.tier - 1) * 20]),
        );
        showRefs.push({ key, movieKey: movie.key, theatreKey: theatre.key, screenId: screen.screenId, date, time, format: screen.format, pricing });
      });
    });
  }

  // Dedicated anchor shows for the demo bookings (one past show for completed bookings).
  const anchorSpecs: Array<{ key: string; movieKey: string; theatreKey: string; day: number; time: string }> = [
    { key: 'demo-confirmed', movieKey: 'dune-2', theatreKey: 'pune-phoenix', day: 1, time: '19:45' },
    { key: 'demo-completed', movieKey: 'inception', theatreKey: 'mumbai-bkc', day: -1, time: '19:45' },
    { key: 'demo-cancelled', movieKey: 'rrr', theatreKey: 'blr-orion', day: 2, time: '14:15' },
    { key: 'demo-failed', movieKey: 'the-batman', theatreKey: 'pune-deccan', day: 3, time: '19:45' },
    { key: 'demo-weekend', movieKey: 'interstellar', theatreKey: 'pune-phoenix', day: 4, time: '19:45' },
  ];
  for (const anchor of anchorSpecs) {
    const theatre = theatres.find((t) => t.key === anchor.theatreKey)!;
    const screensForTheatre = screenRefs.filter((s) => s.theatreKey === theatre.key);
    const screen = screensForTheatre[0];
    const pricing = Object.fromEntries(
      screen.categories.map((c) => [c.name, c.basePrice + (screen.format === 'IMAX' ? 120 : screen.format === '3D' ? 60 : 0) + (theatre.tier - 1) * 20]),
    );
    showRefs.push({ key: `show:anchor:${anchor.key}`, movieKey: anchor.movieKey, theatreKey: anchor.theatreKey, screenId: screen.screenId, date: localDate(anchor.day), time: anchor.time, format: screen.format, pricing });
  }

  for (const show of showRefs) {
    const showId = oid(show.key);
    await Show.updateOne(
      { _id: showId },
      {
        $set: {
          movie: oid(`movie:${show.movieKey}`), theatre: oid(`theatre:${show.theatreKey}`), screen: show.screenId,
          date: show.date, time: show.time, format: show.format, pricing: show.pricing, status: 'scheduled', seeded: true,
        },
        $setOnInsert: { _id: showId },
      },
      { upsert: true },
    );
    await Show.collection.updateOne({ _id: showId }, { $set: { seeded: true } });
  }

  // ---- Promotions ----
  const promos = [
    { key: 'cinebook10', code: 'CINEBOOK10', description: '10% off every booking, up to ₹150', type: 'percent', discountPercent: 10, maxDiscount: 150, minAmount: 0, active: true, expiresAt: new Date(Date.now() + 180 * 86400000), maxUses: null, usedCount: 0 },
    { key: 'firstshow20', code: 'FIRSTSHOW20', description: '20% off bookings above ₹500, up to ₹250', type: 'percent', discountPercent: 20, maxDiscount: 250, minAmount: 500, active: true, expiresAt: new Date(Date.now() + 120 * 86400000), maxUses: null, usedCount: 0 },
    { key: 'weekend100', code: 'WEEKEND100', description: 'Flat ₹100 off on bookings above ₹800', type: 'fixed', fixedAmount: 100, maxDiscount: 100, minAmount: 800, active: true, expiresAt: new Date(Date.now() + 90 * 86400000), maxUses: null, usedCount: 0 },
    { key: 'student15', code: 'STUDENT15', description: '15% off up to ₹200, limited to 100 uses', type: 'percent', discountPercent: 15, maxDiscount: 200, minAmount: 300, active: true, expiresAt: new Date(Date.now() + 60 * 86400000), maxUses: 100, usedCount: 0 },
    { key: 'blockbuster200', code: 'BLOCKBUSTER200', description: 'Flat ₹200 off on bookings above ₹1200', type: 'fixed', fixedAmount: 200, maxDiscount: 200, minAmount: 1200, active: true, expiresAt: new Date(Date.now() + 200 * 86400000), maxUses: 25, usedCount: 25 },
    { key: 'summer50', code: 'SUMMER50', description: 'Expired summer offer — kept to demonstrate validation', type: 'fixed', fixedAmount: 50, maxDiscount: 50, minAmount: 400, active: false, expiresAt: new Date(Date.now() - 10 * 86400000), maxUses: null, usedCount: 0 },
  ];
  for (const promo of promos) {
    const promoId = oid(`promo:${promo.key}`);
    const { key: _key, ...fields } = promo;
    await Promo.updateOne(
      { _id: promoId },
      { $set: fields, $setOnInsert: { _id: promoId } },
      { upsert: true },
    );
  }

  // ---- Demo customers and bookings with distinct scenarios ----
  const bookingSpecs = [
    { key: 'confirmed', code: 'CBSIM001', user: 'customer', show: 'demo-confirmed', seats: ['J1', 'J2'], status: 'confirmed', paymentStatus: 'paid', gateway: 'succeeded', label: 'Confirmed · upcoming' },
    { key: 'completed', code: 'CBSIM002', user: 'priya', show: 'demo-completed', seats: ['J3', 'J4'], status: 'confirmed', paymentStatus: 'paid', gateway: 'succeeded', label: 'Completed · past show' },
    { key: 'cancelled', code: 'CBSIM003', user: 'arjun', show: 'demo-cancelled', seats: ['J5', 'J6'], status: 'cancelled', paymentStatus: 'refunded', gateway: 'refunded', label: 'Cancelled booking' },
    { key: 'failed', code: 'CBSIM004', user: 'customer', show: 'demo-failed', seats: ['I7', 'I8'], status: 'failed', paymentStatus: 'failed', gateway: 'failed', label: 'Failed simulated payment' },
    { key: 'weekend', code: 'CBSIM005', user: 'priya', show: 'demo-weekend', seats: ['I1', 'I2'], status: 'confirmed', paymentStatus: 'paid', gateway: 'succeeded', label: 'Confirmed · weekend' },
  ] as const;

  for (const spec of bookingSpecs) {
    const bookingId = oid(`booking:${spec.key}`);
    const showDoc = await Show.findById(oid(`show:anchor:${spec.show}`)).lean();
    if (!showDoc) continue;
    // Remove only this demo booking's previous holds, never another customer's.
    await SeatHold.deleteMany({ booking: bookingId, seeded: true });

    const occupied = new Set((await SeatHold.find({ show: showDoc._id }).select('seat')).map((h) => h.seat));
    const seats = spec.seats.filter((seat) => !occupied.has(seat));
    const seatDocs = await Seat.find({ screen: showDoc.screen, label: { $in: seats } });
    if (seats.length !== spec.seats.length || seatDocs.length !== seats.length) {
      console.warn(`Skipping demo booking ${spec.code}: a seat is now occupied by genuine activity.`);
      continue;
    }
    const lines = seatDocs.map((seat) => ({
      label: seat.label,
      category: seat.category,
      price: (showDoc.pricing as Record<string, number>)[seat.category] ?? seat.basePrice,
    }));
    const amount = lines.reduce((sum, line) => sum + line.price, 0);
    const paymentId = oid(`payment:${spec.key}`);
    await Payment.updateOne(
      { _id: paymentId },
      {
        $set: {
          booking: bookingId, user: oid(`user:${spec.user}`), method: 'card', amount,
          status: spec.gateway, transactionId: `SIMDEMO-${spec.code}`,
          failureReason: spec.gateway === 'failed' ? 'Simulated gateway declined this demo payment' : undefined,
          simulated: true, seeded: true,
        },
        $setOnInsert: { _id: paymentId },
      },
      { upsert: true },
    );
    await Booking.updateOne(
      { _id: bookingId },
      {
        $set: {
          code: spec.code, user: oid(`user:${spec.user}`), show: showDoc._id, seats: lines, amount, discount: 0, total: amount,
          status: spec.status, paymentStatus: spec.paymentStatus, payment: paymentId,
          seeded: true, seedKey: `${spec.key} — ${spec.label}`,
        },
        $setOnInsert: { _id: bookingId },
      },
      { upsert: true },
    );
    // Only confirmed bookings own a booked seat. Cancelled/failed bookings hold nothing.
    if (spec.status === 'confirmed') {
      for (const seat of seats) {
        const holdId = oid(`hold:${spec.key}:${seat}`);
        await SeatHold.updateOne(
          { _id: holdId },
          {
            $set: {
              show: showDoc._id, seat, user: oid(`user:${spec.user}`), status: 'booked', booking: bookingId,
              expiresAt: new Date('2099-12-31T00:00:00.000Z'), seeded: true,
            },
            $setOnInsert: { _id: holdId },
          },
          { upsert: true },
        );
      }
    }
  }

  const counts = {
    users: await User.countDocuments(), movies: await Movie.countDocuments(), theatres: await Theatre.countDocuments(),
    screens: await Screen.countDocuments(), seats: await Seat.countDocuments(), shows: await Show.countDocuments(),
    bookings: await Booking.countDocuments(), payments: await Payment.countDocuments(), promos: await Promo.countDocuments(),
    demoBookings: await Booking.countDocuments({ seeded: true }),
  };
  console.log('Seed complete:', JSON.stringify(counts));
  console.log('Demo admin: admin@cinebook.demo / Admin123!');
  console.log('Demo customers: customer@ / priya@ / arjun@cinebook.demo / Customer123!');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
