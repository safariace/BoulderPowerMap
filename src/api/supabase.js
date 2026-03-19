/**
 * RPM v2 — Supabase API Client
 * =============================
 * Typed helpers wrapping @supabase/supabase-js for all 8 tables.
 * Handles the polymorphic connection resolution and graph assembly.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Helpers ─────────────────────────────────────────────────────────────

function throwOnError(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

// ── Campaigns ───────────────────────────────────────────────────────────

export const campaignsApi = {
  list: async (status) => {
    let q = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    return throwOnError(await q);
  },
  get: async (id) => throwOnError(await supabase.from('campaigns').select('*').eq('id', id).single()),
  create: async (data) => throwOnError(await supabase.from('campaigns').insert(data).select().single()),
  update: async (id, data) => throwOnError(await supabase.from('campaigns').update(data).eq('id', id).select().single()),
  delete: async (id) => throwOnError(await supabase.from('campaigns').delete().eq('id', id)),
};

// ── Persons ─────────────────────────────────────────────────────────────

export const personsApi = {
  list: async () => throwOnError(
    await supabase.from('persons').select('*, chaperone:persons!chaperone_id(id, name)').order('influence_score', { ascending: false })
  ),
  get: async (id) => throwOnError(
    await supabase.from('persons').select('*, chaperone:persons!chaperone_id(id, name)').eq('id', id).single()
  ),
  create: async (data) => throwOnError(await supabase.from('persons').insert(data).select().single()),
  update: async (id, data) => throwOnError(await supabase.from('persons').update(data).eq('id', id).select().single()),
  delete: async (id) => throwOnError(await supabase.from('persons').delete().eq('id', id)),
};

// ── Organizations ───────────────────────────────────────────────────────

export const orgsApi = {
  list: async () => throwOnError(
    await supabase.from('organizations').select('*').order('influence_score', { ascending: false })
  ),
  get: async (id) => throwOnError(
    await supabase.from('organizations').select('*').eq('id', id).single()
  ),
  create: async (data) => throwOnError(await supabase.from('organizations').insert(data).select().single()),
  update: async (id, data) => throwOnError(await supabase.from('organizations').update(data).eq('id', id).select().single()),
  delete: async (id) => throwOnError(await supabase.from('organizations').delete().eq('id', id)),

  /** Get all members of an org, grouped by seat type */
  getMembers: async (orgId) => {
    const data = throwOnError(
      await supabase.from('org_members_view').select('*').eq('org_id', orgId).order('seat_type')
    );
    return {
      board: data.filter((m) => m.seat_type === 'board'),
      executive: data.filter((m) => m.seat_type === 'executive'),
      staff: data.filter((m) => m.seat_type === 'staff'),
    };
  },
};

// ── Org Memberships ─────────────────────────────────────────────────────

export const membershipsApi = {
  create: async (data) => throwOnError(await supabase.from('org_memberships').insert(data).select().single()),
  delete: async (id) => throwOnError(await supabase.from('org_memberships').delete().eq('id', id)),
  listForPerson: async (personId) => throwOnError(
    await supabase.from('org_members_view').select('*').eq('person_id', personId)
  ),
  listForOrg: async (orgId) => throwOnError(
    await supabase.from('org_members_view').select('*').eq('org_id', orgId)
  ),
};

// ── Connections ─────────────────────────────────────────────────────────

export const connectionsApi = {
  /** Create a connection. Caller passes the appropriate source/target fields. */
  create: async (data) => throwOnError(await supabase.from('connections').insert(data).select().single()),
  update: async (id, data) => throwOnError(await supabase.from('connections').update(data).eq('id', id).select().single()),
  delete: async (id) => throwOnError(await supabase.from('connections').delete().eq('id', id)),

  /** Get resolved connections for a specific person */
  forPerson: async (personId) => throwOnError(
    await supabase.from('connections_resolved').select('*')
      .or(`source_id.eq.${personId},target_id.eq.${personId}`)
  ),

  /** Get resolved connections for a specific org */
  forOrg: async (orgId) => throwOnError(
    await supabase.from('connections_resolved').select('*')
      .or(`source_id.eq.${orgId},target_id.eq.${orgId}`)
  ),
};

// ── Campaign Assignments ────────────────────────────────────────────────

export const campaignAssignApi = {
  addPerson: async (campaignId, personId) =>
    throwOnError(await supabase.from('campaign_persons').insert({ campaign_id: campaignId, person_id: personId }).select().single()),
  removePerson: async (campaignId, personId) =>
    throwOnError(await supabase.from('campaign_persons').delete().match({ campaign_id: campaignId, person_id: personId })),
  addOrg: async (campaignId, orgId) =>
    throwOnError(await supabase.from('campaign_orgs').insert({ campaign_id: campaignId, org_id: orgId }).select().single()),
  removeOrg: async (campaignId, orgId) =>
    throwOnError(await supabase.from('campaign_orgs').delete().match({ campaign_id: campaignId, org_id: orgId })),
};

// ── Graph Data (full fetch for visualization) ───────────────────────────

export const graphApi = {
  /**
   * Fetch the complete graph for a campaign:
   *   - All persons assigned to the campaign
   *   - All orgs assigned to the campaign
   *   - All connections where BOTH endpoints are in the campaign
   *   - All org memberships for those orgs
   */
  fetchGraph: async (campaignId) => {
    // 1. Get persons in campaign
    const personLinks = throwOnError(
      await supabase.from('campaign_persons').select('person_id').eq('campaign_id', campaignId)
    );
    const personIds = personLinks.map((p) => p.person_id);

    // 2. Get orgs in campaign
    const orgLinks = throwOnError(
      await supabase.from('campaign_orgs').select('org_id').eq('campaign_id', campaignId)
    );
    const orgIds = orgLinks.map((o) => o.org_id);

    // 3. Fetch full person records
    let persons = [];
    if (personIds.length > 0) {
      persons = throwOnError(
        await supabase.from('persons').select('*, chaperone:persons!chaperone_id(id, name)')
          .in('id', personIds)
      );
    }

    // 4. Fetch full org records
    let organizations = [];
    if (orgIds.length > 0) {
      organizations = throwOnError(
        await supabase.from('organizations').select('*').in('id', orgIds)
      );
    }

    // 5. Fetch all resolved connections where both endpoints are in the campaign
    const allEntityIds = [...personIds, ...orgIds];
    let connections = [];
    if (allEntityIds.length > 0) {
      const allConns = throwOnError(
        await supabase.from('connections_resolved').select('*')
      );
      // Filter to only connections where both source and target are in this campaign
      connections = allConns.filter(
        (c) => allEntityIds.includes(c.source_id) && allEntityIds.includes(c.target_id)
      );
    }

    // 6. Fetch memberships for orgs in campaign
    let memberships = [];
    if (orgIds.length > 0) {
      memberships = throwOnError(
        await supabase.from('org_members_view').select('*').in('org_id', orgIds)
      );
    }

    return { persons, organizations, connections, memberships };
  },
};

// ── Settings ────────────────────────────────────────────────────────────

export const settingsApi = {
  get: async (key) => {
    const { data } = await supabase.from('settings').select('value').eq('key', key).single();
    return data?.value || null;
  },
  set: async (key, value) => throwOnError(
    await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
  ),
};
