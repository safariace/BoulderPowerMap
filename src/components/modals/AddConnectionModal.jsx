import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, TextField,
  Select, MenuItem, FormControl, InputLabel, Slider, Typography,
  Button, Autocomplete, Chip, Alert, alpha,
} from '@mui/material';
import useStore from '../../store/useStore';
import { palette } from '../../theme/theme';

const TIERS = [
  { value: 'primary',   label: 'Primary',   desc: 'Same org/committee, Spouse',       style: 'solid',  color: palette.primary },
  { value: 'secondary', label: 'Secondary', desc: 'Monthly affiliations, regular',    style: 'dashed', color: palette.secondary },
  { value: 'informal',  label: 'Informal',  desc: 'Annual interactions, known to',    style: 'dotted', color: palette.informal },
];

const PERSON_REL_TYPES = {
  primary:   ['Same committee', 'Spouse', 'Same organization', 'Co-board member', 'Boss/Employee'],
  secondary: ['Monthly meetings', 'Regular collaborator', 'Coalition partner', 'Frequent contact'],
  informal:  ['Known to each other', 'Annual event', 'Mutual acquaintance', 'Past colleague'],
};

const ORG_REL_TYPES = {
  primary:   ['Board', 'Executive', 'Staff', 'Parent/subsidiary'],
  secondary: ['Works with regularly', 'Funding relationship', 'Joint program'],
  informal:  ['Affiliated with', 'Works with infrequently', 'In same sector'],
};

const DIRECTIONS = [
  { value: 'bidirectional', label: 'Both ways ↔' },
  { value: 'source_to_target', label: 'Source → Target' },
  { value: 'target_to_source', label: 'Target → Source' },
];

const BLANK = {
  source_id: null, source_type: null,
  target_id: null, target_type: null,
  tier: 'primary', relationship_type: '', label: '',
  strength: 50, direction: 'bidirectional', notes: '',
};

export default function AddConnectionModal() {
  const open = useStore((s) => s.addConnectionModalOpen);
  const prefilledSourceId = useStore((s) => s.connectionModalSourceId);
  const prefilledSourceType = useStore((s) => s.connectionModalSourceType);
  const close = useStore((s) => s.closeAddConnectionModal);
  const createConnection = useStore((s) => s.createConnection);
  const persons = useStore((s) => s.persons);
  const organizations = useStore((s) => s.organizations);

  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);
  const handleClose = () => { setForm({ ...BLANK }); setError(null); close(); };

  // Build unified node options
  const allOptions = useMemo(() => [
    ...persons.map((p) => ({ id: p.id, type: 'person', label: `👤 ${p.name}`, subtitle: p.primary_role })),
    ...organizations.map((o) => ({ id: o.id, type: 'organization', label: `🏢 ${o.name}`, subtitle: o.org_type })),
  ], [persons, organizations]);

  const sourceId = form.source_id || prefilledSourceId;
  const sourceType = form.source_type || prefilledSourceType;
  const sourceOption = allOptions.find((o) => o.id === sourceId) || null;

  // Determine which relationship types to show
  const targetType = form.target_type;
  const relTypes = (targetType === 'organization' || sourceType === 'organization')
    ? ORG_REL_TYPES[form.tier] || []
    : PERSON_REL_TYPES[form.tier] || [];

  const handleSave = async () => {
    if (!sourceId || !form.target_id) { setError('Select both source and target.'); return; }
    if (sourceId === form.target_id) { setError('Source and target must be different.'); return; }
    setSaving(true); setError(null);
    try {
      const data = {
        tier: form.tier,
        relationship_type: form.relationship_type || form.tier,
        label: form.label,
        strength: form.strength,
        direction: form.direction,
        notes: form.notes,
      };
      // Set polymorphic source/target
      if (sourceType === 'person') data.source_person_id = sourceId;
      else data.source_org_id = sourceId;
      if (form.target_type === 'person') data.target_person_id = form.target_id;
      else data.target_org_id = form.target_id;

      await createConnection(data);
      handleClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const tierInfo = TIERS.find((t) => t.value === form.tier);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle><Typography variant="h2" sx={{ fontSize: '1rem' }}>Add Connection</Typography></DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          <Autocomplete options={allOptions}
            value={sourceOption}
            onChange={(_, v) => { set('source_id', v?.id || null); set('source_type', v?.type || null); }}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            disabled={!!prefilledSourceId}
            renderInput={(p) => <TextField {...p} label="Source (From)" required />} />

          <Autocomplete options={allOptions.filter((o) => o.id !== sourceId)}
            value={allOptions.find((o) => o.id === form.target_id) || null}
            onChange={(_, v) => { set('target_id', v?.id || null); set('target_type', v?.type || null); }}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(p) => <TextField {...p} label="Target (To)" required autoFocus={!!prefilledSourceId} />} />

          {/* Tier selector */}
          <Box>
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Connection Tier</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {TIERS.map((t) => (
                <Chip key={t.value} label={t.label} clickable onClick={() => set('tier', t.value)}
                  sx={{
                    flex: 1, justifyContent: 'center',
                    bgcolor: form.tier === t.value ? alpha(t.color, 0.15) : alpha(palette.ink, 0.04),
                    color: form.tier === t.value ? t.color : palette.slate,
                    border: form.tier === t.value ? `1.5px solid ${t.color}` : '1.5px solid transparent',
                    fontWeight: form.tier === t.value ? 700 : 400,
                  }} />
              ))}
            </Box>
            {tierInfo && (
              <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: alpha(tierInfo.color, 0.04), border: `1px solid ${alpha(tierInfo.color, 0.12)}`, textAlign: 'center' }}>
                <Box sx={{ width: '50%', mx: 'auto', height: 0, borderTop: `3px ${tierInfo.style} ${tierInfo.color}`, mb: 1 }} />
                <Typography variant="body2" sx={{ fontSize: '0.72rem', color: tierInfo.color }}>{tierInfo.desc}</Typography>
              </Box>
            )}
          </Box>

          {/* Relationship type */}
          <FormControl fullWidth>
            <InputLabel>Relationship Type</InputLabel>
            <Select value={form.relationship_type} label="Relationship Type" onChange={(e) => set('relationship_type', e.target.value)}>
              <MenuItem value="">— Select —</MenuItem>
              {relTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField label="Label" value={form.label} onChange={(e) => set('label', e.target.value)} fullWidth placeholder="e.g. Housing Committee" />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">Strength</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{form.strength}/100</Typography>
            </Box>
            <Slider value={form.strength} onChange={(_, v) => set('strength', v)} min={0} max={100} step={5} size="small"
              sx={{ color: tierInfo?.color || palette.navy }} />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Direction</InputLabel>
            <Select value={form.direction} label="Direction" onChange={(e) => set('direction', e.target.value)}>
              {DIRECTIONS.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} fullWidth multiline rows={2} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Create Connection'}</Button>
      </DialogActions>
    </Dialog>
  );
}
