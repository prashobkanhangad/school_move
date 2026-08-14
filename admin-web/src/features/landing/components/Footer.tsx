import { Box, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { LOGO, brand } from '../brand';

const groups = [
  {
    title: 'Product',
    links: [
      { label: 'Live Tracking', href: '#tracking' },
      { label: 'Parent App', href: '#parents' },
      { label: 'Driver App', href: '#drivers' },
      { label: 'Admin Portal', to: '/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Privacy Policy', href: '/privacy.html' },
      { label: 'Terms', href: '/terms.html' },
    ],
  },
];

export function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: brand.navy, color: brand.white, pt: { xs: 6, md: 8 }, pb: 3 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr 1fr 1fr' },
            gap: { xs: 3.5, md: 4 },
            pb: 5,
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Box>
            <Box component="img" src={LOGO} alt="SchoolMove" sx={{ height: 44, width: 'auto', display: 'block', mb: 1.5 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>
              Smart School Transport Management
            </Typography>
          </Box>
          {groups.map((group) => (
            <Box key={group.title}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1.5, letterSpacing: 0.4 }}>{group.title}</Typography>
              <Stack spacing={1}>
                {group.links.map((link) =>
                  'to' in link && link.to ? (
                    <Box
                      key={link.label}
                      component={RouterLink}
                      to={link.to}
                      sx={footerLink}
                    >
                      {link.label}
                    </Box>
                  ) : (
                    <Box key={link.label} component="a" href={link.href} sx={footerLink}>
                      {link.label}
                    </Box>
                  ),
                )}
              </Stack>
            </Box>
          ))}
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
          sx={{ pt: 2.5 }}
        >
          <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>SchoolMove by Techweo</Typography>
          <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            © 2026 Techweo. All rights reserved.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

const footerLink = {
  color: 'rgba(255,255,255,0.72)',
  textDecoration: 'none',
  fontSize: 14,
  '&:hover': { color: brand.orange },
};
