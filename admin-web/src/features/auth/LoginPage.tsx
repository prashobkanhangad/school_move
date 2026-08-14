import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { login } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/services/api';
import { isAdminRole, postLoginPath } from '@/lib/adminAccess';
import { brand } from '@/features/landing/brand';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearActiveSchool = useAuthStore((s) => s.clearActiveSchool);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (!isAdminRole(data.user.role)) {
        setError('Access denied. Admin credentials required.');
        return;
      }
      clearActiveSchool();
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      navigate(postLoginPath(data.user.role));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{
        bgcolor: brand.black,
        p: 2,
      }}
    >
      <Box component={RouterLink} to="/" sx={{ mb: 2, display: 'block' }}>
        <Box
          component="img"
          src="/schoolmove.png"
          alt="SchoolMove"
          sx={{ height: 72, width: 'auto', display: 'block' }}
        />
      </Box>
      <Card
        variant="outlined"
        sx={{
          maxWidth: 420,
          width: '100%',
          borderRadius: 2,
          bgcolor: brand.navy,
          borderColor: 'rgba(252, 162, 0, 0.28)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h5" fontWeight={600} mb={0.75} letterSpacing={-0.3} sx={{ color: brand.white }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: brand.white, opacity: 0.72 }}>
              Sign in to manage school transport operations.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              size="medium"
              sx={loginFieldSx}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              size="medium"
              sx={loginFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      sx={{ color: brand.white }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                bgcolor: brand.orange,
                color: brand.black,
                fontWeight: 700,
                '&:hover': { bgcolor: brand.white, color: brand.black },
                '&.Mui-disabled': { bgcolor: 'rgba(252, 162, 0, 0.4)', color: brand.black },
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Button
        component={RouterLink}
        to="/"
        sx={{ mt: 2, color: brand.orange, textTransform: 'none', fontWeight: 600 }}
      >
        Back to SchoolMove
      </Button>
    </Box>
  );
}

const loginFieldSx = {
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
  '& .MuiInputLabel-root.Mui-focused': { color: brand.orange },
  '& .MuiOutlinedInput-root': {
    color: brand.white,
    bgcolor: brand.black,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&:hover fieldset': { borderColor: brand.orange },
    '&.Mui-focused fieldset': { borderColor: brand.orange },
  },
};
