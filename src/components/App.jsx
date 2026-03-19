import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import rpmTheme from '../theme/theme';
import useStore from '../store/useStore';
import Toolbar from './common/Toolbar';
import FilterBar from './common/FilterBar';
import PowerMapCanvas from './canvas/PowerMapCanvas';
import InspectorSidebar from './sidebar/InspectorSidebar';
import AddPersonModal from './modals/AddPersonModal';
import AddOrgModal from './modals/AddOrgModal';
import AddConnectionModal from './modals/AddConnectionModal';
import AddMembershipModal from './modals/AddMembershipModal';

export default function App() {
  const fetchCampaigns = useStore((s) => s.fetchCampaigns);
  const fetchSettings = useStore((s) => s.fetchSettings);
  const graphLoading = useStore((s) => s.graphLoading);
  const graphError = useStore((s) => s.graphError);
  const activeCampaignId = useStore((s) => s.activeCampaignId);

  useEffect(() => { fetchCampaigns(); fetchSettings(); }, []);

  return (
    <ThemeProvider theme={rpmTheme}>
      <CssBaseline />
      <Box sx={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden', bgcolor: 'background.default' }}>
        <Toolbar />
        <FilterBar />
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          {graphLoading && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 5, textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ color: 'primary.main' }} />
              <Typography variant="caption" display="block" sx={{ mt: 2 }}>Loading power map…</Typography>
            </Box>
          )}
          {graphError && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 5, textAlign: 'center', p: 4 }}>
              <Typography variant="h4" color="error" gutterBottom>Error loading graph</Typography>
              <Typography variant="body2">{graphError}</Typography>
            </Box>
          )}
          {!graphLoading && !graphError && activeCampaignId && <PowerMapCanvas />}
          {!activeCampaignId && !graphLoading && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', p: 4 }}>
              <Typography variant="h2" sx={{ color: 'text.secondary', mb: 1 }}>No Campaign Selected</Typography>
              <Typography variant="body2">Create or select a campaign from the toolbar.</Typography>
            </Box>
          )}
        </Box>
        <InspectorSidebar />
        <AddPersonModal />
        <AddOrgModal />
        <AddConnectionModal />
        <AddMembershipModal />
      </Box>
    </ThemeProvider>
  );
}
