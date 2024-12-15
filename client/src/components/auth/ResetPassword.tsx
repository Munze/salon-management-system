import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TextField, Button, Alert, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { useTranslation } from '../../hooks/useTranslation';
import authService from '../../services/authService';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError(t('auth.register.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.register.passwordsDoNotMatch'));
      return;
    }
    if (!token) {
      setError(t('auth.resetPassword.invalidToken'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.resetPassword({
        token,
        password,
        email: searchParams.get('email') || '',
      });
      navigate('/login', { state: { message: t('auth.resetPassword.passwordResetSuccess') } });
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t('auth.resetPassword.resetError'));
      }
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
        <Alert severity="error">{t('auth.resetPassword.invalidToken')}</Alert>
      </Box>
    );
  }

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
            name="password"
            label={t('auth.resetPassword.newPassword')}
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label={t('auth.resetPassword.confirmNewPassword')}
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('auth.resetPassword.resetPassword')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
