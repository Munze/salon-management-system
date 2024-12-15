import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change }) => {
  const isPositive = change && change > 0;
  const changeColor = isPositive ? '#4caf50' : '#f44336';
  const changeText = change ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : undefined;

  return (
    <Card sx={{ 
      height: '100%',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #f8f9fa 100%)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderRadius: 2,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }
    }}>
      <CardContent>
        <Typography 
          color="text.secondary" 
          gutterBottom 
          sx={{ 
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h4" 
          component="div"
          sx={{ 
            fontWeight: 600,
            mb: 1
          }}
        >
          {value}
        </Typography>
        {changeText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isPositive ? (
              <TrendingUpIcon sx={{ color: changeColor, fontSize: '1rem' }} />
            ) : (
              <TrendingDownIcon sx={{ color: changeColor, fontSize: '1rem' }} />
            )}
            <Typography 
              variant="body2" 
              sx={{ 
                color: changeColor,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {changeText}
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
