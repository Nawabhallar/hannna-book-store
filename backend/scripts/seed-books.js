const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Book = require('../src/books/book.model');

const books = [
  {
    title: 'Manto: Selected Short Stories – Saadat Hasan Manto',
    category: 'Fiction',
    description: 'Iconic stories about partition and society’s struggles, written with raw honesty.',
    oldPrice: 1000,
    newPrice: 800,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: 'The Reluctant Fundamentalist – Mohsin Hamid',
    category: 'Fiction',
    description: 'A gripping monologue of a Pakistani man in the U.S. after 9/11.',
    oldPrice: 1500,
    newPrice: 1200,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: 'In the Line of Fire – Pervez Musharraf',
    category: 'Autobiography',
    description: "Memoir of Pakistan’s former president, covering his military and political journey.",
    oldPrice: 1800,
    newPrice: 1350,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: 'A Case of Exploding Mangoes – Mohammed Hanif',
    category: 'Fiction',
    description: "A witty novel inspired by the mystery around General Zia-ul-Haq’s plane crash.",
    oldPrice: 1600,
    newPrice: 1250,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: 'Songs of Blood and Sword – Fatima Bhutto',
    category: 'Politics',
    description: "A personal and political narrative of the Bhutto family’s struggles.",
    oldPrice: 1700,
    newPrice: 1300,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: 'To Kill a Mockingbird – Harper Lee',
    category: 'Fiction',
    description: 'A moving story about justice, racism, and childhood in America’s South.',
    oldPrice: 20,
    newPrice: 15,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: '1984 – George Orwell',
    category: 'Fiction',
    description: 'A chilling tale about surveillance, dictatorship, and freedom.',
    oldPrice: 18,
    newPrice: 13,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: 'Pride and Prejudice – Jane Austen',
    category: 'Romance',
    description: 'A witty exploration of love, class, and society in 19th-century England.',
    oldPrice: 16,
    newPrice: 12,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: 'The Alchemist – Paulo Coelho',
    category: 'Inspirational',
    description: 'A shepherd embarks on a magical journey to fulfill his destiny.',
    oldPrice: 19,
    newPrice: 14,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  },
  {
    title: 'Harry Potter and the Philosopher’s Stone – J.K. Rowling',
    category: 'Fantasy',
    description: "The beginning of the worldwide phenomenon of Harry Potter’s adventures at Hogwarts.",
    oldPrice: 25,
    newPrice: 18,
    trending: false,
    coverImage: '/uploads/placeholder.webp'
  }
];

async function seed() {
  if (!process.env.DB_URL) {
    console.error('DB_URL not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.DB_URL);
  console.log('Connected to DB');

  for (const b of books) {
    try {
      const existing = await Book.findOne({ title: b.title });
      if (existing) {
        await Book.updateOne({ _id: existing._id }, { $set: b });
        console.log('Updated:', b.title);
      } else {
        await Book.create(b);
        console.log('Inserted:', b.title);
      }
    } catch (err) {
      console.error('Failed to upsert', b.title, err);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding completed');
  process.exit(0);
}

seed();
