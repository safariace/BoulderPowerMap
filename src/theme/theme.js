import { createTheme, alpha } from '@mui/material/styles';

export const palette = {
  parchment: '#f0ede6', parchmentDk: '#e4dfd5', ivory: '#faf8f4',
  ink: '#1c1e26', inkSoft: '#2a2d38', slate: '#6b6e7a', stone: '#9a978e',
  navy: '#2c3e6b', navyLight: '#3b5998', teal: '#4ba69c', tealLight: '#6ec4b8',
  coral: '#e06c5d', coralLight: '#f09080', gold: '#d4a853', goldLight: '#f0c040',
  ally: '#5b9bd5', neutral: '#7a8b8a', champion: '#4ba69c',
  target: '#e06c5d', opponent: '#d44040',
  decider: '#2c3e6b', influencer: '#3b82c4', participant: '#9a978e',
  // Tier colors
  primary: '#e06c5d',   // solid – coral
  secondary: '#2c3e6b', // dashed – navy
  informal: '#4ba69c',  // dotted – teal
};

const rpmTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palette.navy, light: palette.navyLight, dark: '#1e2a4a', contrastText: '#fff' },
    secondary: { main: palette.teal, light: palette.tealLight, dark: '#367a72', contrastText: '#fff' },
    error: { main: palette.coral, light: palette.coralLight },
    warning: { main: palette.gold, light: palette.goldLight },
    background: { default: palette.parchment, paper: palette.ivory },
    text: { primary: palette.ink, secondary: palette.slate, disabled: palette.stone },
    divider: alpha(palette.ink, 0.08),
    rpm: palette,
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Space Mono", monospace', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' },
    h2: { fontFamily: '"Space Mono", monospace', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
    h3: { fontFamily: '"DM Sans", sans-serif', fontSize: '1.1rem', fontWeight: 700 },
    h4: { fontFamily: '"Space Mono", monospace', fontSize: '0.7rem', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: palette.slate },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8rem', lineHeight: 1.5, color: palette.slate },
    caption: { fontFamily: '"Space Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: palette.stone },
    button: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.02em', textTransform: 'none' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: { styleOverrides: {
      '@import': ["url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap')"],
      body: { backgroundColor: palette.parchment },
    }},
    MuiPaper: { defaultProps: { elevation: 2 }, styleOverrides: { root: { backgroundImage: 'none', border: `1px solid ${alpha(palette.ink, 0.06)}` } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
      root: { borderRadius: 8, padding: '8px 20px' },
      containedPrimary: { background: `linear-gradient(135deg, ${palette.navy} 0%, ${palette.navyLight} 100%)` },
      containedSecondary: { background: `linear-gradient(135deg, ${palette.teal} 0%, ${palette.tealLight} 100%)` },
    }},
    MuiTab: { styleOverrides: { root: { fontFamily: '"Space Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', minHeight: 44 } } },
    MuiChip: { styleOverrides: { root: { fontFamily: '"Space Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.04em', fontWeight: 700, height: 26 } } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' }, styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } } } },
  },
});

export default rpmTheme;
