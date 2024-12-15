import { useState } from 'react';
import { TextField, Button, Alert, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { useTranslation } from '../../hooks/useTranslation';
import authService from '../../services/authService';

export default function RequestPasswordReset() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.resetPassword.enterEmail'));
      return;
    }
    setError('');
    setLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t('auth.resetPassword.resetError'));
      }
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        mx: 'auto',
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          {t('auth.resetPassword.title')}
        </Typography>

        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('auth.resetPassword.success')}
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label={t('auth.resetPassword.email')}
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : t('auth.resetPassword.sendLink')}
              </Button>
            </form>
          </>
        )}
      </Paper>
    </Box>
  );
}
