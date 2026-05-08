import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { useCustomers } from "@/api/hooks";
import type { Customer } from "@/types";

type BaseProps = {
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

type SingleProps = BaseProps & {
  mode: "single";
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
};

type MultiProps = BaseProps & {
  mode: "multi";
  value: Customer[];
  onChange: (customers: Customer[]) => void;
  primaryId?: string;
  onPrimaryChange?: (id: string) => void;
};

type Props = SingleProps | MultiProps;

/**
 * Autocomplete customer picker built on MUI Autocomplete. Debounces input and
 * queries `/customers?search=…` so the list scales with thousands of records.
 *
 * - `single` mode: a normal autocomplete that resolves to one customer.
 * - `multi` mode: chips with optional star-to-set-primary, customers are added
 *   one at a time as the user picks them.
 */
export function CustomerAutocompleteSelect(props: Props) {
  const {
    excludeIds = [],
    placeholder = "Search customers by name, code, phone, email, ID…",
    disabled,
    autoFocus,
  } = props;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useCustomers({
    search: debouncedQuery || undefined,
    page: 1,
    pageSize: 20,
  });

  const selectedIds = useMemo(() => {
    if (props.mode === "single") return props.value ? [props.value.id] : [];
    return props.value.map((c) => c.id);
  }, [props]);

  const blockedIds = useMemo(
    () => new Set([...selectedIds, ...excludeIds]),
    [selectedIds, excludeIds],
  );

  const options = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((c) => c.isActive && !blockedIds.has(c.id));
  }, [data, blockedIds]);

  // ── Single mode ────────────────────────────────────────────────────────
  if (props.mode === "single") {
    return (
      <Autocomplete
        options={options}
        value={props.value}
        loading={isFetching}
        disabled={disabled}
        onChange={(_, val) => props.onChange(val)}
        onInputChange={(_, val) => setQuery(val)}
        getOptionLabel={(c) => `${c.name} (${c.customerCode})`}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        filterOptions={(x) => x} // server-side filtering
        noOptionsText={
          debouncedQuery
            ? `No active customers match "${debouncedQuery}"`
            : "Start typing to search…"
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            autoFocus={autoFocus}
            size="small"
          />
        )}
        renderOption={(rprops, c) => (
          <Box component="li" {...rprops} key={c.id}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  fontWeight: 500,
                }}
              >
                {c.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {c.customerCode}
                {c.phone && ` · ${c.phone}`}
                {c.email && ` · ${c.email}`}
              </Typography>
            </Box>
          </Box>
        )}
      />
    );
  }

  // ── Multi mode ─────────────────────────────────────────────────────────
  const handleAdd = (c: Customer | null) => {
    if (!c) return;
    if (props.value.some((x) => x.id === c.id)) return;
    props.onChange([...props.value, c]);
    setQuery("");
  };

  const handleRemove = (id: string) => {
    props.onChange(props.value.filter((c) => c.id !== id));
  };

  return (
    <Stack spacing={1}>
      {props.value.length > 0 && (
        <Stack
          direction="row"
          sx={{
            flexWrap: "wrap",
            gap: 0.75,
          }}
        >
          {props.value.map((c) => {
            const isPrimary = props.primaryId === c.id;
            return (
              <Chip
                key={c.id}
                size="small"
                color={isPrimary ? "secondary" : "default"}
                variant={isPrimary ? "filled" : "outlined"}
                label={
                  <Stack
                    direction="row"
                    component="span"
                    sx={{
                      alignItems: "center",
                      gap: 0.75,
                    }}
                  >
                    {props.onPrimaryChange && (
                      <Tooltip
                        title={
                          isPrimary ? "Primary customer" : "Mark as primary"
                        }
                      >
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onPrimaryChange?.(c.id);
                          }}
                          style={{ display: "inline-flex", cursor: "pointer" }}
                        >
                          {isPrimary ? (
                            <StarIcon sx={{ fontSize: 14 }} />
                          ) : (
                            <StarBorderIcon sx={{ fontSize: 14 }} />
                          )}
                        </span>
                      </Tooltip>
                    )}
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        opacity: 0.7,
                      }}
                    >
                      {c.customerCode}
                    </span>
                  </Stack>
                }
                onDelete={disabled ? undefined : () => handleRemove(c.id)}
              />
            );
          })}
        </Stack>
      )}
      <Autocomplete
        options={options}
        value={null}
        inputValue={query}
        loading={isFetching}
        disabled={disabled}
        onChange={(_, val) => handleAdd(val)}
        onInputChange={(_, val, reason) => {
          if (reason !== "reset") setQuery(val);
        }}
        getOptionLabel={(c) => `${c.name} (${c.customerCode})`}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        filterOptions={(x) => x}
        clearOnBlur={false}
        clearOnEscape
        blurOnSelect={false}
        noOptionsText={
          debouncedQuery
            ? `No active customers match "${debouncedQuery}"`
            : props.value.length > 0 || excludeIds.length > 0
              ? "No more customers to add"
              : "Start typing to search…"
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            autoFocus={autoFocus}
            size="small"
          />
        )}
        renderOption={(rprops, c) => (
          <Box component="li" {...rprops} key={c.id}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  fontWeight: 500,
                }}
              >
                {c.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {c.customerCode}
                {c.phone && ` · ${c.phone}`}
                {c.email && ` · ${c.email}`}
              </Typography>
            </Box>
          </Box>
        )}
      />
    </Stack>
  );
}
