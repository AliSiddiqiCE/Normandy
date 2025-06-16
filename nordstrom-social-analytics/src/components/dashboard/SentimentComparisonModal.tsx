import React from 'react';
import { Modal, Box, Grid, Typography, Chip, Button, Card, CardContent, Divider } from '@mui/material';
import { TikTokPost, InstagramPost, Brand } from '../../types';
import { analyzeTextSentiment, DetailedSentimentAnalysis } from '../../utils/sentimentUtils';
import { useSocialData } from '../../context/SocialDataContext'; // For darkMode

// Create a common type for social media posts with the properties we need for sentiment analysis
type SocialMediaPost = {
  brandName?: Brand;
  engagementRate?: number;
  text?: string; // For TikTok
  caption?: string; // For Instagram
};

interface SentimentComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPost: (TikTokPost | InstagramPost) & SocialMediaPost | null;
  nordstromTopPosts: ((TikTokPost | InstagramPost) & SocialMediaPost)[];
}

const NORDSTROM_PRIMARY_COLOR = '#ff4c0c'; // Define Nordstrom's primary color

const getSentimentColors = (label: DetailedSentimentAnalysis['label'], darkMode: boolean): { color: string; backgroundColor: string } => {
  switch (label) {
    case 'Positive':
      return {
        color: darkMode ? 'rgb(134, 239, 172)' : 'rgb(22, 101, 52)',
        backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
      };
    case 'Negative':
      return {
        color: darkMode ? 'rgb(252, 165, 165)' : 'rgb(153, 27, 27)',
        backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
      };
    default: // Neutral
      return {
        color: darkMode ? 'rgb(209, 213, 219)' : 'rgb(75, 85, 99)',
        backgroundColor: darkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.1)',
      };
  }
};

interface PostSentimentCardProps {
  post: (TikTokPost | InstagramPost) & SocialMediaPost;
  sentiment: DetailedSentimentAnalysis;
  darkMode: boolean;
  isSelectedPost?: boolean;
}

const PostSentimentCard: React.FC<PostSentimentCardProps> = ({ post, sentiment, darkMode, isSelectedPost }) => {
  const { score, label, positiveWords, negativeWords } = sentiment;
  const { color, backgroundColor } = getSentimentColors(label, darkMode);
  
  // Get the post content, which could be in text (TikTok) or caption (Instagram)
  const postContent = post.text || post.caption || '';

  return (
    <Card sx={{ 
      mb: 2, 
      bgcolor: darkMode ? 'rgb(17, 24, 39)' : 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      <CardContent>
        {/* Post Text */}
        <Typography 
          variant="h6" 
          component="h3"
          sx={{ 
            mb: 1,
            color: NORDSTROM_PRIMARY_COLOR,
            fontWeight: 600
          }}
        >
          {post.brandName} - Post Sentiment
        </Typography>
        <Box
          sx={{
            mb: 3,
            maxHeight: '200px',
            overflowY: 'auto',
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              },
            },
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              color: darkMode ? 'gray.100' : 'gray.900',
              fontSize: '1rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {postContent}
          </Typography>
        </Box>

        {/* Score and Label Section */}
        <Box sx={{ 
          display: 'flex', 
          gap: 4, 
          mb: 3,
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          borderRadius: 1,
          bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
        }}>
          {/* Score */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: darkMode ? 'gray.400' : 'gray.600', mb: 1 }}>
              Sentiment Score
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: color, fontFamily: 'monospace' }}>
              {score.toFixed(1)}
            </Typography>
          </Box>

          {/* Label */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: darkMode ? 'gray.400' : 'gray.600', mb: 1 }}>
              Overall Sentiment
            </Typography>
            <Chip
              label={label}
              size="medium"
              sx={{
                backgroundColor: backgroundColor,
                color: color,
                fontWeight: 600,
                fontSize: '0.95rem',
                py: 0.5
              }}
            />
          </Box>
        </Box>

        {/* Terms Analysis */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Positive Terms */}
          {positiveWords.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? '#4ade80' : '#15803d',
                  mb: 1,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                ✨ Positive Terms
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                p: 1.5,
                borderRadius: 1,
                maxHeight: '120px',
                overflowY: 'auto',
                bgcolor: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: darkMode ? 'rgba(134, 239, 172, 0.3)' : 'rgba(22, 101, 52, 0.2)',
                  borderRadius: '3px',
                },
              }}>
                {positiveWords.map((word: string, index: number) => (
                  <Chip
                    key={`${word}-${index}`}
                    label={word}
                    size="small"
                    sx={{
                      backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                      color: darkMode ? 'rgb(134, 239, 172)' : 'rgb(22, 101, 52)',
                      margin: '2px',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Negative Terms */}
          {negativeWords.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: darkMode ? '#f87171' : '#b91c1c',
                  mb: 1,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                ⚠️ Negative Terms
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                p: 1.5,
                borderRadius: 1,
                maxHeight: '120px',
                overflowY: 'auto',
                bgcolor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: darkMode ? 'rgba(252, 165, 165, 0.3)' : 'rgba(153, 27, 27, 0.2)',
                  borderRadius: '3px',
                },
              }}>
                {negativeWords.map((word: string, index: number) => (
                  <Chip
                    key={`${word}-${index}`}
                    label={word}
                    size="small"
                    sx={{
                      backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      color: darkMode ? 'rgb(252, 165, 165)' : 'rgb(153, 27, 27)',
                      margin: '2px',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const SentimentComparisonModal: React.FC<SentimentComparisonModalProps> = ({ isOpen, onClose, selectedPost }) => {
  const { darkMode } = useSocialData();

  if (!isOpen || !selectedPost) return null;

  // Get the post content, which could be in text (TikTok) or caption (Instagram)
  const postContent = selectedPost.text || selectedPost.caption || '';
  const selectedPostSentiment = analyzeTextSentiment(postContent);

  const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    bgcolor: darkMode ? 'rgb(31, 41, 55)' : 'background.paper',
    border: `2px solid ${NORDSTROM_PRIMARY_COLOR}`,
    boxShadow: 24,
    p: 3,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    '&::-webkit-scrollbar': {
      width: '10px',
    },
    '&::-webkit-scrollbar-track': {
      background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    '&::-webkit-scrollbar-thumb': {
      background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      borderRadius: '4px',
      '&:hover': {
        background: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
      },
    },
  };

  return (
    <Modal open={isOpen} onClose={onClose} aria-labelledby="sentiment-modal-title">
      <Box sx={modalStyle} className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
        <Box className="flex justify-between items-center mb-2">
          <Typography id="sentiment-modal-title" variant="h6" component="h2" style={{ color: NORDSTROM_PRIMARY_COLOR }}>
            Sentiment Analysis
          </Typography>
          <Button 
            onClick={onClose}
            sx={{
              minWidth: '24px',
              height: '24px',
              padding: '4px 8px',
              color: darkMode ? 'white' : 'black',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }
            }}
          >
            ×
          </Button>
        </Box>
        <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', marginBottom: 2 }} />
        <PostSentimentCard post={selectedPost} sentiment={selectedPostSentiment} darkMode={darkMode} isSelectedPost />
      </Box>
    </Modal>
  );
};

export default SentimentComparisonModal;
