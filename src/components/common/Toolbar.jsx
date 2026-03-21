import React from 'react';
import { Box, Select, MenuItem, FormControl, InputLabel, Button, Typography, Chip, alpha } from '@mui/material';
import { PersonAdd, Business, Link as LinkIcon, PlaylistAdd } from '@mui/icons-material';
import useStore from '../../store/useStore';

export default function Toolbar() {
  const campaigns = useStore((s) => s.campaigns);
  const activeCampaignId = useStore((s) => s.activeCampaignId);
  const setActiveCampaign = useStore((s) => s.setActiveCampaign);
  const persons = useStore((s) => s.persons);
  const organizations = useStore((s) => s.organizations);
  const connections = useStore((s) => s.connections);
  const openAddPersonModal = useStore((s) => s.openAddPersonModal);
  const openAddOrgModal = useStore((s) => s.openAddOrgModal);
  const openAddConnectionModal = useStore((s) => s.openAddConnectionModal);
  const openAssignModal = useStore((s) => s.openAssignModal);

  return (
    <Box sx={{
      position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10,
      display: 'flex', alignItems: 'center', gap: 2,
      pointerEvents: 'none', '& > *': { pointerEvents: 'auto' },
    }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, boxShadow: 3 }}>
        <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.light' }} />
        <Typography variant="h4" sx={{ color: 'inherit', letterSpacing: '0.15em', fontSize: '0.65rem', m: 0 }}>Power Map</Typography>
      </Box>

      <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
        <InputLabel sx={{ fontSize: '0.8rem' }}>Campaign</InputLabel>
        <Select label="Campaign" value={activeCampaignId || ''} onChange={(e) => setActiveCampaign(e.target.value)} sx={{ fontSize: '0.85rem', borderRadius: 2 }}>
          {campaigns.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </Select>
      </FormControl>

      {activeCampaignId && (
        <>
          <Chip label={`${persons.length} people`} size="small" sx={{ bgcolor: 'background.paper', boxShadow: 1 }} />
          <Chip label={`${organizations.length} orgs`} size="small" sx={{ bgcolor: 'background.paper', boxShadow: 1 }} />
          <Chip label={`${connections.length} connections`} size="small" sx={{ bgcolor: 'background.paper', boxShadow: 1 }} />
        </>
      )}

      <Box sx={{ flex: 1 }} />

      {activeCampaignId && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" color="secondary" startIcon={<PersonAdd />} onClick={openAddPersonModal} sx={{ boxShadow: 3 }}>Add Person</Button>
          <Button variant="outlined" startIcon={<Business />} onClick={openAddOrgModal}
            sx={{ bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) } }}>
            Add Org
          </Button>
          <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => openAddConnectionModal()}
            sx={{ bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) } }}>
            Add Connection
          </Button>
          <Button variant="outlined" startIcon={<PlaylistAdd />} onClick={openAssignModal}
            sx={{ bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) } }}>
            Assign
          </Button>
        </Box>
      )}
    </Box>
  );
}
