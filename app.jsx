import React, { useState, useEffect } from 'react';
import {
  Container, Avatar, Typography, Paper, CircularProgress, Alert, Dialog, DialogContent, DialogTitle,
  IconButton, TextField, Button, Box, Grid,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Chart from 'react-apexcharts';
import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider, useQuery, useLazyQuery, gql } from '@apollo/client';
import { Masonry } from '@mui/lab';
import './App.css';

// Apollo Client setup
const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
  cache: new InMemoryCache(),
});

// Define the dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
});

// GraphQL queries
const GET_INFLUENCER_DATA = gql`
  query {
    getInfluencerData {
      name
      handle
      profilePic
      followers
      following
      postCount
      posts {
        imageUrl
        caption
        likes
        comments
      }
      averageLikes
      averageComments
      engagementRate
    }
  }
`;

const TAG_IMAGE_WITH_GEMINI = gql`
  query TagImageWithGemini($imageUrl: String!) {
    tagImageWithGemini(imageUrl: $imageUrl)
  }
`;

// Format numbers
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
};

function App() {
  const { loading, error, data } = useQuery(GET_INFLUENCER_DATA);
  const [selectedPost, setSelectedPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [geminiResult, setGeminiResult] = useState('');

  const [tagImage, { loading: geminiLoading, data: geminiData, error: geminiError }] = useLazyQuery(TAG_IMAGE_WITH_GEMINI);

  useEffect(() => {
    if (geminiData) {
      setGeminiResult(geminiData.tagImageWithGemini);
    }
  }, [geminiData]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setGeminiResult('');
    setLiked(false);
    setComments([]);
    if (post.imageUrl) {
      tagImage({ variables: { imageUrl: post.imageUrl } });
    }
  };

  const handleLike = () => setLiked(!liked);
  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    setComments([...comments, newComment]);
    setNewComment('');
  };

  const placeholderImage = 'https://via.placeholder.com/600x400?text=Image+Not+Found';

  if (loading) {
    return (
      <Container className="profile-container">
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading influencer data...</Typography>
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
          <Typography>Please run the backend to seed the database.</Typography>
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
    theme: { mode: 'dark' },
  };

  const interestData = [
    { name: 'Fitness', value: 25 },
    { name: 'Sanatan', value: 15 },
    { name: "Men's Psychology", value: 10 },
    { name: 'Food & Diet', value: 30 },
    { name: 'Social Awareness', value: 15 },
  ];
  const pieOptions = {
    chart: { type: 'donut', toolbar: { show: false }, background: '#1b1b1b' },
    labels: interestData.map((i) => i.name),
    legend: { position: 'bottom', labels: { colors: '#fff' } },
    dataLabels: { style: { colors: ['#fff'] } },
    plotOptions: { pie: { donut: { size: '50%' } } },
    title: { text: 'Interests Distribution', align: 'center', style: { color: '#fff' } },
    theme: { mode: 'dark' },
  };
  const pieSeries = interestData.map((i) => i.value);

  return (
    <Container className="profile-container">
      <header>
        <Avatar
          alt={influencer.name}
          src={influencer.profilePic || placeholderImage}
          sx={{ width: 150, height: 150, margin: '0 auto' }}
        />
        <Typography variant="h4" component="h1" className="profile-name" sx={{ mt: 1 }}>{influencer.name}</Typography>
        <Typography variant="subtitle1" className="profile-handle">@{influencer.handle}</Typography>
      </header>

      <Grid container spacing={2} className="profile-stats" sx={{mb: 4}}>
        {[
          ['Posts', influencer.postCount],
          ['Followers', influencer.followers],
          ['Following', influencer.following],
          ['Avg Likes', influencer.averageLikes.toFixed(1)],
          ['Avg Comments', influencer.averageComments.toFixed(1)],
          ['Engagement', influencer.engagementRate.toFixed(2) + '%'],
        ].map(([label, value], i) => (
          <Grid item xs={6} sm={4} md={2} key={i}>
            <Paper elevation={3} className="stat-box">
              <Typography variant="h6">{formatNumber(value)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <div className="chart-container">
        <Chart options={chartOptions} series={chartSeries} type="line" height={400} />
      </div>

      <Paper className="chart-card">
        <Chart options={pieOptions} series={pieSeries} type="donut" height={350} />
      </Paper>

      <Typography variant="h5" sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
        Recent Posts
      </Typography>

      <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
        {influencer.posts.map((post, index) => (
          <Paper
            className="post-card"
            key={index}
            onClick={() => handlePostClick(post)}
          >
            <img
              src={post.imageUrl || placeholderImage}
              alt="post"
              className="post-image"
            />
            <Typography variant="body1" className="post-caption">{post.caption}</Typography>
            <Typography variant="caption" color="text.secondary">Likes: {post.likes}</Typography>
          </Paper>
        ))}
      </Masonry>
      
      <Dialog open={!!selectedPost} onClose={() => setSelectedPost(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Post Details
          <IconButton onClick={() => setSelectedPost(null)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
        </DialogTitle>
        {selectedPost && (
          <DialogContent>
            <img
              src={selectedPost.imageUrl || placeholderImage}
              alt="post"
              style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }}
            />
            <Box mb={2}>
              <Typography variant="subtitle2">Likes:</Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <IconButton onClick={handleLike} color={liked ? 'error' : 'default'}>{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}</IconButton>
                <Typography variant="body2">{selectedPost.likes + (liked ? 1 : 0)} likes</Typography>
              </Box>
              <Typography variant="body1" style={{ marginBottom: '10px' }}>{selectedPost.caption}</Typography>
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle2">Gemini Analysis:</Typography>
              {geminiLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>
              ) : geminiError ? (
                <Alert severity="error"><Typography>An error occurred: {geminiError.message}</Typography></Alert>
              ) : (
                <Typography variant="body2">{geminiResult || 'Click a post to analyze.'}</Typography>
              )}
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Container>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider theme={darkTheme}>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </ThemeProvider>
  );
}

export default AppWrapper;
