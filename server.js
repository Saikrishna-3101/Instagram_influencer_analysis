import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import 'dotenv/config';
import fetch from 'node-fetch';

const MONGO_URI = process.env.MONGO_URI;
const PORT = 4000;//assigns automatically 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// Mongoose schema
const influencerSchema = new mongoose.Schema({
  name: String,
  handle: String,
  profilePic: String,
  followers: Number,
  following: Number,
  postCount: Number,
  posts: [
    {
      imageUrl: String,
      caption: String,
      likes: Number,
      comments: Number,
    },
  ],
});

const Influencer = mongoose.models.Influencer || mongoose.model('Influencer', influencerSchema);

// GraphQL typeDefs
const typeDefs = `#graphql
  type Post {
    imageUrl: String
    caption: String
    likes: Int
    comments: Int
  }

  type Influencer {
    id: ID
    name: String
    handle: String
    profilePic: String
    followers: Int
    following: Int
    postCount: Int
    posts: [Post]
    averageLikes: Float
    averageComments: Float
    engagementRate: Float
  }

  type Query {
    getInfluencerData: [Influencer]
    hello: String
  }
`;

// Resolvers
const resolvers = {
  Query: {
    getInfluencerData: async () => {
      const influencers = await Influencer.find();
      if (!influencers.length) {
        console.warn('⚠️ No influencer data found. Please check your seeding function.');
        return []; // Return an empty array to prevent server crash
      }

      return influencers.map((inf) => {
        const posts = Array.isArray(inf.posts) ? inf.posts : [];
        const postCount = posts.length || 1;

        const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
        const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0);

        const avgLikes = totalLikes / postCount;
        const avgComments = totalComments / postCount;
        const engagementRate = inf.followers > 0 ? ((avgLikes + avgComments) / inf.followers) * 100 : 0;

        return { ...inf.toObject(), averageLikes: avgLikes, averageComments: avgComments, engagementRate };
      });
    },
    hello: () => 'Hello from the GraphQL API!',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const app = express();
const httpServer = http.createServer(app);

async function startServer() {
  await connectDB();
  await server.start();

  app.use('/graphql', cors(), express.json(), expressMiddleware(server));

  // Serve local images
  app.use('/images', express.static(path.join(__dirname, 'public/images')));

  // Proxy for external images (Instagram)
  app.get('/proxy-image', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url parameter');

    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('Proxy image error:', err);
      res.status(500).send('Failed to fetch image');
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🖼️ Images served at http://localhost:${PORT}/images`);
  });
}

startServer();
