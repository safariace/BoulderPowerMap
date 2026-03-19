import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box,
  TextField, Select, MenuItem, FormControl, InputLabel, Slider,
  Typography, Button, Chip, Alert, alpha,
} from '@mui/material';
import useStore, { inferStature } from '../../store/useStore';
import { palette } from '../../theme/theme';

const ORG_TYPES = ['government', 'nonprofit', 'corporate', 'community', 'political', 'other'];
const STATURE_LABELS = ['Participant', 'Influencer', 'Decider'];

const BLANK = { name: '', org_type: 'other', description: '', website_url: '', influence_score: 50, notes: '' };

export default function AddOrgModal() {
  const open = useStore((s) => s.addOrgModalOpen);
  const close = useStore((s) => s.closeAddOrgModal);
  const createOrg = useStore((s) => s.createOrg);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);
  const handleClose = () => { setForm({ ...BLANK }); setError(null); close(); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError(null);
    try { await createOrg(form); handleClose(); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const stature = inferStature(form.influence_score);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle><Typography variant="h2" sx={{ fontSize: '1rem' }}>Add Organization</Typography></DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField label="Organization Name" value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus fullWidth />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={form.org_type} label="Type" onChange={(e) => set('org_type', e.target.value)}>
              {ORG_TYPES.map((t) => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} fullWidth multiline rows={2} />
          <TextField label="Website URL" value={form.website_url} onChange={(e) => set('website_url', e.target.value)} fullWidth />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption">Influence Score</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h3" sx={{ fontSize: '1.3rem' }}>{form.influence_score}</Typography>
                <Chip label={STATURE_LABELS[stature]} size="small" sx={{
                  bgcolor: alpha(stature === 2 ? palette.navy : stature === 1 ? palette.influencer : palette.stone, 0.15),
                  color: stature === 2 ? palette.navy : stature === 1 ? palette.influencer : palette.slate,
                }} />
              </Box>
            </Box>
            <Slider value={form.influence_score} onChange={(_, v) => set('influence_score', v)} min={0} max={100}
              sx={{ color: stature === 2 ? palette.navy : stature === 1 ? palette.influencer : palette.stone }} />
          </Box>

          <TextField label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} fullWidth multiline rows={4}
            placeholder="Background, mission, political alignment…" />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add Organization'}</Button>
      </DialogActions>
    </Dialog>
  );
}
