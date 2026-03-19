import React, { useMemo } from 'react';
import {
  Drawer, Box, Typography, IconButton, Chip, Divider, LinearProgress,
  Button, Tooltip, List, ListItemButton, ListItemIcon, ListItemText, alpha,
} from '@mui/material';
import {
  Close, LinkedIn, Email, Phone, Language, Edit, Delete, PersonAdd, GroupAdd, Business,
} from '@mui/icons-material';
import useStore from '../../store/useStore';
import { palette } from '../../theme/theme';

const STATURE = ['Participant', 'Influencer', 'Decider'];
const STATURE_COLORS = [palette.stone, palette.influencer, palette.navy];
const ROLE_COLORS = { ally: palette.ally, champion: palette.champion, neutral: palette.neutral, opponent: palette.opponent, target: palette.target };
const TIER_COLORS = { primary: palette.primary, secondary: palette.secondary, informal: palette.informal };
const TIER_LABELS = { primary: 'Primary', secondary: 'Secondary', informal: 'Informal' };

export default function InspectorSidebar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const selectedNodeType = useStore((s) => s.selectedNodeType);
  const deselectNode = useStore((s) => s.deselectNode);
  const entity = useStore((s) => s.getSelectedEntity());
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const getNodeConnections = useStore((s) => s.getNodeConnections);
  const getOrgMembers = useStore((s) => s.getOrgMembers);
  const selectNode = useStore((s) => s.selectNode);
  const openAddConnectionModal = useStore((s) => s.openAddConnectionModal);
  const openAddMembershipModal = useStore((s) => s.openAddMembershipModal);
  const deletePerson = useStore((s) => s.deletePerson);
  const deleteOrg = useStore((s) => s.deleteOrg);
  const persons = useStore((s) => s.persons);

  const connections = useMemo(() => selectedNodeId ? getNodeConnections(selectedNodeId) : [], [selectedNodeId]);
  const orgMembers = useMemo(() => (selectedNodeType === 'organization' && selectedNodeId) ? getOrgMembers(selectedNodeId) : null, [selectedNodeId, selectedNodeType]);

  if (!entity) return null;

  const isPerson = selectedNodeType === 'person';
  const influence = entity.influence_score || 50;
  const stature = isPerson ? (entity.stature ?? 0) : Math.min(2, Math.floor(influence / 40));
  const statureColor = STATURE_COLORS[stature];
  const role = entity.role_category || 'neutral';
  const roleColor = ROLE_COLORS[role] || palette.stone;
  const chaperone = isPerson && entity.chaperone_id ? persons.find((p) => p.id === entity.chaperone_id) : null;

  // Group connections by tier
  const connByTier = { primary: [], secondary: [], informal: [] };
  connections.forEach((c) => { (connByTier[c.connection.tier] || connByTier.primary).push(c); });

  return (
    <Drawer anchor="right" open={sidebarOpen} onClose={deselectNode} variant="persistent"
      sx={{ '& .MuiDrawer-paper': { width: 360, p: 0, boxShadow: 5 } }}>

      {/* ── Header ── */}
      <Box sx={{ p: 2.5, pb: 2, background: `linear-gradient(135deg, ${alpha(isPerson ? roleColor : palette.teal, 0.08)} 0%, transparent 100%)`, borderBottom: `1px solid ${alpha(palette.ink, 0.06)}`, position: 'relative' }}>
        <IconButton onClick={deselectNode} size="small" sx={{ position: 'absolute', top: 12, right: 12 }}><Close fontSize="small" /></IconButton>

        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Chip label={isPerson ? 'Person' : 'Organization'} size="small" icon={isPerson ? undefined : <Business sx={{ fontSize: 14 }} />}
            sx={{ bgcolor: alpha(isPerson ? roleColor : palette.teal, 0.12), color: isPerson ? roleColor : palette.teal }} />
          {isPerson && <Chip label={role.charAt(0).toUpperCase() + role.slice(1)} size="small"
            sx={{ bgcolor: alpha(roleColor, 0.15), color: roleColor }} />}
        </Box>

        <Typography variant="h3" sx={{ pr: 4, mb: 0.5 }}>{entity.name}</Typography>

        {isPerson && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{entity.primary_role}</Typography>
            {entity.primary_org_name && <Typography variant="body2" sx={{ color: palette.teal, fontWeight: 600 }}>{entity.primary_org_name}</Typography>}
            {entity.secondary_role && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontSize: '0.75rem' }}>
                Also: {entity.secondary_role}{entity.secondary_org_name ? ` at ${entity.secondary_org_name}` : ''}
              </Typography>
            )}
          </>
        )}

        {!isPerson && entity.org_type && (
          <Chip label={entity.org_type} size="small" variant="outlined" sx={{ mt: 0.5 }} />
        )}

        {/* Quick links */}
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
          {entity.linkedin_url && <Tooltip title="LinkedIn"><IconButton size="small" onClick={() => window.open(entity.linkedin_url, '_blank')} sx={{ bgcolor: alpha(palette.navy, 0.08) }}><LinkedIn fontSize="small" sx={{ color: palette.navy }} /></IconButton></Tooltip>}
          {entity.email && <Tooltip title={entity.email}><IconButton size="small" onClick={() => window.open(`mailto:${entity.email}`)} sx={{ bgcolor: alpha(palette.teal, 0.08) }}><Email fontSize="small" sx={{ color: palette.teal }} /></IconButton></Tooltip>}
          {entity.phone && <Tooltip title={entity.phone}><IconButton size="small" sx={{ bgcolor: alpha(palette.stone, 0.12) }}><Phone fontSize="small" sx={{ color: palette.slate }} /></IconButton></Tooltip>}
          {entity.website_url && <Tooltip title="Website"><IconButton size="small" onClick={() => window.open(entity.website_url, '_blank')} sx={{ bgcolor: alpha(palette.stone, 0.12) }}><Language fontSize="small" sx={{ color: palette.slate }} /></IconButton></Tooltip>}
        </Box>
      </Box>

      <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
        {/* ── Influence & Stature ── */}
        <Typography variant="caption">Influence Score</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <LinearProgress variant="determinate" value={influence} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(palette.ink, 0.06), '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: statureColor } }} />
          <Typography variant="body1" sx={{ fontWeight: 700, minWidth: 32, textAlign: 'right' }}>{influence}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption">Stature</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: statureColor, border: stature > 0 ? `1.5px solid ${palette.ink}` : 'none', boxShadow: stature > 1 ? `0 0 0 2px ${palette.influencer}` : 'none' }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{STATURE[stature]}</Typography>
            </Box>
          </Box>
          {isPerson && chaperone && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption">Chaperone</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, cursor: 'pointer', color: palette.teal, '&:hover': { textDecoration: 'underline' } }}
                onClick={() => selectNode(chaperone.id, 'person')}>{chaperone.name}</Typography>
            </Box>
          )}
        </Box>

        {/* ── Notes ── */}
        {entity.notes && (
          <>
            <Typography variant="caption">Notes</Typography>
            <Box sx={{ mt: 0.5, mb: 2, p: 1.5, bgcolor: alpha(palette.ink, 0.03), borderRadius: 2, fontSize: '0.78rem', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: entity.notes }} />
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* ── Org Members (if organization) ── */}
        {!isPerson && orgMembers && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h4" sx={{ color: palette.navy }}>Members</Typography>
              <Tooltip title="Add member"><IconButton size="small" onClick={() => openAddMembershipModal(selectedNodeId)}><GroupAdd fontSize="small" /></IconButton></Tooltip>
            </Box>
            {['board', 'executive', 'staff'].map((seat) => {
              const members = orgMembers[seat] || [];
              if (members.length === 0) return null;
              return (
                <Box key={seat} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: seat === 'board' ? palette.navy : seat === 'executive' ? palette.teal : palette.stone }}>
                    {seat.charAt(0).toUpperCase() + seat.slice(1)} ({members.length})
                  </Typography>
                  {members.map((m) => (
                    <Box key={m.membership_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, cursor: 'pointer', '&:hover': { color: palette.teal } }}
                      onClick={() => selectNode(m.person_id, 'person')}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{m.person_name}</Typography>
                      {m.title && <Typography variant="body2" sx={{ fontSize: '0.7rem', color: palette.stone }}>— {m.title}</Typography>}
                    </Box>
                  ))}
                </Box>
              );
            })}
            <Divider sx={{ my: 1.5 }} />
          </>
        )}

        {/* ── Connections by Tier ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" sx={{ color: palette.teal }}>Connections ({connections.length})</Typography>
          <Tooltip title="Add connection"><IconButton size="small" onClick={() => openAddConnectionModal(selectedNodeId, selectedNodeType)}><PersonAdd fontSize="small" /></IconButton></Tooltip>
        </Box>

        {['primary', 'secondary', 'informal'].map((tier) => {
          const group = connByTier[tier];
          if (group.length === 0) return null;
          const tColor = TIER_COLORS[tier];
          return (
            <Box key={tier} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 20, height: 0, borderTop: `2px ${tier === 'primary' ? 'solid' : tier === 'secondary' ? 'dashed' : 'dotted'} ${tColor}` }} />
                <Typography variant="caption" sx={{ color: tColor }}>{TIER_LABELS[tier]} ({group.length})</Typography>
              </Box>
              <List dense disablePadding>
                {group.map(({ connection: conn, entity: other }) => (
                  <ListItemButton key={conn.id} onClick={() => selectNode(other.id, other._type)}
                    sx={{ borderRadius: 2, py: 0.6, '&:hover': { bgcolor: alpha(tColor, 0.06) } }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tColor }} />
                    </ListItemIcon>
                    <ListItemText primary={other.name}
                      secondary={conn.label || conn.relationship_type}
                      primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: '0.66rem' }} />
                    <Chip label={other._type === 'person' ? '👤' : '🏢'} size="small"
                      sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(palette.ink, 0.04) }} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          );
        })}

        {connections.length === 0 && <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: 'text.disabled' }}>No connections yet.</Typography>}

        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<Edit />} fullWidth>Edit</Button>
          <Button variant="outlined" size="small" color="error" startIcon={<Delete />}
            onClick={() => {
              if (window.confirm(`Delete ${entity.name}?`)) {
                isPerson ? deletePerson(entity.id) : deleteOrg(entity.id);
              }
            }}>Delete</Button>
        </Box>
      </Box>
    </Drawer>
  );
}
