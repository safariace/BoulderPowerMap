import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, LinearProgress, Alert,
  Divider, Chip, Stack, List, ListItem, ListItemText,
} from '@mui/material';
import { Upload, Download, CheckCircle } from '@mui/icons-material';
import useStore from '../../store/useStore';
import { personsApi, orgsApi, membershipsApi, connectionsApi, campaignAssignApi } from '../../api/supabase';

// ── Template generation ────────────────────────────────────────────────────

function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  const peopleData = [
    ['name', 'primary_role', 'primary_org_name', 'secondary_role', 'secondary_org_name',
      'email', 'phone', 'linkedin_url', 'website_url',
      'influence_score', 'role_category', 'political_leaning', 'notes'],
    ['Jane Smith', 'Council Member', 'City Council', '', '',
      'jane@example.com', '555-1234', '', '',
      75, 'ally', 'progressive', ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(peopleData), 'People');

  const orgsData = [
    ['name', 'org_type', 'description', 'website_url', 'influence_score', 'notes'],
    ['City Council', 'government', 'Municipal governing body', '', 85, ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(orgsData), 'Organizations');

  const membershipsData = [
    ['person_name', 'org_name', 'seat_type', 'title'],
    ['Jane Smith', 'City Council', 'board', 'Chair'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(membershipsData), 'Memberships');

  const connectionsData = [
    ['source_name', 'source_type', 'target_name', 'target_type',
      'tier', 'relationship_type', 'label', 'strength', 'direction', 'notes'],
    ['Jane Smith', 'person', 'City Council', 'org',
      'primary', 'Board Member', 'Housing Committee', 80, 'bidirectional', ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(connectionsData), 'Connections');

  // Column notes sheet
  const notesData = [
    ['Sheet', 'Column', 'Required', 'Valid Values / Notes'],
    ['People', 'name', 'YES', 'Full name of the person'],
    ['People', 'influence_score', 'no', '0–100 integer'],
    ['People', 'role_category', 'no', 'ally | champion | neutral | target | opponent'],
    ['People', 'political_leaning', 'no', 'progressive | moderate | conservative | unknown'],
    ['Organizations', 'name', 'YES', 'Unique org name'],
    ['Organizations', 'org_type', 'no', 'government | nonprofit | corporate | community | political | other'],
    ['Organizations', 'influence_score', 'no', '0–100 integer'],
    ['Memberships', 'person_name', 'YES', 'Must match a name in the People sheet or existing person'],
    ['Memberships', 'org_name', 'YES', 'Must match a name in the Organizations sheet or existing org'],
    ['Memberships', 'seat_type', 'YES', 'board | executive | staff'],
    ['Connections', 'source_name', 'YES', 'Name of source person or org'],
    ['Connections', 'source_type', 'YES', 'person | org'],
    ['Connections', 'target_name', 'YES', 'Name of target person or org'],
    ['Connections', 'target_type', 'YES', 'person | org'],
    ['Connections', 'tier', 'YES', 'primary | secondary | informal'],
    ['Connections', 'strength', 'no', '0–100 integer'],
    ['Connections', 'direction', 'no', 'bidirectional | source_to_target | target_to_source'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(notesData), 'Column Guide');

  XLSX.writeFile(wb, 'rpm-import-template.xlsx');
}

// ── Sheet parser ───────────────────────────────────────────────────────────

function parseSheet(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ── Import pipeline ────────────────────────────────────────────────────────

async function runImport(parsed, campaignId, onProgress) {
  const { people, orgs, memberships, connections } = parsed;
  const log = [];
  const nameToPersonId = {};
  const nameToOrgId = {};

  // 1. Orgs
  onProgress('Creating organizations…', 0);
  for (let i = 0; i < orgs.length; i++) {
    const row = orgs[i];
    if (!row.name) { log.push({ type: 'warn', msg: `Orgs row ${i + 2}: missing name, skipped` }); continue; }
    try {
      const created = await orgsApi.create({
        name: String(row.name).trim(),
        org_type: row.org_type || 'other',
        description: row.description || null,
        website_url: row.website_url || null,
        influence_score: Number(row.influence_score) || 50,
        notes: row.notes || null,
      });
      nameToOrgId[String(row.name).trim().toLowerCase()] = created.id;
      if (campaignId) await campaignAssignApi.addOrg(campaignId, created.id);
      log.push({ type: 'ok', msg: `Created org: ${row.name}` });
    } catch (e) {
      log.push({ type: 'error', msg: `Org "${row.name}": ${e.message}` });
    }
    onProgress('Creating organizations…', Math.round(((i + 1) / orgs.length) * 25));
  }

  // 2. People
  onProgress('Creating people…', 25);
  for (let i = 0; i < people.length; i++) {
    const row = people[i];
    if (!row.name) { log.push({ type: 'warn', msg: `People row ${i + 2}: missing name, skipped` }); continue; }
    try {
      const created = await personsApi.create({
        name: String(row.name).trim(),
        primary_role: row.primary_role || null,
        primary_org_name: row.primary_org_name || null,
        secondary_role: row.secondary_role || null,
        secondary_org_name: row.secondary_org_name || null,
        email: row.email || null,
        phone: row.phone || null,
        linkedin_url: row.linkedin_url || null,
        website_url: row.website_url || null,
        influence_score: Number(row.influence_score) || 50,
        role_category: row.role_category || 'neutral',
        political_leaning: row.political_leaning || 'unknown',
        notes: row.notes || null,
      });
      nameToPersonId[String(row.name).trim().toLowerCase()] = created.id;
      if (campaignId) await campaignAssignApi.addPerson(campaignId, created.id);
      log.push({ type: 'ok', msg: `Created person: ${row.name}` });
    } catch (e) {
      log.push({ type: 'error', msg: `Person "${row.name}": ${e.message}` });
    }
    onProgress('Creating people…', 25 + Math.round(((i + 1) / people.length) * 25));
  }

  // 3. Memberships
  onProgress('Creating memberships…', 50);
  for (let i = 0; i < memberships.length; i++) {
    const row = memberships[i];
    const personId = nameToPersonId[String(row.person_name || '').trim().toLowerCase()];
    const orgId = nameToOrgId[String(row.org_name || '').trim().toLowerCase()];
    if (!personId || !orgId || !row.seat_type) {
      log.push({ type: 'warn', msg: `Membership row ${i + 2}: could not resolve person/org names or missing seat_type, skipped` });
      continue;
    }
    try {
      await membershipsApi.create({
        person_id: personId,
        org_id: orgId,
        seat_type: row.seat_type,
        title: row.title || null,
        is_active: true,
      });
      log.push({ type: 'ok', msg: `Membership: ${row.person_name} → ${row.org_name} (${row.seat_type})` });
    } catch (e) {
      log.push({ type: 'error', msg: `Membership row ${i + 2}: ${e.message}` });
    }
    onProgress('Creating memberships…', 50 + Math.round(((i + 1) / memberships.length) * 25));
  }

  // 4. Connections
  onProgress('Creating connections…', 75);
  for (let i = 0; i < connections.length; i++) {
    const row = connections[i];
    const srcName = String(row.source_name || '').trim().toLowerCase();
    const tgtName = String(row.target_name || '').trim().toLowerCase();
    const srcType = String(row.source_type || '').trim();
    const tgtType = String(row.target_type || '').trim();

    const sourcePersonId = srcType === 'person' ? nameToPersonId[srcName] : null;
    const sourceOrgId = srcType === 'org' ? nameToOrgId[srcName] : null;
    const targetPersonId = tgtType === 'person' ? nameToPersonId[tgtName] : null;
    const targetOrgId = tgtType === 'org' ? nameToOrgId[tgtName] : null;

    if ((!sourcePersonId && !sourceOrgId) || (!targetPersonId && !targetOrgId) || !row.tier) {
      log.push({ type: 'warn', msg: `Connection row ${i + 2}: could not resolve names or missing tier, skipped` });
      continue;
    }
    try {
      await connectionsApi.create({
        source_person_id: sourcePersonId,
        source_org_id: sourceOrgId,
        target_person_id: targetPersonId,
        target_org_id: targetOrgId,
        tier: row.tier,
        relationship_type: row.relationship_type || null,
        label: row.label || null,
        strength: Number(row.strength) || 50,
        direction: row.direction || 'bidirectional',
        notes: row.notes || null,
      });
      log.push({ type: 'ok', msg: `Connection: ${row.source_name} → ${row.target_name} (${row.tier})` });
    } catch (e) {
      log.push({ type: 'error', msg: `Connection row ${i + 2}: ${e.message}` });
    }
    onProgress('Creating connections…', 75 + Math.round(((i + 1) / connections.length) * 25));
  }

  onProgress('Done', 100);
  return log;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BatchImportModal() {
  const open = useStore((s) => s.batchImportModalOpen);
  const close = useStore((s) => s.closeBatchImportModal);
  const activeCampaignId = useStore((s) => s.activeCampaignId);
  const fetchGraph = useStore((s) => s.fetchGraph);

  const [phase, setPhase] = useState('idle'); // idle | preview | importing | done
  const [parsed, setParsed] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [log, setLog] = useState([]);
  const fileRef = useRef();

  function reset() {
    setPhase('idle');
    setParsed(null);
    setProgress(0);
    setProgressLabel('');
    setLog([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose() {
    reset();
    close();
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'array' });
      const people = parseSheet(wb, 'People');
      const orgs = parseSheet(wb, 'Organizations');
      const memberships = parseSheet(wb, 'Memberships');
      const connections = parseSheet(wb, 'Connections');
      setParsed({ people, orgs, memberships, connections });
      setPhase('preview');
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    setPhase('importing');
    setLog([]);
    const result = await runImport(parsed, activeCampaignId, (label, pct) => {
      setProgressLabel(label);
      setProgress(pct);
    });
    setLog(result);
    setPhase('done');
    if (activeCampaignId) fetchGraph(activeCampaignId);
  }

  const okCount = log.filter((l) => l.type === 'ok').length;
  const errCount = log.filter((l) => l.type === 'error').length;
  const warnCount = log.filter((l) => l.type === 'warn').length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Upload fontSize="small" />
        Batch Import
      </DialogTitle>

      <DialogContent dividers>
        {/* Template download — always visible */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Download the template, fill in your data across the four sheets (People, Organizations,
            Memberships, Connections), then upload the file below.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Download />}
            onClick={downloadTemplate}
          >
            Download Template (.xlsx)
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Idle: file picker */}
        {phase === 'idle' && (
          <Box>
            <Typography variant="body2" gutterBottom>Upload your completed spreadsheet:</Typography>
            <Button variant="contained" component="label" startIcon={<Upload />}>
              Choose File
              <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFile} />
            </Button>
          </Box>
        )}

        {/* Preview: show counts */}
        {phase === 'preview' && parsed && (
          <Box>
            <Typography variant="body2" gutterBottom>Ready to import into the active campaign:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip label={`${parsed.people.length} people`} color="primary" size="small" />
              <Chip label={`${parsed.orgs.length} organizations`} size="small" />
              <Chip label={`${parsed.memberships.length} memberships`} size="small" />
              <Chip label={`${parsed.connections.length} connections`} size="small" />
            </Stack>
            {!activeCampaignId && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                No campaign selected — records will be created but not assigned to a campaign.
              </Alert>
            )}
            <Alert severity="info" size="small">
              Names in Memberships and Connections must match names in the People / Organizations sheets exactly.
            </Alert>
          </Box>
        )}

        {/* Importing: progress */}
        {phase === 'importing' && (
          <Box>
            <Typography variant="body2" gutterBottom>{progressLabel}</Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption" color="text.secondary">{progress}%</Typography>
          </Box>
        )}

        {/* Done: summary + log */}
        {phase === 'done' && (
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip icon={<CheckCircle />} label={`${okCount} created`} color="success" size="small" />
              {warnCount > 0 && <Chip label={`${warnCount} skipped`} color="warning" size="small" />}
              {errCount > 0 && <Chip label={`${errCount} errors`} color="error" size="small" />}
            </Stack>
            <Box sx={{ maxHeight: 260, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <List dense disablePadding>
                {log.map((entry, i) => (
                  <ListItem key={i} sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={entry.msg}
                      primaryTypographyProps={{
                        variant: 'caption',
                        color: entry.type === 'ok' ? 'success.main' : entry.type === 'error' ? 'error.main' : 'warning.main',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {phase === 'done' || phase === 'idle' ? (
          <Button onClick={handleClose}>Close</Button>
        ) : (
          <Button onClick={reset} disabled={phase === 'importing'}>Back</Button>
        )}
        {phase === 'preview' && (
          <Button variant="contained" onClick={handleImport}>
            Import Now
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
