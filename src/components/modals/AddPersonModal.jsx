import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Box,
  TextField, Select, MenuItem, FormControl, InputLabel, Slider, Typography,
  Button, Chip, Alert, Autocomplete, alpha,
} from '@mui/material';
import useStore, { inferStature } from '../../store/useStore';
import { palette } from '../../theme/theme';

const ROLES = [
  { value: 'ally', label: 'Ally', color: palette.ally },
  { value: 'champion', label: 'Champion', color: palette.champion },
  { value: 'neutral', label: 'Neutral', color: palette.neutral },
  { value: 'target', label: 'Target', color: palette.target },
  { value: 'opponent', label: 'Opponent', color: palette.opponent },
];

const LEANINGS = ['progressive', 'moderate', 'conservative', 'unknown'];
const STATURE_LABELS = ['Participant', 'Influencer', 'Decider'];

const BLANK = {
  name: '', primary_role: '', primary_org_name: '',
  secondary_role: '', secondary_org_name: '', chaperone_id: null,
  email: '', phone: '', linkedin_url: '', website_url: '',
  influence_score: 50, role_category: 'neutral', political_leaning: 'unknown',
  notes: '',
};

export default function AddPersonModal() {
  const open = useStore((s) => s.addPersonModalOpen);
  const close = useStore((s) => s.closeAddPersonModal);
  const createPerson = useStore((s) => s.createPerson);
  const persons = useStore((s) => s.persons);

  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);
  const handleClose = () => { setForm({ ...BLANK }); setTab(0); setError(null); close(); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); setTab(0); return; }
    setSaving(true); setError(null);
    try { await createPerson(form); handleClose(); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const stature = inferStature(form.influence_score);
  const chaperoneOptions = persons.filter((p) => p.name !== form.name).map((p) => ({ id: p.id, label: p.name }));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { minHeight: 520 } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography variant="h2" sx={{ fontSize: '1rem', mb: 0.5 }}>Add Person</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1 }}>
          <Tab label="Identity & Roles" />
          <Tab label="Power Dynamics" />
          <Tab label="Contact & Notes" />
        </Tabs>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Tab 0: Identity & Roles ── */}
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Full Name" value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus fullWidth />

            <Typography variant="caption" sx={{ mt: 1 }}>Primary Role</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Role / Title" value={form.primary_role} onChange={(e) => set('primary_role', e.target.value)} fullWidth />
              <TextField label="Organization" value={form.primary_org_name} onChange={(e) => set('primary_org_name', e.target.value)} fullWidth />
            </Box>

            <Typography variant="caption" sx={{ mt: 1 }}>Secondary Role</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Role / Title" value={form.secondary_role} onChange={(e) => set('secondary_role', e.target.value)} fullWidth />
              <TextField label="Organization" value={form.secondary_org_name} onChange={(e) => set('secondary_org_name', e.target.value)} fullWidth />
            </Box>

            <Autocomplete
              options={chaperoneOptions}
              value={chaperoneOptions.find((o) => o.id === form.chaperone_id) || null}
              onChange={(_, v) => set('chaperone_id', v?.id || null)}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Chaperone (gatekeeper)" helperText="Person who manages access to them" />}
            />
          </Box>
        )}

        {/* ── Tab 1: Power Dynamics ── */}
        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="caption">Influence Score</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.5rem' }}>{form.influence_score}</Typography>
                  <Chip label={STATURE_LABELS[stature]} size="small" sx={{
                    bgcolor: alpha(stature === 2 ? palette.navy : stature === 1 ? palette.influencer : palette.stone, 0.15),
                    color: stature === 2 ? palette.navy : stature === 1 ? palette.influencer : palette.slate,
                  }} />
                </Box>
              </Box>
              <Slider value={form.influence_score} onChange={(_, v) => set('influence_score', v)} min={0} max={100}
                marks={[{ value: 0, label: '0' }, { value: 60, label: '60' }, { value: 80, label: '80' }, { value: 100, label: '100' }]}
                sx={{ color: stature === 2 ? palette.navy : stature === 1 ? palette.influencer : palette.stone }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.68rem' }}>0–59: Participant</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.68rem' }}>60–79: Influencer</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.68rem' }}>80+: Decider</Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Campaign Role</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {ROLES.map((r) => (
                  <Chip key={r.value} label={r.label} clickable onClick={() => set('role_category', r.value)}
                    sx={{
                      bgcolor: form.role_category === r.value ? alpha(r.color, 0.2) : alpha(palette.ink, 0.04),
                      color: form.role_category === r.value ? r.color : palette.slate,
                      border: form.role_category === r.value ? `1.5px solid ${r.color}` : '1.5px solid transparent',
                      fontWeight: form.role_category === r.value ? 700 : 400,
                    }} />
                ))}
              </Box>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Political Leaning</InputLabel>
              <Select value={form.political_leaning} label="Political Leaning" onChange={(e) => set('political_leaning', e.target.value)}>
                {LEANINGS.map((l) => <MenuItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* ── Tab 2: Contact & Notes ── */}
        {tab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} fullWidth />
            <TextField label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} fullWidth />
            <TextField label="LinkedIn URL" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} fullWidth placeholder="https://linkedin.com/in/..." />
            <TextField label="Website URL" value={form.website_url} onChange={(e) => set('website_url', e.target.value)} fullWidth />

            <Typography variant="caption" sx={{ mt: 1 }}>Notes (rich text — formatting toolbar in full build)</Typography>
            <TextField label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} fullWidth multiline rows={5}
              placeholder="Background, motivations, talking points… Supports bold, italic, links in the full rich text editor." />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add Person'}</Button>
      </DialogActions>
    </Dialog>
  );
}
