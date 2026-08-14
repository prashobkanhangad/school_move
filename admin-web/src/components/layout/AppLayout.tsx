import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import RouteIcon from '@mui/icons-material/Route';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MapIcon from '@mui/icons-material/Map';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/services/auth.service';
import { disconnectSocket, reconnectSocket } from '@/services/socket';

const DRAWER_WIDTH = 248;

type NavItem = { path: string; label: string; icon: React.ReactNode };

type NavGroup = { label: string; items: NavItem[] };

const schoolNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> }],
  },
  {
    label: 'Transport',
    items: [
      { path: '/monitoring', label: 'Live Tracking', icon: <MapIcon fontSize="small" /> },
      { path: '/routes', label: 'Routes & Stops', icon: <RouteIcon fontSize="small" /> },
      { path: '/buses', label: 'Buses', icon: <DirectionsBusIcon fontSize="small" /> },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/students', label: 'Students', icon: <PeopleAltIcon fontSize="small" /> },
      { path: '/parents', label: 'Parents', icon: <FamilyRestroomIcon fontSize="small" /> },
      { path: '/drivers', label: 'Drivers', icon: <PersonIcon fontSize="small" /> },
    ],
  },
  {
    label: 'Communication',
    items: [
      { path: '/notifications', label: 'Notifications', icon: <NotificationsIcon fontSize="small" /> },
      { path: '/emergencies', label: 'Emergencies', icon: <WarningAmberIcon fontSize="small" /> },
    ],
  },
  {
    label: 'System',
    items: [{ path: '/school', label: 'Settings', icon: <SchoolIcon fontSize="small" /> }],
  },
];

const hubNavGroups: NavGroup[] = [
  {
    label: 'Platform',
    items: [{ path: '/schools', label: 'Schools', icon: <BusinessIcon fontSize="small" /> }],
  },
];

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshToken, clearAuth, activeSchoolId, activeSchoolName, clearActiveSchool } =
    useAuthStore();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const inSchoolContext = !isSuperAdmin || !!activeSchoolId;
  const navGroups = isSuperAdmin && !activeSchoolId ? hubNavGroups : schoolNavGroups;
  const flatNav = navGroups.flatMap((g) => g.items);
  const currentLabel =
    flatNav.find((n) => n.path === location.pathname)?.label ||
    (inSchoolContext ? 'Admin' : 'Schools');

  const handleLogout = async () => {
    try {
      if (refreshToken) await logout(refreshToken);
    } finally {
      disconnectSocket();
      clearAuth();
      navigate('/login');
    }
  };

  const handleExitSchool = () => {
    clearActiveSchool();
    reconnectSocket();
    navigate('/schools');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 2.25 }}>
        <Typography
          variant="subtitle1"
          color="primary.dark"
          fontWeight={700}
          letterSpacing={-0.3}
          lineHeight={1.2}
        >
          School Bus
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.35 }}>
          {isSuperAdmin ? 'Platform Admin' : 'Transport Ops'}
        </Typography>
        {isSuperAdmin && activeSchoolName && (
          <Chip
            size="small"
            label={activeSchoolName}
            sx={{ mt: 1.5, maxWidth: '100%' }}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>
      <Divider />
      <Box sx={{ px: 1.25, py: 1.5, flexGrow: 1, overflowY: 'auto' }}>
        {navGroups.map((group) => (
          <Box key={group.label} mb={1.75}>
            <Typography
              variant="caption"
              sx={{
                px: 1.25,
                mb: 0.75,
                display: 'block',
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontSize: 10,
              }}
            >
              {group.label}
            </Typography>
            <List disablePadding>
              {group.items.map((item) => (
                <ListItemButton
                  key={item.path}
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{ borderRadius: 1.5, mb: 0.25, py: 0.85, px: 1.25 }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>
      {isSuperAdmin && activeSchoolId && (
        <Box sx={{ px: 1.5, pb: 2, pt: 1 }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleExitSchool}
          >
            Exit school
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 60 }, px: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {currentLabel}
            </Typography>
          </Box>
          {isSuperAdmin && activeSchoolName && (
            <Chip label={activeSchoolName} size="small" variant="outlined" sx={{ mr: 1.5, display: { xs: 'none', sm: 'flex' } }} />
          )}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'primary.main',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { mt: 1, minWidth: 220, border: '1px solid', borderColor: 'divider' } }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography fontWeight={600} variant="body2">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            {isSuperAdmin && activeSchoolId && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  handleExitSchool();
                }}
              >
                <ListItemIcon>
                  <ArrowBackIcon fontSize="small" />
                </ListItemIcon>
                Exit school
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: '56px', sm: '60px' },
          maxWidth: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
