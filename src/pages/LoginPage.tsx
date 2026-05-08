import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import { useLogin } from "@/api/hooks";
import { useAuthStore } from "@/api/authStore";
import { showError } from "@/utils/errors";
import { colors } from "@/theme";

export default function LoginPage() {
  const isDev = import.meta.env.DEV;
  const [email, setEmail] = useState(isDev ? "admin@backpocket.local" : "");
  const [password, setPassword] = useState(isDev ? "DevAdmin!2026" : "");
  const setAuth = useAuthStore((s) => s.setAuth);
  const login = useLogin();
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await login.mutateAsync({ email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate("/");
    } catch (err) {
      showError(err, "Invalid credentials");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Left: brand panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "50%",
          bgcolor: colors.ink[950],
          color: "#fff",
          p: 6,
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="BackPocket"
              sx={{ width: 140, height: 140, objectFit: "contain" }}
            />
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Fraunces", serif',
                  fontSize: "1.875rem",
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}
              >
                BackPocket
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: "0.625rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: colors.ink[500],
                  mt: 0.5,
                }}
              >
                Francis Financial & Business Consultancy Service
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack spacing={3} sx={{ maxWidth: 480 }}>
          <Typography
            sx={{
              fontFamily: '"Fraunces", serif',
              fontSize: "3rem",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Every figure,{" "}
            <Box
              component="span"
              sx={{ fontStyle: "italic", color: colors.accent.main }}
            >
              accounted for.
            </Box>
          </Typography>
          <Typography sx={{ color: colors.ink[400], lineHeight: 1.6 }}>
            Tailored billing and financial management for the businesses we
            serve — customer ledgers, project tracking, invoice generation, and
            payment reconciliation, with full audit trails on every action.
          </Typography>
          <Divider sx={{ borderColor: colors.ink[800], pt: 4 }} />
          <Grid container spacing={2}>
            {[
              { num: "·01", label: "Customers & Projects" },
              { num: "·02", label: "Invoicing" },
              { num: "·03", label: "Reconciliation" },
            ].map((item) => (
              <Grid size={{ xs: 4 }} key={item.num}>
                <Typography
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "0.625rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: colors.ink[600],
                  }}
                >
                  <Box sx={{ color: colors.accent.main }}>{item.num}</Box>
                  {item.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Stack>

        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: "0.625rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: colors.ink[600],
          }}
        >
          {new Date().getFullYear()} — Powered by Onenickware
        </Typography>
      </Box>
      {/* Right: form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 360 }}>
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1.5,
              mb: 4,
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              sx={{ width: 40, height: 40, objectFit: "contain" }}
            />
            <Box>
              <Typography variant="h2">BackPocket</Typography>
              <Typography variant="overline">Francis Financial</Typography>
            </Box>
          </Box>

          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
              mb: 1.5,
              display: "block",
            }}
          >
            Authorized access only
          </Typography>
          <Typography variant="h1" sx={{ mb: 4 }}>
            Sign in
          </Typography>

          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                required
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={login.isPending}
              >
                {login.isPending ? "Signing in…" : "Sign in →"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ mt: 5 }} />
          <Typography
            sx={{
              mt: 3,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "0.75rem",
              color: colors.ink[500],
            }}
          >
            Need access? Contact your administrator.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
