import { useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../brand';
import { primaryBtn } from './styles';

const fleetOptions = ['Up to 5 buses', 'Up to 10 buses', 'Up to 20 buses', 'Above 20 buses'];

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    school: '',
    email: '',
    phone: '',
    fleet: 'Up to 10 buses',
    message: '',
  });

  if (sent) {
    return (
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          border: `1px solid ${brand.line}`,
          borderRadius: '12px',
          bgcolor: brand.white,
        }}
      >
        <Typography sx={{ color: brand.navy, fontWeight: 800, fontSize: 22, mb: 1 }}>
          Thank you. We’ll be in touch.
        </Typography>
        <Typography sx={{ color: brand.muted, lineHeight: 1.65 }}>
          Your demo request for {form.school || 'your school'} has been recorded in this session.
          If you already have a SchoolMove account, you can sign in to the admin portal now.
        </Typography>
        <Button component={RouterLink} to="/login" variant="contained" sx={{ ...primaryBtn, mt: 2.5 }}>
          Login
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        border: `1px solid ${brand.line}`,
        borderRadius: '12px',
        bgcolor: brand.white,
      }}
    >
      <Typography sx={{ color: brand.navy, fontWeight: 800, fontSize: 20, mb: 0.5 }}>
        Book a school demo
      </Typography>
      <Typography sx={{ color: brand.muted, fontSize: 14.5, mb: 2.5 }}>
        Tell us about your fleet. We’ll walk you through live tracking, parent updates, and admin operations.
      </Typography>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            required
            fullWidth
            label="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            required
            fullWidth
            label="School name"
            value={form.school}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            required
            fullWidth
            type="email"
            label="Work email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Stack>
        <TextField
          select
          fullWidth
          label="Fleet size"
          value={form.fleet}
          onChange={(e) => setForm({ ...form, fleet: e.target.value })}
        >
          {fleetOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Anything we should know"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <Button type="submit" variant="contained" size="large" sx={{ ...primaryBtn, minHeight: 48, alignSelf: 'flex-start' }}>
          Book a Demo
        </Button>
      </Stack>
    </Box>
  );
}
