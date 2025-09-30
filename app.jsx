import React, { useState } from 'react';
import {
  Container,
  Avatar,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Button,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Chart from 'react-apexcharts';
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import { ApolloProvider, useQuery } from '@apollo/client/react';
import { Masonry } from '@mui/lab';
import './App.css';

// Apollo Client setup
const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
  cache: new InMemoryCache(),
});

// GraphQL query
const GET_INFLUENCER_DATA = gql`
  query {
    getInfluencerData {
      name
      handle
      profilePic
      followers
      following
      postCount
      averageLikes
      averageComments
      engagementRate
      posts {
        imageUrl
        caption
        likes
        comments
      }
    }
  }
`;

// Format numbers
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
};

// Fix all image URLs
const getFullImageUrl = (url) => {
  if (!url || typeof url !== 'string') return 'https://via.placeholder.com/150';
  return `http://localhost:4000/proxy-image?url=${encodeURIComponent(url)}`;
};

// Pie chart data for Interests
const interestData = [
  { name: 'Fitness', value: 25 },
  { name: 'Sanatan', value: 15 },
  { name: "Men's Psychology", value: 10 },
  { name: 'Food & Diet', value: 30 },
  { name: 'Social Awareness', value: 15 },
];

function AppWrapper() {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}

function App() {
  const { loading, error, data } = useQuery(GET_INFLUENCER_DATA);
  const [selectedPost, setSelectedPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  if (loading) {
    return (
      <Container className="profile-container">
        <CircularProgress sx={{ color: '#fff' }} />
        <Typography variant="h6" sx={{ mt: 2, color: '#fff' }}>
          Loading influencer data...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="profile-container">
        <Alert severity="error">
          <Typography variant="h6">An error occurred:</Typography>
          <Typography>{error.message}</Typography>
        </Alert>
      </Container>
    );
  }

  const influencer = data?.getInfluencerData?.[0];
  if (!influencer) {
    return (
      <Container className="profile-container">
        <Alert severity="info">
          <Typography variant="h6">No data to display.</Typography>
          <Typography>Please run the backend scraping script to populate the database.</Typography>
        </Alert>
      </Container>
    );
  }

  const chartSeries = [{ name: 'Likes per Post', data: influencer.posts.map((p) => p.likes) }];
  const chartOptions = {
    chart: { id: 'likes-chart', toolbar: { show: false }, zoom: { enabled: false }, background: '#1b1b1b' },
    xaxis: { categories: influencer.posts.map((_, i) => `Post ${i + 1}`), labels: { style: { colors: '#fff' } } },
    stroke: { curve: 'smooth', colors: ['#00ffcc'] },
    title: { text: 'Likes on Recent Posts', align: 'center', style: { color: '#fff' } },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    grid: { borderColor: '#444' },
  };

  const pieOptions = {
    chart: { type: 'donut', toolbar: { show: false }, background: '#1b1b1b' },
    labels: interestData.map((i) => i.name),
    legend: { position: 'bottom', labels: { colors: '#fff' } },
    dataLabels: { style: { colors: ['#fff'] } },
    plotOptions: { pie: { donut: { size: '50%' } } },
    title: { text: 'Interests Distribution', align: 'center', style: { color: '#fff' } },
  };
  const pieSeries = interestData.map((i) => i.value);

  const handleLike = () => setLiked(!liked);
  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    setComments([...comments, newComment]);
    setNewComment('');
  };

  return (
    <Container className="profile-container">
      {/* Header */}
      <header>
        <Avatar
          alt={influencer.name}
          src={getFullImageUrl(influencer.profilePic)}
          sx={{ width: 150, height: 150, margin: '0 auto' }}
        />
        <h1 className="profile-name">{influencer.name}</h1>
        <span className="profile-handle">@{influencer.handle}</span>
      </header>

      {/* Stats */}
      <div className="profile-stats">
        <div>
          <h4>{formatNumber(influencer.postCount)}</h4>
          <p>Posts</p>
        </div>
        <div>
          <h4>{formatNumber(influencer.followers)}</h4>
          <p>Followers</p>
        </div>
        <div>
          <h4>{formatNumber(influencer.following)}</h4>
          <p>Following</p>
        </div>
        <div>
          <h4>{influencer.averageLikes.toFixed(1)}</h4>
          <p>Avg Likes</p>
        </div>
        <div>
          <h4>{influencer.averageComments.toFixed(1)}</h4>
          <p>Avg Comments</p>
        </div>
        <div>
          <h4>{influencer.engagementRate.toFixed(2)}%</h4>
          <p>Engagement Rate</p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="chart-container">
        <Chart options={chartOptions} series={chartSeries} type="line" height={400} />
      </div>

      {/* Pie Chart */}
      <Paper className="chart-card">
        <Chart options={pieOptions} series={pieSeries} type="donut" height={350} />
      </Paper>

      {/* Posts */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2, textAlign: 'center', color: '#fff' }}>
        Recent Posts
      </Typography>

      <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
        {influencer.posts.map((post, index) => (
          <Paper
            className="post-card"
            key={index}
            onClick={() => {
              setSelectedPost(post);
              setLiked(false);
              setComments([]);
            }}
          >
            <img src={getFullImageUrl(post.imageUrl)} alt="post" className="post-image" />
            <Typography variant="body1" className="post-caption">
              {post.caption}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Likes: {post.likes} | Comments: {post.comments}
            </Typography>
          </Paper>
        ))}
      </Masonry>

      {/* Post Modal */}
      <Dialog open={!!selectedPost} onClose={() => setSelectedPost(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Post Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedPost(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {selectedPost && (
          <DialogContent>
            <img
              src={getFullImageUrl(selectedPost.imageUrl)}
              alt="post"
              style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }}
            />
            <Box display="flex" alignItems="center" mb={1}>
              <IconButton onClick={handleLike} color={liked ? 'error' : 'default'}>
                {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <Typography variant="body2">{selectedPost.likes + (liked ? 1 : 0)} likes</Typography>
            </Box>
            <Typography variant="body1" style={{ marginBottom: '10px' }}>
              {selectedPost.caption}
            </Typography>

            {/* Comments */}
            <Box mb={2}>
              <Typography variant="subtitle2">Comments:</Typography>
              {comments.length === 0 ? (
                <Typography variant="caption" color="textSecondary">
                  No comments yet.
                </Typography>
              ) : (
                comments.map((c, i) => (
                  <Typography key={i} variant="body2">
                    - {c}
                  </Typography>
                ))
              )}
            </Box>

            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button variant="contained" onClick={handleAddComment}>
                Post
              </Button>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Container>
  );
}

export default AppWrapper;
