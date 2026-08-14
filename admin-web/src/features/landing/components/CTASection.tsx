import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { brand } from '../brand';
import { lightGhostBtn, primaryBtn } from './styles';

export function CTASection() {
  return (
    <Box
      component="section"
      sx={{
        bgcolor: brand.navy,
        py: { xs: 8, md: 10 },
        color: brand.white,
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: 28, md: 40 },
            fontWeight: 800,
            letterSpacing: '-0.035em',
            mb: 1.75,
            lineHeight: 1.15,
          }}
        >
          Make Every School Journey More Visible.
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: { xs: 16, md: 17.5 }, lineHeight: 1.65, mb: 3.5 }}>
          Give your transport team better control and give parents greater peace of mind with SchoolMove.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="center">
          <Button href="#contact" variant="contained" size="large" sx={{ ...primaryBtn, minHeight: 48 }}>
            Book Your School Demo
          </Button>
          <Button href="#contact" variant="outlined" size="large" sx={{ ...lightGhostBtn, minHeight: 48 }}>
            Contact Sales
          </Button>
        </Stack>
        <Typography sx={{ mt: 3, fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          SchoolMove — Track. Travel. Arrive Safely.
        </Typography>
      </Container>
    </Box>
  );
}
