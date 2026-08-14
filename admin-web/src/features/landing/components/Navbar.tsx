import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { LOGO, brand } from '../brand';
import { primaryBtn } from './styles';

const navLinks = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#schools', label: 'For Schools' },
  { href: '#parents', label: 'For Parents' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        bgcolor: 'rgba(255,255,255,0.96)',
        borderBottom: `1px solid ${brand.line}`,
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.15 }}>
          <Box
            component="a"
            href="#top"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', minWidth: 0 }}
          >
            <Box
              component="img"
              src={LOGO}
              alt="SchoolMove"
              sx={{ height: { xs: 40, sm: 46 }, width: 'auto', display: 'block' }}
            />
          </Box>

          <Stack
            direction="row"
            spacing={2.75}
            alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {navLinks.map((link) => (
              <Box
                key={link.href}
                component="a"
                href={link.href}
                sx={{
                  color: brand.navy,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: 0.82,
                  '&:hover': { opacity: 1, color: brand.navy },
                }}
              >
                {link.label}
              </Box>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button
              component={RouterLink}
              to="/login"
              sx={{
                color: brand.navy,
                textTransform: 'none',
                fontWeight: 600,
                px: 1.5,
              }}
            >
              Login
            </Button>
            <Button href="#contact" variant="contained" sx={primaryBtn}>
              Book a Demo
            </Button>
          </Stack>

          <IconButton
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            sx={{ color: brand.navy, display: { md: 'none' } }}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Stack>
      </Container>

      {open && (
        <Box
          sx={{
            display: { md: 'none' },
            borderTop: `1px solid ${brand.line}`,
            px: 2.5,
            py: 2,
            bgcolor: brand.white,
          }}
        >
          <Stack spacing={1.75}>
            {navLinks.map((link) => (
              <Box
                key={link.href}
                component="a"
                href={link.href}
                onClick={() => setOpen(false)}
                sx={{ color: brand.navy, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}
              >
                {link.label}
              </Box>
            ))}
            <Button component={RouterLink} to="/login" onClick={() => setOpen(false)} sx={{ justifyContent: 'flex-start', color: brand.navy, textTransform: 'none', fontWeight: 600, px: 0 }}>
              Login
            </Button>
            <Button href="#contact" variant="contained" onClick={() => setOpen(false)} sx={primaryBtn}>
              Book a Demo
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
