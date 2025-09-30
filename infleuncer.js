import mongoose from 'mongoose';
import { IgApiClient } from 'instagram-private-api';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const MONGO_URI =
  const MONGO_URI = process.env.MONGO_URI; // <-- FIXED
const IG_USERNAME = process.env.IG_USERNAME; // <-- FIXED
const IG_PASSWORD = process.env.IG_PASSWORD; // <-- FIXED

const ig = new IgApiClient();

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

async function loginToInstagram() {
  try {
    ig.state.generateDevice(IG_USERNAME);
    await ig.account.login(IG_USERNAME, IG_PASSWORD);
    console.log(`✅ Logged in to Instagram as ${ig.state.username}!`);
  } catch (err) {
    console.error('❌ Instagram login error:', err);
    process.exit(1);
  }
}

async function fetchAndStoreInfluencerData(username) {
  try {
    console.log(`Fetching profile for ${username}...`);

    const userId = await ig.user.getIdByUsername(username);
    const userInfo = await ig.user.info(userId);

    console.log('✅ Profile info fetched. Now fetching posts...');

    const userFeed = ig.feed.user(userId);
    const posts = await userFeed.items();

    // Ensure backend/public/images exists
    const imagesDir = path.join(process.cwd(), 'public/images');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    // Download last 10 posts
    const last10Posts = await Promise.all(
      posts.slice(0, 10).map(async (post, index) => {
        const imageUrl = post.image_versions2?.candidates[0]?.url || '';
        let localImagePath = '';

        if (imageUrl) {
          const imageName = `post_${index + 1}.jpg`;
          localImagePath = `/images/${imageName}`; // saved path for backend

          try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(path.join(imagesDir, imageName), response.data);
            console.log(`✅ Saved image: ${imageName}`);
          } catch (err) {
            console.error('❌ Failed to download image:', err);
          }
        }

        return {
          imageUrl: localImagePath,
          caption: post.caption?.text || '',
          likes: Number(post.like_count ?? 0),
          comments: Number(post.comment_count ?? 0),
        };
      })
    );

    // Download profile picture
    const profilePicName = `profile.jpg`;
    const profilePicPath = path.join(imagesDir, profilePicName);
    try {
      const response = await axios.get(userInfo.profile_pic_url, { responseType: 'arraybuffer' });
      fs.writeFileSync(profilePicPath, response.data);
      console.log('✅ Saved profile picture');
    } catch (err) {
      console.error('❌ Failed to download profile pic:', err);
    }

    const dataToStore = {
      name: userInfo.full_name,
      handle: userInfo.username,
      profilePic: `/images/${profilePicName}`, // backend path
      followers: Number(userInfo.follower_count ?? 0),
      following: Number(userInfo.following_count ?? 0),
      postCount: Number(userInfo.media_count ?? 0),
      posts: last10Posts,
    };

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

    const Influencer =
      mongoose.models.Influencer || mongoose.model('Influencer', influencerSchema);

    await Influencer.deleteMany({ handle: username });
    await Influencer.create(dataToStore);

    console.log('✅ Data inserted into MongoDB successfully!');
  } catch (err) {
    console.error('❌ Error fetching and storing data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('ℹ️ Disconnected from MongoDB.');
  }
}

async function main() {
  await connectDB();
  await loginToInstagram();
  await fetchAndStoreInfluencerData(INFLUENCER_HANDLE);
}

main();
