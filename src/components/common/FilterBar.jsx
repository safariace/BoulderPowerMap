import React from 'react';
import { Box, Paper, Typography, FormControlLabel, Checkbox, Switch, Select, MenuItem, Slider, alpha } from '@mui/material';
import useStore from '../../store/useStore';
import { palette } from '../../theme/theme';

const TIERS = [
  { key: 'showPrimary',   label: 'Primary',   color: palette.primary,   style: 'solid',  desc: 'Same org, spouse' },
  { key: 'showSecondary', label: 'Secondary', color: palette.secondary, style: 'dashed', desc: 'Monthly affiliations' },
  { key: 'showInformal',  label: 'Informal',  color: palette.informal,  style: 'dotted', desc: 'Annual, known to' },
];

const ROLES = [
  { value: 'all', label: 'All Roles' }, { value: 'ally', label: 'Ally' },
  { value: 'champion', label: 'Champion' }, { value: 'neutral', label: 'Neutral' },
  { value: 'opponent', label: 'Opponent' }, { value: 'target', label: 'Target' },
];

export default function FilterBar() {
  const filters = useStore((s) => s.filters);
  const setFilter = useStore((s) => s.setFilter);
  const active = useStore((s) => s.activeCampaignId);
  if (!active) return null;

  return (
    <Paper elevation={3} sx={{
      position: 'absolute', bottom: 20, left: 20, zIndex: 10, p: 2.5, minWidth: 250,
      bgcolor: alpha(palette.ink, 0.92), color: palette.parchment, backdropFilter: 'blur(12px)',
      borderRadius: 3, border: `1px solid ${alpha(palette.parchment, 0.08)}`,
    }}>
      <Typography variant="h4" sx={{ color: palette.tealLight, mb: 1.5 }}>Filters</Typography>

      <Typography variant="caption" sx={{ color: palette.stone, mb: 0.5, display: 'block' }}>Connection Tiers</Typography>
      {TIERS.map((t) => (
        <FormControlLabel key={t.key}
          control={<Checkbox checked={filters[t.key]} onChange={(e) => setFilter(t.key, e.target.checked)} size="small"
            sx={{ color: alpha(t.color, 0.5), '&.Mui-checked': { color: t.color }, p: 0.5 }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 24, height: 0, borderTop: `2.5px ${t.style} ${t.color}` }} />
              <Box>
                <Typography variant="body2" sx={{ color: palette.parchment, fontSize: '0.75rem' }}>{t.label}</Typography>
                <Typography variant="body2" sx={{ color: palette.stone, fontSize: '0.6rem' }}>{t.desc}</Typography>
              </Box>
            </Box>
          }
          sx={{ mx: 0, mb: 0.3 }} />
      ))}

      <FormControlLabel sx={{ mt: 1, mx: 0 }}
        control={<Switch checked={filters.showOrgs} onChange={(e) => setFilter('showOrgs', e.target.checked)} size="small"
          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: palette.teal } }} />}
        label={<Typography variant="body2" sx={{ color: palette.parchment, fontSize: '0.75rem' }}>Show Organizations</Typography>} />

      <Typography variant="caption" sx={{ color: palette.stone, mt: 1.5, mb: 0.5, display: 'block' }}>Role</Typography>
      <Select size="small" value={filters.roleFilter} onChange={(e) => setFilter('roleFilter', e.target.value)} fullWidth
        sx={{ color: palette.parchment, fontSize: '0.8rem', mb: 1.5,
          '.MuiOutlinedInput-notchedOutline': { borderColor: alpha(palette.parchment, 0.15) },
          '.MuiSvgIcon-root': { color: palette.stone } }}>
        {ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
      </Select>

      <Typography variant="caption" sx={{ color: palette.stone, mb: 0.5, display: 'block' }}>Min Influence: {filters.minInfluence}</Typography>
      <Slider value={filters.minInfluence} onChange={(_, v) => setFilter('minInfluence', v)}
        min={0} max={100} step={5} size="small" valueLabelDisplay="auto"
        sx={{ color: palette.teal }} />

      <Typography variant="caption" sx={{ color: palette.stone, mt: 1.5, mb: 0.5, display: 'block' }}>Stature</Typography>
      {[
        { label: 'Participant', rings: 0, color: palette.stone },
        { label: 'Influencer', rings: 1, color: palette.influencer },
        { label: 'Decider', rings: 2, color: palette.navy },
      ].map((s) => (
        <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: s.color, flexShrink: 0,
            border: s.rings > 0 ? `1.5px solid ${palette.ink}` : 'none',
            boxShadow: s.rings > 1 ? `0 0 0 2px ${palette.influencer}` : 'none' }} />
          <Typography variant="body2" sx={{ color: palette.parchment, fontSize: '0.7rem' }}>{s.label} ({s.rings} rings)</Typography>
        </Box>
      ))}
    </Paper>
  );
}
