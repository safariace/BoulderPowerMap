/**
 * RPM v2 — Global Store (Zustand)
 * ================================
 * Manages: campaigns, persons, organizations, memberships,
 * connections, UI state, filters, and settings.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  campaignsApi, personsApi, orgsApi, membershipsApi,
  connectionsApi, campaignAssignApi, graphApi, settingsApi,
} from '../api/supabase';

export function inferStature(influence) {
  if (influence >= 80) return 2; // Decider
  if (influence >= 60) return 1; // Influencer
  return 0;                      // Participant
}

const useStore = create(
  devtools(
    (set, get) => ({

      // ── Campaigns ─────────────────────────────────────────────────
      campaigns: [],
      activeCampaignId: null,
      campaignLoading: false,

      fetchCampaigns: async () => {
        set({ campaignLoading: true });
        try {
          const data = await campaignsApi.list();
          set({ campaigns: data, campaignLoading: false });
          if (data.length > 0 && !get().activeCampaignId) {
            get().setActiveCampaign(data[0].id);
          }
        } catch (err) {
          console.error('[RPM] fetchCampaigns:', err);
          set({ campaignLoading: false });
        }
      },

      setActiveCampaign: (id) => {
        set({ activeCampaignId: id, selectedNodeId: null, sidebarOpen: false });
        if (id) get().fetchGraph(id);
      },

      createCampaign: async (data) => {
        const created = await campaignsApi.create(data);
        set((s) => ({ campaigns: [created, ...s.campaigns] }));
        return created;
      },

      // ── Graph Data ────────────────────────────────────────────────
      persons: [],
      organizations: [],
      connections: [],
      memberships: [],
      graphLoading: false,
      graphError: null,

      fetchGraph: async (campaignId) => {
        set({ graphLoading: true, graphError: null });
        try {
          const { persons, organizations, connections, memberships } = await graphApi.fetchGraph(campaignId);
          set({
            persons: persons.map((p) => ({ ...p, _type: 'person', stature: inferStature(p.influence_score) })),
            organizations: organizations.map((o) => ({ ...o, _type: 'organization', stature: inferStature(o.influence_score) })),
            connections,
            memberships,
            graphLoading: false,
          });
        } catch (err) {
          console.error('[RPM] fetchGraph:', err);
          set({ graphLoading: false, graphError: err.message });
        }
      },

      /** Unified node list for the visualization (persons + orgs) */
      getAllNodes: () => {
        const { persons, organizations, filters } = get();
        let nodes = [
          ...persons.map((p) => ({
            id: p.id, name: p.name, _type: 'person',
            influence_score: p.influence_score, stature: p.stature,
            role_category: p.role_category,
            primary_role: p.primary_role, primary_org_name: p.primary_org_name,
            pos_x: p.pos_x, pos_y: p.pos_y,
            data: p,
          })),
          ...organizations.map((o) => ({
            id: o.id, name: o.name, _type: 'organization',
            influence_score: o.influence_score, stature: inferStature(o.influence_score),
            role_category: 'neutral',
            primary_role: o.org_type, primary_org_name: '',
            pos_x: o.pos_x, pos_y: o.pos_y,
            data: o,
          })),
        ];
        // Apply filters
        if (filters.roleFilter !== 'all') {
          nodes = nodes.filter((n) => n._type === 'organization' || n.role_category === filters.roleFilter);
        }
        if (filters.minInfluence > 0) {
          nodes = nodes.filter((n) => n.influence_score >= filters.minInfluence);
        }
        if (!filters.showOrgs) {
          nodes = nodes.filter((n) => n._type !== 'organization');
        }
        return nodes;
      },

      getFilteredConnections: () => {
        const { connections, filters } = get();
        return connections.filter((c) => {
          if (c.tier === 'primary' && !filters.showPrimary) return false;
          if (c.tier === 'secondary' && !filters.showSecondary) return false;
          if (c.tier === 'informal' && !filters.showInformal) return false;
          return true;
        });
      },

      // ── Selection ─────────────────────────────────────────────────
      selectedNodeId: null,
      selectedNodeType: null, // 'person' | 'organization'
      hoveredNodeId: null,
      sidebarOpen: false,

      selectNode: (id, type) => {
        set({ selectedNodeId: id, selectedNodeType: type, sidebarOpen: id !== null });
      },
      deselectNode: () => set({ selectedNodeId: null, selectedNodeType: null, sidebarOpen: false }),
      hoverNode: (id) => set({ hoveredNodeId: id }),

      getSelectedEntity: () => {
        const { selectedNodeId, selectedNodeType, persons, organizations } = get();
        if (!selectedNodeId) return null;
        if (selectedNodeType === 'person') return persons.find((p) => p.id === selectedNodeId) || null;
        if (selectedNodeType === 'organization') return organizations.find((o) => o.id === selectedNodeId) || null;
        return null;
      },

      getNodeConnections: (nodeId) => {
        const { connections, persons, organizations } = get();
        const allEntities = new Map([
          ...persons.map((p) => [p.id, { ...p, _type: 'person' }]),
          ...organizations.map((o) => [o.id, { ...o, _type: 'organization' }]),
        ]);
        return connections
          .filter((c) => c.source_id === nodeId || c.target_id === nodeId)
          .map((c) => {
            const otherId = c.source_id === nodeId ? c.target_id : c.source_id;
            return { connection: c, entity: allEntities.get(otherId) || null };
          })
          .filter((c) => c.entity);
      },

      getOrgMembers: (orgId) => {
        const { memberships } = get();
        const forOrg = memberships.filter((m) => m.org_id === orgId);
        return {
          board: forOrg.filter((m) => m.seat_type === 'board'),
          executive: forOrg.filter((m) => m.seat_type === 'executive'),
          staff: forOrg.filter((m) => m.seat_type === 'staff'),
        };
      },

      // ── Modals ────────────────────────────────────────────────────
      addPersonModalOpen: false,
      addOrgModalOpen: false,
      addConnectionModalOpen: false,
      addMembershipModalOpen: false,
      connectionModalSourceId: null,
      connectionModalSourceType: null,
      membershipModalOrgId: null,

      openAddPersonModal: () => set({ addPersonModalOpen: true }),
      closeAddPersonModal: () => set({ addPersonModalOpen: false }),
      openAddOrgModal: () => set({ addOrgModalOpen: true }),
      closeAddOrgModal: () => set({ addOrgModalOpen: false }),
      openAddConnectionModal: (sourceId = null, sourceType = null) =>
        set({ addConnectionModalOpen: true, connectionModalSourceId: sourceId, connectionModalSourceType: sourceType }),
      closeAddConnectionModal: () =>
        set({ addConnectionModalOpen: false, connectionModalSourceId: null, connectionModalSourceType: null }),
      openAddMembershipModal: (orgId = null) =>
        set({ addMembershipModalOpen: true, membershipModalOrgId: orgId }),
      closeAddMembershipModal: () =>
        set({ addMembershipModalOpen: false, membershipModalOrgId: null }),

      // ── CRUD ──────────────────────────────────────────────────────
      createPerson: async (data) => {
        const person = await personsApi.create(data);
        const { activeCampaignId } = get();
        if (activeCampaignId) {
          await campaignAssignApi.addPerson(activeCampaignId, person.id);
          get().fetchGraph(activeCampaignId);
        }
        return person;
      },

      updatePerson: async (id, updates) => {
        await personsApi.update(id, updates);
        set((s) => ({
          persons: s.persons.map((p) =>
            p.id === id ? { ...p, ...updates, stature: inferStature(updates.influence_score ?? p.influence_score) } : p
          ),
        }));
      },

      deletePerson: async (id) => {
        await personsApi.delete(id);
        set((s) => ({
          persons: s.persons.filter((p) => p.id !== id),
          connections: s.connections.filter((c) => c.source_id !== id && c.target_id !== id),
          selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
          sidebarOpen: s.selectedNodeId === id ? false : s.sidebarOpen,
        }));
      },

      createOrg: async (data) => {
        const org = await orgsApi.create(data);
        const { activeCampaignId } = get();
        if (activeCampaignId) {
          await campaignAssignApi.addOrg(activeCampaignId, org.id);
          get().fetchGraph(activeCampaignId);
        }
        return org;
      },

      updateOrg: async (id, updates) => {
        await orgsApi.update(id, updates);
        set((s) => ({
          organizations: s.organizations.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
      },

      deleteOrg: async (id) => {
        await orgsApi.delete(id);
        set((s) => ({
          organizations: s.organizations.filter((o) => o.id !== id),
          connections: s.connections.filter((c) => c.source_id !== id && c.target_id !== id),
          selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
          sidebarOpen: s.selectedNodeId === id ? false : s.sidebarOpen,
        }));
      },

      createConnection: async (data) => {
        await connectionsApi.create(data);
        const { activeCampaignId } = get();
        if (activeCampaignId) get().fetchGraph(activeCampaignId);
      },

      createMembership: async (data) => {
        await membershipsApi.create(data);
        const { activeCampaignId } = get();
        if (activeCampaignId) get().fetchGraph(activeCampaignId);
      },

      // ── Filters ───────────────────────────────────────────────────
      filters: {
        showPrimary: true,
        showSecondary: true,
        showInformal: true,
        showOrgs: true,
        roleFilter: 'all',
        minInfluence: 0,
      },
      setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),

      // ── Settings ──────────────────────────────────────────────────
      settings: {
        autoLayout: true,
        showLabels: true,
        labelDisplayMode: 'first_name',
        edgeAnimations: true,
        backgroundColor: '#f0ede6',
        maxNodesVisible: 200,
      },
      fetchSettings: async () => {
        try {
          const data = await settingsApi.get('app_settings');
          if (data) set((s) => ({ settings: { ...s.settings, ...data } }));
        } catch (_) {}
      },
      setSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),
      saveSettings: async () => {
        await settingsApi.set('app_settings', get().settings);
      },
    }),
    { name: 'RPM v2 Store' }
  )
);

export default useStore;
