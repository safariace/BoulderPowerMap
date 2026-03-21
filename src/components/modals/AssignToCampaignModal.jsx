import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Autocomplete, TextField, Slider, Typography,
  ToggleButton, ToggleButtonGroup, Box, Alert,
} from '@mui/material';
import { PersonAdd, Business } from '@mui/icons-material';
import { personsApi, orgsApi, campaignAssignApi } from '../../api/supabase';
import useStore, { inferStature } from '../../store/useStore';

const STATURE_LABEL = ['Participant', 'Influencer', 'Decider'];

export default function AssignToCampaignModal() {
  const open = useStore((s) => s.assignModalOpen);
  const closeAssignModal = useStore((s) => s.closeAssignModal);
  const activeCampaignId = useStore((s) => s.activeCampaignId);
  const fetchGraph = useStore((s) => s.fetchGraph);

  const [entityType, setEntityType] = useState('person');
  const [allPersons, setAllPersons] = useState([]);
  const [allOrgs, setAllOrgs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [influence, setInfluence] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSelected(null);
      setInfluence(50);
      setError('');
      personsApi.list().then(setAllPersons).catch(console.error);
      orgsApi.list().then(setAllOrgs).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (selected) setInfluence(selected.influence_score ?? 50);
  }, [selected]);

  const handleTypeChange = (_, v) => {
    if (!v) return;
    setEntityType(v);
    setSelected(null);
  };

  const handleAssign = async () => {
    if (!selected || !activeCampaignId) return;
    setLoading(true);
    setError('');
    try {
      if (entityType === 'person') {
        await campaignAssignApi.addPerson(activeCampaignId, selected.id, influence);
      } else {
        await campaignAssignApi.addOrg(activeCampaignId, selected.id, influence);
      }
      await fetchGraph(activeCampaignId);
      closeAssignModal();
    } catch (err) {
      setError(err.message || 'Assignment failed');
    }
    setLoading(false);
  };

  const options = entityType === 'person' ? allPersons : allOrgs;
  const stature = inferStature(influence);

  return (
    <Dialog open={open} onClose={closeAssignModal} maxWidth="sm" fullWidth>
      <DialogTitle>Assign to Campaign</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>

          <ToggleButtonGroup value={entityType} exclusive onChange={handleTypeChange} size="small" fullWidth>
            <ToggleButton value="person" sx={{ gap: 1 }}>
              <PersonAdd fontSize="small" /> Person
            </ToggleButton>
            <ToggleButton value="org" sx={{ gap: 1 }}>
              <Business fontSize="small" /> Organization
            </ToggleButton>
          </ToggleButtonGroup>

          <Autocomplete
            options={options}
            getOptionLabel={(o) => o.name}
            value={selected}
            onChange={(_, v) => setSelected(v)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} label={entityType === 'person' ? 'Search person…' : 'Search organization…'} />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {entityType === 'person'
                      ? [option.primary_role, option.primary_org_name].filter(Boolean).join(' · ')
                      : [option.org_type, option.category].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              </Box>
            )}
          />

          {selected && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Campaign Influence: <strong>{influence}</strong> — {STATURE_LABEL[stature]}
              </Typography>
              <Slider
                value={influence}
                onChange={(_, v) => setInfluence(v)}
                min={0} max={100} step={5}
                valueLabelDisplay="auto"
                marks={[{ value: 60, label: '60' }, { value: 80, label: '80' }]}
              />
              <Typography variant="caption" color="text.secondary">
                Global score: {selected.influence_score ?? 50}. This override applies only within this campaign.
              </Typography>
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeAssignModal}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={!selected || loading}
        >
          {loading ? 'Assigning…' : 'Assign to Campaign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
