/**
 * PowerMapCanvas v2
 * =================
 * PixiJS + D3-force renderer updated for:
 *   - Persons AND Organizations as nodes
 *   - Polymorphic connections with 3 tiers (solid/dashed/dotted)
 *   - Org nodes rendered as building icons
 *   - Click-to-select with GSAP camera pan
 */

import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, alpha } from '@mui/material';
import useStore from '../../store/useStore';
import { inferStature } from '../../store/useStore';
import { palette } from '../../theme/theme';

const STATURE_LABEL = ['Participant', 'Influencer', 'Decider'];
const ROLE_COLOR = { ally: palette.ally, champion: palette.champion, neutral: palette.neutral, target: palette.target, opponent: palette.opponent };

export default function PowerMapCanvas() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState(null); // { x, y, entity }

  const persons = useStore((s) => s.persons);
  const organizations = useStore((s) => s.organizations);
  const connections = useStore((s) => s.connections);
  const filters = useStore((s) => s.filters);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const hoveredNodeId = useStore((s) => s.hoveredNodeId);
  const selectNode = useStore((s) => s.selectNode);
  const hoverNode = useStore((s) => s.hoverNode);
  const getAllNodes = useStore((s) => s.getAllNodes);
  const getFilteredConnections = useStore((s) => s.getFilteredConnections);
  const settings = useStore((s) => s.settings);

  // Track mouse position for tooltip placement
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      mousePosRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  // Update tooltip when hovered node changes
  useEffect(() => {
    if (!hoveredNodeId) { setTooltip(null); return; }
    const entity =
      persons.find((p) => p.id === hoveredNodeId) ||
      organizations.find((o) => o.id === hoveredNodeId);
    if (entity) {
      setTooltip({ x: mousePosRef.current.x, y: mousePosRef.current.y, entity });
    }
  }, [hoveredNodeId, persons, organizations]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const PIXI = window.PIXI, d3 = window.d3, gsap = window.gsap;
    if (!PIXI || !d3 || !gsap) { console.error('[RPM] Missing PIXI/d3/gsap'); return; }

    const app = new PIXI.Application({ width: el.clientWidth, height: el.clientHeight, backgroundColor: 0xf0ede6, antialias: true, resolution: devicePixelRatio || 1, autoDensity: true });
    el.appendChild(app.view);
    const world = new PIXI.Container(); world.sortableChildren = true; app.stage.addChild(world);
    const layers = { shadows: new PIXI.Container(), edges: new PIXI.Container(), nodes: new PIXI.Container(), labels: new PIXI.Container() };
    layers.shadows.zIndex = 0; layers.edges.zIndex = 1; layers.nodes.zIndex = 2; layers.nodes.sortableChildren = true; layers.labels.zIndex = 3;
    Object.values(layers).forEach((l) => world.addChild(l));

    const camera = { x: el.clientWidth / 2, y: el.clientHeight / 2, zoom: 1 };
    const updateCamera = () => { world.x = camera.x; world.y = camera.y; world.scale.set(camera.zoom); };
    updateCamera();

    engineRef.current = { app, world, layers, camera, updateCamera, nodeSprites: new Map(), destroy: () => app.destroy(true, { children: true }) };

    let hoveredId = null;
    // Pan
    let dragging = false, ds = { x: 0, y: 0 }, cs = { x: 0, y: 0 };
    app.view.addEventListener('pointerdown', (e) => { if (hoveredId) return; dragging = true; ds = { x: e.clientX, y: e.clientY }; cs = { x: camera.x, y: camera.y }; app.view.style.cursor = 'grabbing'; });
    window.addEventListener('pointermove', (e) => { if (!dragging) return; camera.x = cs.x + e.clientX - ds.x; camera.y = cs.y + e.clientY - ds.y; updateCamera(); });
    window.addEventListener('pointerup', () => { dragging = false; if (app.view) app.view.style.cursor = 'default'; });
    // Zoom
    app.view.addEventListener('wheel', (e) => { e.preventDefault(); const f = e.deltaY > 0 ? 0.92 : 1.08; const nz = Math.max(0.25, Math.min(3, camera.zoom * f)); const r = app.view.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top; const wx = (mx - camera.x) / camera.zoom, wy = (my - camera.y) / camera.zoom; camera.zoom = nz; camera.x = mx - wx * nz; camera.y = my - wy * nz; updateCamera(); }, { passive: false });
    // Deselect
    app.stage.eventMode = 'static'; app.stage.hitArea = app.screen;
    app.stage.on('pointerdown', () => { if (!hoveredId) selectNode(null, null); });

    engineRef.current.setHovered = (id) => { hoveredId = id; hoverNode(id); };
    const onResize = () => app.renderer?.resize(el.clientWidth, el.clientHeight);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); engineRef.current?.destroy(); engineRef.current = null; };
  }, []);

  // ── Re-render graph on data changes ──
  useEffect(() => {
    const E = engineRef.current;
    if (!E) return;
    const PIXI = window.PIXI, d3 = window.d3, gsap = window.gsap;
    if (!PIXI || !d3 || !gsap) return;
    const { layers, camera, updateCamera, app } = E;
    Object.values(layers).forEach((l) => l.removeChildren());
    E.nodeSprites.clear();

    const allNodes = getAllNodes();
    const filtConns = getFilteredConnections();
    if (allNodes.length === 0) return;

    const ISO = Math.PI / 6, ISO_SY = 0.55;
    const toIso = (x, y) => ({ x: (x - y) * Math.cos(ISO), y: (x + y) * Math.sin(ISO) * ISO_SY });

    const SKIN = [0xf5d0b0, 0xe8b88a, 0xd4956b, 0xb07050, 0x8b5e3c, 0x6b4226];
    const HAIR = [0x2c1b0e, 0x4a3222, 0x8b6943, 0xc48c5a, 0xe06c5d, 0x1a1a2e];
    const SHIRT = { ally: 0x5b9bd5, neutral: 0x7a8b8a, target: 0xe06c5d, champion: 0x4ba69c, opponent: 0xd44040 };
    const TIER_COL = { primary: 0xe06c5d, secondary: 0x2c3e6b, informal: 0x4ba69c };
    const RING_COL = [0x3b82c4, 0x1e3a5f];
    const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); };

    const simNodes = allNodes.map((n) => ({ ...n, x: n.pos_x || (Math.random() - 0.5) * 500, y: n.pos_y || (Math.random() - 0.5) * 500 }));
    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks = filtConns.filter((c) => nodeMap.has(c.source_id) && nodeMap.has(c.target_id))
      .map((c) => ({ source: nodeMap.get(c.source_id), target: nodeMap.get(c.target_id), tier: c.tier, label: c.label }));

    // Build sprites
    simNodes.forEach((sn) => {
      const inf = sn.influence_score || 50;
      const r = 18 + (inf / 100) * 14;
      const isOrg = sn._type === 'organization';
      const st = sn.stature || 0;
      const role = sn.role_category || 'neutral';
      const sc = r / 18;

      const c = new PIXI.Container(); c.sortableChildren = true; c.eventMode = 'static'; c.cursor = 'pointer';

      // Shadow
      const sh = new PIXI.Graphics(); sh.beginFill(0x000000, 0.1); sh.drawEllipse(0, 8, r + 8, (r + 8) * 0.4); sh.endFill();
      layers.shadows.addChild(sh);

      // Rings
      const rings = new PIXI.Graphics();
      for (let i = 0; i < st; i++) { const rr = r + 5 * (i + 1) + 2.5 * i; rings.lineStyle(2.5, RING_COL[i % 2], 0.85); rings.drawEllipse(0, 4, rr, rr * 0.4); rings.lineStyle(0); }
      rings.zIndex = 0; c.addChild(rings);

      // Platform
      const pl = new PIXI.Graphics(); pl.beginFill(0xdfe4ea, 0.9); pl.drawEllipse(0, 4, r * 0.85, r * 0.35); pl.endFill(); pl.zIndex = 1; c.addChild(pl);

      // Body
      const b = new PIXI.Graphics(); b.zIndex = 2;
      if (isOrg) {
        const bw = 22 * sc, bh = 36 * sc;
        b.beginFill(SHIRT[role] || 0x7a8b8a); b.drawRoundedRect(-bw / 2, -bh - 2, bw, bh, 4); b.endFill();
        b.beginFill(0xffffff, 0.4);
        for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) b.drawRect(-6 * sc + col * 9 * sc, -bh + 5 + row * 10 * sc, 4 * sc, 5 * sc);
        b.endFill();
        // Door
        b.beginFill(0xffffff, 0.3); b.drawRect(-3 * sc, -6, 6 * sc, 6); b.endFill();
      } else {
        const skin = SKIN[hash(sn.name) % 6], hair = HAIR[hash(sn.name + 'h') % 6], shirt = SHIRT[role] || 0x7a8b8a;
        const bW = 12 * sc, bH = 22 * sc, sW = 14 * sc;
        b.beginFill(shirt); b.moveTo(-bW, 0); b.lineTo(-sW, -bH); b.quadraticCurveTo(-sW, -bH - 4 * sc, -10 * sc, -bH - 4 * sc); b.lineTo(10 * sc, -bH - 4 * sc); b.quadraticCurveTo(sW, -bH - 4 * sc, sW, -bH); b.lineTo(bW, 0); b.closePath(); b.endFill();
        const hR = 8 * sc, hY = -bH - 4 * sc - hR;
        b.beginFill(skin); b.drawCircle(0, hY, hR); b.endFill();
        const hs = ['short', 'medium', 'long'][hash(sn.name + 's') % 3];
        b.beginFill(hair);
        if (hs === 'long') { b.arc(0, hY, hR + 1, -Math.PI, 0); b.lineTo(hR + 2, hY + hR * 0.8); b.quadraticCurveTo(hR + 3, hY + hR * 1.6, hR * 0.4, hY + hR * 1.8); b.lineTo(-hR * 0.4, hY + hR * 1.8); b.quadraticCurveTo(-hR - 3, hY + hR * 1.6, -hR - 2, hY + hR * 0.8); b.closePath(); }
        else if (hs === 'medium') { b.arc(0, hY, hR + 1, -Math.PI * 0.85, -Math.PI * 0.15); b.lineTo(hR * 0.7, hY + hR * 0.5); b.lineTo(-hR * 0.7, hY + hR * 0.5); b.closePath(); }
        else { b.arc(0, hY - 1, hR + 0.5, -Math.PI * 0.8, -Math.PI * 0.2); b.closePath(); }
        b.endFill();
        b.beginFill(0x2c2c2c); b.drawCircle(-3 * sc, hY - 1, 1.2 * sc); b.drawCircle(3 * sc, hY - 1, 1.2 * sc); b.endFill();
      }
      c.addChild(b);

      // Label
      const nm = settings.labelDisplayMode === 'full_name' ? sn.name : settings.labelDisplayMode === 'initials' ? sn.name.split(' ').map((w) => w[0]).join('') : sn.name.split(' ')[0];
      const lbl = new PIXI.Text(nm, { fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: '600', fill: 0x2c2c2c, align: 'center' });
      lbl.anchor.set(0.5, 0); layers.labels.addChild(lbl);

      // Selection ring
      const sel = new PIXI.Graphics(); sel.visible = false; sel.zIndex = -1; c.addChild(sel);

      layers.nodes.addChild(c);
      c.on('pointerdown', (ev) => { ev.stopPropagation(); selectNode(sn.id, sn._type); const iso = toIso(sn.x, sn.y); gsap.to(camera, { x: app.screen.width / 2 - iso.x * camera.zoom, y: app.screen.height / 2 - iso.y * camera.zoom, duration: 0.7, ease: 'power3.inOut', onUpdate: updateCamera }); });
      c.on('pointerover', () => E.setHovered(sn.id));
      c.on('pointerout', () => E.setHovered(null));

      E.nodeSprites.set(sn.id, { container: c, shadow: sh, label: lbl, selRing: sel, simNode: sn, radius: r, stature: st });
    });

    // Draw edges
    const drawEdges = () => {
      layers.edges.removeChildren();
      for (const link of simLinks) {
        const ss = E.nodeSprites.get(link.source.id), ts = E.nodeSprites.get(link.target.id);
        if (!ss || !ts) continue;
        const si = toIso(link.source.x, link.source.y), ti = toIso(link.target.x, link.target.y);
        const g = new PIXI.Graphics(), col = TIER_COL[link.tier] || 0x999999, a = 0.6;
        const dx = ti.x - si.x, dy = ti.y - si.y, dist = Math.hypot(dx, dy), nx = dx / dist, ny = dy / dist;

        if (link.tier === 'secondary') { // dashed
          let d = 0, on = true; g.lineStyle(2, col, a); g.moveTo(si.x, si.y);
          while (d < dist) { const s = on ? 10 : 6; const e = Math.min(d + s, dist); if (on) g.lineTo(si.x + nx * e, si.y + ny * e); else g.moveTo(si.x + nx * e, si.y + ny * e); d = e; on = !on; }
        } else if (link.tier === 'informal') { // dotted
          g.lineStyle(0); g.beginFill(col, a); const cnt = Math.floor(dist / 6);
          for (let i = 0; i <= cnt; i++) { const t = i / cnt; g.drawCircle(si.x + dx * t, si.y + dy * t, 2); } g.endFill();
        } else { g.lineStyle(2, col, a); g.moveTo(si.x, si.y); g.lineTo(ti.x, ti.y); }

        g.lineStyle(0); g.beginFill(col, 0.85); g.drawCircle((si.x + ti.x) / 2, (si.y + ti.y) / 2, 3.5); g.endFill();
        if (selectedNodeId) { const conn = link.source.id === selectedNodeId || link.target.id === selectedNodeId; g.alpha = conn ? 1 : 0.1; }
        layers.edges.addChild(g);
      }
    };

    // Simulation
    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d) => d.id).distance(150).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(0, 0).strength(0.03))
      .force('collision', d3.forceCollide().radius((d) => 18 + ((d.influence_score || 50) / 100) * 14 + 22).strength(0.8))
      .alphaDecay(0.02)
      .on('tick', () => {
        E.nodeSprites.forEach((sp) => {
          const iso = toIso(sp.simNode.x, sp.simNode.y);
          sp.container.x = iso.x; sp.container.y = iso.y; sp.shadow.x = iso.x; sp.shadow.y = iso.y;
          sp.label.x = iso.x; sp.label.y = iso.y - 60; sp.container.zIndex = Math.round(iso.y + 10000);
        });
        drawEdges();
      });

    let tick = 0;
    const renderTick = (dt) => {
      tick += dt;
      E.nodeSprites.forEach((sp, id) => {
        if (selectedNodeId) {
          const isSel = id === selectedNodeId;
          const isConn = simLinks.some((l) => (l.source.id === selectedNodeId && l.target.id === id) || (l.target.id === selectedNodeId && l.source.id === id));
          const ta = (isSel || isConn) ? 1 : 0.18;
          sp.container.alpha += (ta - sp.container.alpha) * 0.1; sp.label.alpha += (ta - sp.label.alpha) * 0.1;
          if (isSel) { sp.selRing.visible = true; sp.selRing.clear(); sp.selRing.lineStyle(3, 0xf0c040, 0.5 + 0.4 * Math.sin(tick * 0.05)); const or = sp.radius + (sp.stature + 1) * 7.5 + 4; sp.selRing.drawEllipse(0, 4, or, or * 0.4); }
          else sp.selRing.visible = false;
        } else { sp.container.alpha += (1 - sp.container.alpha) * 0.1; sp.label.alpha += (1 - sp.label.alpha) * 0.1; sp.selRing.visible = false; }
      });
    };
    app.ticker.add(renderTick);
    return () => { sim.stop(); app.ticker.remove(renderTick); };
  }, [persons, organizations, connections, filters, selectedNodeId, settings.labelDisplayMode]);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative', '& canvas': { display: 'block' } }}>
      {tooltip && (() => {
        const e = tooltip.entity;
        const isPerson = e._type === 'person';
        const stature = inferStature(e.influence_score || 0);
        const roleColor = isPerson ? (ROLE_COLOR[e.role_category] || palette.neutral) : palette.navy;
        // Flip tooltip left if near right edge
        const flipX = tooltip.x > (containerRef.current?.clientWidth || 800) - 220;
        return (
          <Paper elevation={6} sx={{
            position: 'absolute',
            left: flipX ? 'auto' : tooltip.x + 14,
            right: flipX ? (containerRef.current?.clientWidth - tooltip.x + 14) : 'auto',
            top: tooltip.y - 10,
            zIndex: 20,
            p: 1.5,
            minWidth: 180,
            maxWidth: 240,
            pointerEvents: 'none',
            bgcolor: alpha(palette.ink, 0.93),
            color: palette.parchment,
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: `1px solid ${alpha(palette.parchment, 0.1)}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: roleColor, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: palette.parchment, lineHeight: 1.2 }}>
                {e.name}
              </Typography>
            </Box>
            {isPerson && e.primary_role && (
              <Typography variant="caption" sx={{ color: palette.stone, display: 'block', pl: '20px' }}>
                {e.primary_role}
              </Typography>
            )}
            {isPerson && e.primary_org_name && (
              <Typography variant="caption" sx={{ color: alpha(palette.parchment, 0.6), display: 'block', pl: '20px' }}>
                {e.primary_org_name}
              </Typography>
            )}
            {!isPerson && e.org_type && (
              <Typography variant="caption" sx={{ color: palette.stone, display: 'block', pl: '20px' }}>
                {e.org_type}{e.category ? ` · ${e.category}` : ''}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, pl: '20px' }}>
              <Typography variant="caption" sx={{ color: palette.teal, fontWeight: 600 }}>
                {e.influence_score ?? 50}
              </Typography>
              <Typography variant="caption" sx={{ color: palette.stone }}>
                influence · {STATURE_LABEL[stature]}
              </Typography>
            </Box>
          </Paper>
        );
      })()}
    </Box>
  );
}
