import { brand } from '../brand';

export const sectionAnchor = {
  scrollMarginTop: { xs: '76px', md: '88px' },
} as const;

export const primaryBtn = {
  bgcolor: brand.orange,
  color: brand.navy,
  textTransform: 'none' as const,
  fontWeight: 700,
  borderRadius: '8px',
  boxShadow: 'none',
  px: 2.5,
  '&:hover': {
    bgcolor: '#E89400',
    color: brand.navy,
    boxShadow: 'none',
  },
};

export const navyBtn = {
  bgcolor: brand.navy,
  color: brand.white,
  textTransform: 'none' as const,
  fontWeight: 700,
  borderRadius: '8px',
  boxShadow: 'none',
  px: 2.5,
  '&:hover': {
    bgcolor: '#002A6B',
    boxShadow: 'none',
  },
};

export const ghostBtn = {
  color: brand.navy,
  borderColor: brand.line,
  textTransform: 'none' as const,
  fontWeight: 600,
  borderRadius: '8px',
  bgcolor: brand.white,
  px: 2.5,
  '&:hover': {
    borderColor: brand.navy,
    bgcolor: brand.paper,
  },
};

export const lightGhostBtn = {
  color: brand.white,
  borderColor: 'rgba(255,255,255,0.35)',
  textTransform: 'none' as const,
  fontWeight: 600,
  borderRadius: '8px',
  px: 2.5,
  '&:hover': {
    borderColor: brand.white,
    bgcolor: 'rgba(255,255,255,0.08)',
  },
};
