import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import {
  LayoutDashboard, Users, FileText, CreditCard, ScrollText, LogOut,
  FolderKanban, LayoutTemplate, ShieldCheck, KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/api/authStore';
import type { UserRole } from '@/types';
import { colors } from '@/theme';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  section?: string;
  requires?: string;
};

const nav: NavItem[] = [
  { to: '/',          label: 'Overview',     icon: LayoutDashboard, section: 'Operations' },
  { to: '/customers', label: 'Customers',    icon: Users,           section: 'Operations', requires: 'customers.view' },
  { to: '/projects',  label: 'Projects',     icon: FolderKanban,    section: 'Operations', requires: 'projects.view' },
  { to: '/invoices',  label: 'Invoices',     icon: FileText,        section: 'Operations', requires: 'invoices.view' },
  { to: '/payments',  label: 'Payments',     icon: CreditCard,      section: 'Operations', requires: 'payments.view' },
  { to: '/templates', label: 'Templates',    icon: LayoutTemplate,  section: 'Configuration', requires: 'templates.view' },
  { to: '/users',     label: 'Users',        icon: ShieldCheck,     section: 'Configuration', requires: 'users.manage' },
  { to: '/access',    label: 'Access Roles', icon: KeyRound,        section: 'Configuration', requires: 'roles.manage' },
  { to: '/audit',     label: 'Audit Log',    icon: ScrollText,      section: 'Configuration', requires: 'audit.view' },
];

const SIDEBAR_WIDTH = 256;

export default function AppLayout() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const logout = () => { clear(); navigate('/login'); };

  const visibleNav = nav.filter(n =>
    !n.requires || (user?.permissions ?? []).includes(n.requires)
  );
  const sections = Array.from(new Set(visibleNav.map(n => n.section).filter(Boolean))) as string[];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            bgcolor: colors.ink[950],
            color: colors.ink[200],
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: colors.ink[800] }}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 1.5
            }}>
            <Box component="img" src="/logo.png" alt="BackPocket"
                 sx={{ width: 40, height: 40, objectFit: 'contain' }} />
            <Box>
              <Typography sx={{
                fontFamily: '"Fraunces", serif',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}>
                BackPocket
              </Typography>
              <Typography sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: colors.ink[500],
                lineHeight: 1.1,
              }}>
                Francis Financial
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 3 }}>
          {sections.map(section => (
            <Box key={section} sx={{ mb: 2.5 }}>
              <Typography sx={{
                px: 1.5, mb: 1,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: colors.ink[600],
              }}>
                {section}
              </Typography>
              <List disablePadding sx={{ '& .MuiListItemButton-root': { py: 1, px: 1.5 } }}>
                {visibleNav.filter(n => n.section === section).map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {({ isActive }) => (
                      <ListItemButton
                        sx={{
                          color: isActive ? '#fff' : colors.ink[400],
                          bgcolor: isActive ? colors.ink[800] : 'transparent',
                          borderLeft: isActive ? `2px solid ${colors.accent.main}` : '2px solid transparent',
                          pl: isActive ? 1.25 : 1.5,
                          '&:hover': {
                            bgcolor: isActive ? colors.ink[800] : colors.ink[900],
                            color: isActive ? '#fff' : colors.ink[100],
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
                          <Icon size={16} strokeWidth={1.5} />
                        </ListItemIcon>
                        <ListItemText
                          primary={label}
                          slotProps={{
                            primary: { sx: { fontSize: '0.875rem' } }
                          }}
                        />
                      </ListItemButton>
                    )}
                  </NavLink>
                ))}
              </List>
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: colors.ink[800] }}>
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography sx={{ color: '#fff', fontSize: '0.875rem' }} noWrap>
              {user?.fullName}
            </Typography>
            <Typography sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
              color: colors.ink[500],
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              {user?.role as UserRole}
            </Typography>
          </Box>
          <ListItemButton
            onClick={logout}
            sx={{
              color: colors.ink[400],
              '&:hover': { bgcolor: colors.ink[900], color: '#fff' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
              <LogOut size={14} strokeWidth={1.5} />
            </ListItemIcon>
            <ListItemText primary="Sign out" slotProps={{
              primary: { sx: { fontSize: '0.875rem' } }
            }} />
          </ListItemButton>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto', px: 4, py: 5 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
