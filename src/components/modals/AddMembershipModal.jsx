import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, TextField,
  Select, MenuItem, FormControl, InputLabel, Typography, Button,
  Autocomplete, Chip, Alert, alpha,
} from '@mui/material';
import useStore from '../../store/useStore';
import { palette } from '../../theme/theme';

const SEAT_TYPES = [
  { value: 'board', label: 'Board Member', color: palette.navy },
  { value: 'executive', label: 'Executive', color: palette.teal },
  { value: 'staff', label: 'Staff', color: palette.stone },
];

const BLANK = { person_id: null, org_id: null, seat_type: 'staff', title: '' };

export default function AddMembershipModal() {
  const open = useStore((s) => s.addMembershipModalOpen);
  const prefilledOrgId = useStore((s) => s.membershipModalOrgId);
  const close = useStore((s) => s.closeAddMembershipModal);
  const createMembership = useStore((s) => s.createMembership);
  const persons = useStore((s) => s.persons);
  const organizations = useStore((s) => s.organizations);

  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);
  const handleClose = () => { setForm({ ...BLANK }); setError(null); close(); };

  const orgId = form.org_id || prefilledOrgId;
  const personOptions = useMemo(() => persons.map((p) => ({ id: p.id, label: p.name })), [persons]);
  const orgOptions = useMemo(() => organizations.map((o) => ({ id: o.id, label: o.name })), [organizations]);

  const handleSave = async () => {
    if (!form.person_id || !orgId) { setError('Select both a person and an organization.'); return; }
    setSaving(true); setError(null);
    try {
      await createMembership({ person_id: form.person_id, org_id: orgId, seat_type: form.seat_type, title: form.title });
      handleClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle><Typography variant="h2" sx={{ fontSize: '1rem' }}>Add Member to Organization</Typography></DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Autocomplete options={orgOptions}
            value={orgOptions.find((o) => o.id === orgId) || null}
            onChange={(_, v) => set('org_id', v?.id || null)}
            getOptionLabel={(o) => o.label} isOptionEqualToValue={(o, v) => o.id === v.id}
            disabled={!!prefilledOrgId}
            renderInput={(p) => <TextField {...p} label="Organization" required />} />

          <Autocomplete options={personOptions}
            value={personOptions.find((o) => o.id === form.person_id) || null}
            onChange={(_, v) => set('person_id', v?.id || null)}
            getOptionLabel={(o) => o.label} isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(p) => <TextField {...p} label="Person" required />} />

          <Box>
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Seat Type</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {SEAT_TYPES.map((s) => (
                <Chip key={s.value} label={s.label} clickable onClick={() => set('seat_type', s.value)}
                  sx={{
                    flex: 1, justifyContent: 'center',
                    bgcolor: form.seat_type === s.value ? alpha(s.color, 0.15) : alpha(palette.ink, 0.04),
                    color: form.seat_type === s.value ? s.color : palette.slate,
                    border: form.seat_type === s.value ? `1.5px solid ${s.color}` : '1.5px solid transparent',
                  }} />
              ))}
            </Box>
          </Box>

          <TextField label="Title (e.g. Chair, CFO, Program Director)" value={form.title} onChange={(e) => set('title', e.target.value)} fullWidth />

          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
            Adding a membership automatically creates a <strong>Primary</strong> connection between the person and the organization.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add Member'}</Button>
      </DialogActions>
    </Dialog>
  );
}
