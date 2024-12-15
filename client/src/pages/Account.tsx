import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import authService from '../services/authService';

export default function Account() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            {t('account.title')}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setOpenLogoutDialog(true)}
          >
            {t('account.logout')}
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <List>
          <ListItem>
            <ListItemText
              primary={t('account.name')}
              secondary={user.name}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t('account.email')}
              secondary={user.email}
            />
          </ListItem>
        </List>
      </Paper>

      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
      >
        <DialogTitle>{t('account.logoutConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('account.logoutConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogoutDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleLogout} color="error" autoFocus>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
