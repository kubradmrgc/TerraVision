import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { AppointmentDto, AppointmentStatus } from '../../types/appointment';
import type { MobilePalette, ThemeMode } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';

const appointmentStatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Completed',
  4: 'Cancelled'
};

const CONSULTANT_OPTIONS: { id: number; label: string }[] = [
  { id: 1, label: 'Dr. Elena Vance - Agronomy Expert' },
  { id: 2, label: 'Marcus Thorne - Supply Chain Analyst' },
  { id: 3, label: 'Sarah Chen - Retail Specialist' }
];

const SERVICE_OPTIONS: { key: string; label: string; consultantId: number }[] = [
  { key: 'lidar', label: 'Lidar Calibration', consultantId: 1 },
  { key: 'sensor', label: 'Sensor Maintenance', consultantId: 2 },
  { key: 'field', label: 'Field Analysis', consultantId: 3 },
  { key: 'hw', label: 'Hardware Repair', consultantId: 2 }
];

const DARK_PRIMARY_FIXED_DIM = '#73db9a';
const TERTIARY_FIXED_DIM = '#eabf8f';

const LIGHT_TERTIARY_FIXED = '#ffd9dd';
const LIGHT_ON_TERTIARY_FIXED_VARIANT = '#792d3b';
const PENDING_BORDER = '#8f3e4c';
const LIGHT_PRIMARY_FIXED = '#a6f4b5';
const LIGHT_ON_PRIMARY_FIXED = '#00210b';
const LIGHT_SURFACE_HIGH = '#eae7eb';
const LIGHT_ERROR_CONTAINER = '#ffdad6';
const LIGHT_ON_ERROR_CONTAINER = '#93000a';
const DARK_URGENT_ERROR = '#ffb4ab';
const DARK_REJECT_BG = '#93000a';
const DARK_REJECT_FG = '#ffdad6';

const CUSTOMER_DISPLAY_NAMES = ['Marcus Thorne', 'Sarah Chen', 'Alex Rivera', 'Elena Vance'];

type Props = {
  appointments: AppointmentDto[];
  role: number | null;
  palette: MobilePalette;
  themeMode?: ThemeMode;
  isLoading: boolean;
  errorMessage: string | null;
  isMutating: boolean;
  consultantIdInput: string;
  appointmentDateInput: string;
  appointmentNotesInput: string;
  appointmentFilterStatus: 'all' | AppointmentStatus;
  appointmentErrorMessage: string | null;
  appointmentSuccessMessage: string | null;
  onConsultantIdChange: (value: string) => void;
  onAppointmentDateChange: (value: string) => void;
  onAppointmentNotesChange: (value: string) => void;
  onAppointmentFilterChange: (value: 'all' | AppointmentStatus) => void;
  onCreateAppointment: () => void;
  onUpdateStatus: (id: number, status: AppointmentStatus) => void;
  /** Total rows from API (for dark “All Records” badge); defaults to `appointments.length`. */
  totalAppointmentsCount?: number;
  /** Count of pending (status 1) appointments across all filters; for consultant light bento. */
  pendingAppointmentsCount?: number;
  /** Count of completed (status 3) appointments; for consultant dark bento. */
  completedAppointmentsCount?: number;
  /** Average visit length in minutes (preview heuristic); for consultant dark bento. */
  averageAppointmentDurationMins?: number;
};

function getRoleLabel(role: number | null): string {
  if (role === 1) return 'Customer';
  if (role === 2) return 'Consultant';
  if (role === 3) return 'Admin';
  return 'Unknown';
}

function parseAppointmentDateInput(iso: string): Date {
  const trimmed = iso.trim();
  if (!trimmed) {
    return new Date();
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function isValidIso(iso: string): boolean {
  if (!iso.trim()) return false;
  const parsed = new Date(iso);
  return !Number.isNaN(parsed.getTime());
}

function mergeDateKeepingTime(prev: Date, nextDate: Date): Date {
  return new Date(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
    prev.getHours(),
    prev.getMinutes(),
    prev.getSeconds(),
    prev.getMilliseconds()
  );
}

function mergeTimeKeepingDate(prev: Date, nextTime: Date): Date {
  return new Date(
    prev.getFullYear(),
    prev.getMonth(),
    prev.getDate(),
    nextTime.getHours(),
    nextTime.getMinutes(),
    nextTime.getSeconds(),
    nextTime.getMilliseconds()
  );
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDisplayTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isAppointmentTerminal(status: AppointmentStatus): boolean {
  return status === 3 || status === 4;
}

function isStatusActionDisabled(
  appointment: AppointmentDto,
  nextStatus: AppointmentStatus,
  isMutating: boolean
): boolean {
  if (isMutating) {
    return true;
  }
  if (appointment.status === nextStatus) {
    return true;
  }
  if (isAppointmentTerminal(appointment.status)) {
    return true;
  }
  return false;
}

function consultantWithLine(consultantId: number): string {
  const row = CONSULTANT_OPTIONS.find((o) => o.id === consultantId);
  if (!row) return `with Consultant #${consultantId}`;
  const name = row.label.split(' - ')[0];
  return `with ${name}`;
}

function appointmentCardTitle(a: AppointmentDto): string {
  const n = a.notes?.trim();
  if (n) {
    const first = n.split('\n')[0].trim();
    if (first.length > 48) return `${first.slice(0, 45)}…`;
    return first;
  }
  return `Appointment #${a.id}`;
}

function inferServiceKeyFromConsultantId(idStr: string): string {
  const id = Number(idStr);
  if (id === 1) return 'lidar';
  if (id === 3) return 'field';
  return 'sensor';
}

function darkStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case 1:
      return 'Reviewing';
    case 2:
      return 'Confirmed';
    case 3:
      return 'Archived';
    case 4:
      return 'Cancelled';
    default:
      return '';
  }
}

function locationHint(a: AppointmentDto): string {
  const hints = ['Sector 7G', 'Remote Site Alpha', 'North Gate Depot'];
  return hints[a.id % hints.length];
}

function tvRef(id: number): string {
  return `TV-${String(id).padStart(4, '0')}`;
}

function customerDisplayName(customerId: number): string {
  const i = Math.abs(customerId) % CUSTOMER_DISPLAY_NAMES.length;
  return CUSTOMER_DISPLAY_NAMES[i]!;
}

function consultantSubtitle(a: AppointmentDto): string {
  return `${appointmentCardTitle(a)} • ${locationHint(a)}`;
}

function locationLine(a: AppointmentDto): string {
  const lines = a.notes?.split('\n').map((x) => x.trim()).filter(Boolean) ?? [];
  if (lines.length > 1) {
    return lines[1]!;
  }
  const venues = ['Central Hub Warehouse - Aisle 42', 'Plaza North - Management Suite', 'Field Office B - Room 3'];
  return venues[Math.abs(a.id) % venues.length]!;
}

function durationMins(a: AppointmentDto): number {
  return 30 + (Math.abs(a.id) % 4) * 15;
}

function isConsultantDarkUrgent(a: AppointmentDto): boolean {
  if (a.status !== 1) {
    return false;
  }
  if (/\b(urgent|emergency)\b/i.test(a.notes ?? '')) {
    return true;
  }
  return a.id % 5 === 0;
}

function consultantDarkScheduleLine(a: AppointmentDto, d: Date, dateValid: boolean): string {
  const t = dateValid ? formatDisplayTime(d) : '—';
  return `🕐 ${t} — ${appointmentCardTitle(a)}`;
}

function statusPillStyle(
  status: AppointmentStatus,
  palette: MobilePalette
): { bg: string; fg: string } {
  switch (status) {
    case 1:
      return { bg: LIGHT_TERTIARY_FIXED, fg: LIGHT_ON_TERTIARY_FIXED_VARIANT };
    case 2:
      return { bg: palette.secondaryContainer, fg: palette.onSecondaryContainer };
    case 3:
      return { bg: palette.primaryContainer, fg: palette.onPrimaryContainer };
    case 4:
      return { bg: palette.imagePlaceholder, fg: palette.subText };
    default:
      return { bg: palette.mutedCard, fg: palette.text };
  }
}

function leftAccentColor(status: AppointmentStatus, palette: MobilePalette): string | null {
  switch (status) {
    case 1:
      return PENDING_BORDER;
    case 2:
      return palette.button;
    case 3:
      return palette.primaryContainer;
    case 4:
      return null;
    default:
      return palette.border;
  }
}

function darkCardPillStyle(
  status: AppointmentStatus,
  palette: MobilePalette
): { bg: string; fg: string; border: string } {
  switch (status) {
    case 1:
      return {
        bg: palette.imagePlaceholder,
        fg: palette.subText,
        border: palette.outlineVariant
      };
    case 2:
      return {
        bg: 'rgba(219, 255, 226, 0.1)',
        fg: DARK_PRIMARY_FIXED_DIM,
        border: 'rgba(219, 255, 226, 0.2)'
      };
    case 3:
      return {
        bg: palette.card,
        fg: palette.border,
        border: palette.outlineVariant
      };
    case 4:
      return {
        bg: 'rgba(255, 180, 171, 0.12)',
        fg: '#ffb4ab',
        border: 'rgba(255, 180, 171, 0.25)'
      };
    default:
      return { bg: palette.mutedCard, fg: palette.text, border: palette.outlineVariant };
  }
}

export function AppointmentsSection({
  appointments,
  role,
  palette,
  themeMode = 'light',
  isLoading,
  errorMessage,
  isMutating,
  consultantIdInput,
  appointmentDateInput,
  appointmentNotesInput,
  appointmentFilterStatus,
  appointmentErrorMessage,
  appointmentSuccessMessage,
  onConsultantIdChange,
  onAppointmentDateChange,
  onAppointmentNotesChange,
  onAppointmentFilterChange,
  onUpdateStatus,
  onCreateAppointment,
  totalAppointmentsCount: totalAppointmentsCountProp,
  pendingAppointmentsCount: pendingAppointmentsCountProp,
  completedAppointmentsCount: completedAppointmentsCountProp,
  averageAppointmentDurationMins: averageAppointmentDurationMinsProp
}: Props): React.JSX.Element {
  const stitchLight = themeMode === 'light';
  const customerStitchLight = stitchLight && role === 1;
  const customerStitchDark = themeMode === 'dark' && role === 1;
  const consultantStitchLight = stitchLight && (role === 2 || role === 3);
  const consultantStitchDark = themeMode === 'dark' && (role === 2 || role === 3);
  const totalRecords = totalAppointmentsCountProp ?? appointments.length;
  const pendingTotal = pendingAppointmentsCountProp ?? 0;
  const completedTotal = completedAppointmentsCountProp ?? 0;
  const avgDurationMins = averageAppointmentDurationMinsProp ?? 45;

  const [darkServiceKey, setDarkServiceKey] = useState(() => inferServiceKeyFromConsultantId(consultantIdInput));

  const [stitchPicker, setStitchPicker] = useState<'date' | 'time' | null>(null);
  const pickerValue = useMemo(() => parseAppointmentDateInput(appointmentDateInput), [appointmentDateInput]);

  const onStitchPickerChange = (event: { type?: string }, selected?: Date) => {
    if (Platform.OS === 'android') {
      setStitchPicker(null);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (!selected || !stitchPicker) return;
    const current = parseAppointmentDateInput(appointmentDateInput);
    const base = isValidIso(appointmentDateInput) ? current : selected;
    const merged =
      stitchPicker === 'date' ? mergeDateKeepingTime(base, selected) : mergeTimeKeepingDate(base, selected);
    onAppointmentDateChange(merged.toISOString());
  };

  const toggleStitchDatePicker = () => setStitchPicker((cur) => (cur === 'date' ? null : 'date'));
  const toggleStitchTimePicker = () => setStitchPicker((cur) => (cur === 'time' ? null : 'time'));

  const borderSoft = `${palette.outlineVariant}4D`;
  const chipInactive = {
    backgroundColor: palette.bottomNav,
    borderColor: palette.outlineVariant
  };

  const filterKeys = ['all', 1, 2, 3, 4] as const;

  const renderFilters = (horizontal: boolean) => {
    const chips = filterKeys.map((status) => {
      const selected = appointmentFilterStatus === status;
      return (
        <TouchableOpacity
          key={String(status)}
          onPress={() => onAppointmentFilterChange(status)}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={status === 'all' ? 'All appointments' : `Filter ${appointmentStatusLabels[status]}`}
          style={[
            slStyles.filterChip,
            horizontal ? slStyles.filterChipH : slStyles.filterChipWrap,
            selected
              ? { backgroundColor: palette.button, borderColor: palette.button }
              : chipInactive
          ]}
        >
          <Text
            style={[slStyles.filterChipText, { color: selected ? palette.buttonText : palette.subText }]}
          >
            {status === 'all' ? 'All' : appointmentStatusLabels[status]}
          </Text>
        </TouchableOpacity>
      );
    });
    if (horizontal) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={slStyles.filterScrollContent}
          style={slStyles.filterScroll}
        >
          {chips}
        </ScrollView>
      );
    }
    return <View style={legacyStyles.filterRow}>{chips}</View>;
  };

  const renderDarkFilters = () => {
    const chips = filterKeys.map((status) => {
      const selected = appointmentFilterStatus === status;
      const isAll = status === 'all';
      const label =
        isAll ? 'All Records' : status === 2 ? 'Confirmed' : appointmentStatusLabels[status];
      return (
        <TouchableOpacity
          key={String(status)}
          onPress={() => onAppointmentFilterChange(status)}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={isAll ? 'All appointment records' : `Filter ${appointmentStatusLabels[status]}`}
          style={[
            darkStyles.filterChip,
            selected
              ? {
                  backgroundColor: palette.secondaryContainer,
                  borderColor: 'rgba(115, 219, 154, 0.2)'
                }
              : {
                  backgroundColor: palette.elevatedSurface,
                  borderColor: 'transparent'
                }
          ]}
        >
          <View style={darkStyles.filterChipInner}>
            <Text
              style={[
                darkStyles.filterChipText,
                { color: selected ? palette.onSecondaryContainer : palette.subText }
              ]}
            >
              {label}
            </Text>
            {isAll && selected ? (
              <View style={[darkStyles.filterBadge, { backgroundColor: 'rgba(134, 239, 172, 0.2)' }]}>
                <Text style={[darkStyles.filterBadgeText, { color: DARK_PRIMARY_FIXED_DIM }]}>{totalRecords}</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    });
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={darkStyles.filterScrollContent}
        style={darkStyles.filterScroll}
      >
        {chips}
      </ScrollView>
    );
  };

  const renderAppointmentRow = (appointment: AppointmentDto) => {
    const pill = statusPillStyle(appointment.status, palette);
    const accent = customerStitchLight ? leftAccentColor(appointment.status, palette) : null;
    const isCancelled = appointment.status === 4;
    const d = new Date(appointment.appointmentDate);
    const dateValid = !Number.isNaN(d.getTime());

    if (consultantStitchLight) {
      const displayName = customerDisplayName(appointment.customerId);
      const initial = displayName.trim().charAt(0).toUpperCase() || '?';

      if (isAppointmentTerminal(appointment.status)) {
        const endPill = appointment.status === 3 ? 'Archived' : 'Cancelled';
        return (
          <View
            key={appointment.id}
            style={[
              clStyles.archivedCard,
              {
                backgroundColor: palette.surfaceLowest,
                borderColor: borderSoft,
                borderLeftColor: palette.outlineVariant
              }
            ]}
          >
            <View style={clStyles.archivedInner}>
              <View style={clStyles.archivedLeft}>
                <Text style={[clStyles.archivedGlyph, { color: palette.subText }]}>↺</Text>
                <View style={clStyles.archivedTextCol}>
                  <Text style={[clStyles.archivedTitle, { color: palette.subText }]} numberOfLines={2}>
                    {appointmentCardTitle(appointment)}
                  </Text>
                  <Text style={[clStyles.archivedMeta, { color: palette.subText }]}>
                    {dateValid ? formatDisplayTime(d) : '—'} •{' '}
                    {appointment.status === 3 ? 'Completed' : 'Cancelled'}
                  </Text>
                </View>
              </View>
              <View style={[clStyles.archivedPill, { backgroundColor: LIGHT_SURFACE_HIGH }]}>
                <Text style={[clStyles.archivedPillText, { color: palette.subText }]}>{endPill}</Text>
              </View>
            </View>
          </View>
        );
      }

      const dm = durationMins(appointment);
      return (
        <View
          key={appointment.id}
          style={[
            clStyles.denseCard,
            {
              backgroundColor: palette.surfaceLowest,
              borderColor: borderSoft
            }
          ]}
        >
          <View style={clStyles.denseTop}>
            <View style={clStyles.densePerson}>
              <View style={[clStyles.avatar, { backgroundColor: LIGHT_SURFACE_HIGH }]}>
                <Text style={[clStyles.avatarLetter, { color: palette.text }]}>{initial}</Text>
              </View>
              <View style={clStyles.denseNameCol}>
                <Text style={[clStyles.denseName, { color: palette.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={[clStyles.denseSub, { color: palette.subText }]} numberOfLines={2}>
                  {consultantSubtitle(appointment)}
                </Text>
              </View>
            </View>
            <View style={clStyles.denseTimeCol}>
              <Text style={[clStyles.denseTime, { color: palette.button }]}>
                {dateValid ? formatDisplayTime(d) : '—'}
              </Text>
              <Text style={[clStyles.denseDuration, { color: palette.subText }]}>{dm} mins</Text>
            </View>
          </View>
          <View style={[clStyles.locBar, { backgroundColor: palette.mutedCard }]}>
            <Text style={[clStyles.locIcon, { color: palette.border }]}>◎</Text>
            <Text style={[clStyles.locText, { color: palette.subText }]} numberOfLines={2}>
              {locationLine(appointment)}
            </Text>
          </View>
          <View style={clStyles.actionRow}>
            <TouchableOpacity
              testID={`appointment-row-${appointment.id}-set-2`}
              style={[
                clStyles.actionBtn,
                { backgroundColor: palette.secondaryContainer },
                isStatusActionDisabled(appointment, 2, isMutating) && clStyles.actionBtnDisabled
              ]}
              onPress={() => onUpdateStatus(appointment.id, 2)}
              disabled={isStatusActionDisabled(appointment, 2, isMutating)}
              accessibilityRole="button"
              accessibilityLabel="Approve appointment"
            >
              <Text style={[clStyles.actionBtnText, { color: palette.onSecondaryContainer }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`appointment-row-${appointment.id}-set-3`}
              style={[
                clStyles.actionBtn,
                clStyles.actionBtnOutline,
                {
                  backgroundColor: palette.bottomNav,
                  borderColor: `${palette.outlineVariant}55`
                },
                isStatusActionDisabled(appointment, 3, isMutating) && clStyles.actionBtnDisabled
              ]}
              onPress={() => onUpdateStatus(appointment.id, 3)}
              disabled={isStatusActionDisabled(appointment, 3, isMutating)}
              accessibilityRole="button"
              accessibilityLabel="Complete appointment"
            >
              <Text style={[clStyles.actionBtnText, { color: palette.subText }]}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`appointment-row-${appointment.id}-set-4`}
              style={[
                clStyles.actionBtn,
                { backgroundColor: LIGHT_ERROR_CONTAINER },
                isStatusActionDisabled(appointment, 4, isMutating) && clStyles.actionBtnDisabled
              ]}
              onPress={() => onUpdateStatus(appointment.id, 4)}
              disabled={isStatusActionDisabled(appointment, 4, isMutating)}
              accessibilityRole="button"
              accessibilityLabel="Cancel appointment"
            >
              <Text style={[clStyles.actionBtnText, { color: LIGHT_ON_ERROR_CONTAINER }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (consultantStitchDark) {
      const displayName = customerDisplayName(appointment.customerId);
      const initial = displayName.trim().charAt(0).toUpperCase() || '?';
      const urgent = isConsultantDarkUrgent(appointment);

      if (isAppointmentTerminal(appointment.status)) {
        const endPill = appointment.status === 3 ? 'Archived' : 'Cancelled';
        return (
          <View
            key={appointment.id}
            style={[
              cdStyles.termCard,
              {
                backgroundColor: palette.mutedCard,
                borderColor: palette.outlineVariant
              }
            ]}
          >
            <View style={cdStyles.termRow}>
              <View style={cdStyles.termTextCol}>
                <Text style={[cdStyles.termTitle, { color: palette.subText }]} numberOfLines={2}>
                  {appointmentCardTitle(appointment)}
                </Text>
                <Text style={[cdStyles.termMeta, { color: palette.border }]}>
                  {dateValid ? formatDisplayTime(d) : '—'} •{' '}
                  {appointment.status === 3 ? 'Completed' : 'Cancelled'}
                </Text>
              </View>
              <View style={[cdStyles.termPill, { backgroundColor: palette.elevatedSurface }]}>
                <Text style={[cdStyles.termPillText, { color: palette.border }]}>{endPill}</Text>
              </View>
            </View>
          </View>
        );
      }

      const scheduleLine = consultantDarkScheduleLine(appointment, d, dateValid);
      const badge =
        urgent
          ? { label: 'URGENT', fg: DARK_URGENT_ERROR, bg: 'rgba(147, 0, 10, 0.22)', border: 'rgba(255, 180, 171, 0.35)' }
          : appointment.status === 2
            ? {
                label: 'OPERATIONS',
                fg: TERTIARY_FIXED_DIM,
                bg: 'rgba(255, 210, 161, 0.12)',
                border: 'rgba(255, 210, 161, 0.25)'
              }
            : appointment.id % 2 === 0
              ? {
                  label: 'SENIOR',
                  fg: DARK_PRIMARY_FIXED_DIM,
                  bg: 'rgba(134, 239, 172, 0.1)',
                  border: 'rgba(134, 239, 172, 0.22)'
                }
              : {
                  label: 'OPERATIONS',
                  fg: TERTIARY_FIXED_DIM,
                  bg: 'rgba(255, 210, 161, 0.12)',
                  border: 'rgba(255, 210, 161, 0.25)'
                };

      const cardBorder = urgent ? 'rgba(255, 180, 171, 0.35)' : palette.outlineVariant;

      const actionChip = (
        bg: string,
        fg: string,
        borderW: number,
        borderC: string | undefined,
        label: string,
        onPress: () => void,
        disabled: boolean,
        testID?: string
      ) => (
        <TouchableOpacity
          testID={testID}
          style={[
            cdStyles.chipBtn,
            {
              backgroundColor: bg,
              borderWidth: borderW,
              borderColor: borderC ?? 'transparent'
            },
            disabled && cdStyles.chipBtnDisabled
          ]}
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={[cdStyles.chipBtnText, { color: fg }]}>{label}</Text>
        </TouchableOpacity>
      );

      return (
        <View
          key={appointment.id}
          style={[
            cdStyles.rowCard,
            {
              backgroundColor: palette.mutedCard,
              borderColor: cardBorder
            }
          ]}
        >
          {urgent ? <View style={cdStyles.urgentAccent} /> : null}
          <View style={[cdStyles.rowInner, urgent ? { paddingLeft: 12 } : null]}>
            <View style={cdStyles.rowMain}>
              <View
                style={[
                  cdStyles.rowAvatar,
                  {
                    backgroundColor: palette.imagePlaceholder,
                    borderColor: palette.outlineVariant
                  }
                ]}
              >
                <Text style={[cdStyles.rowAvatarLetter, { color: palette.text }]}>{initial}</Text>
              </View>
              <View style={cdStyles.rowTextBlock}>
                <View style={cdStyles.nameBadgeRow}>
                  <Text style={[cdStyles.rowName, { color: palette.text }]} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <View style={[cdStyles.rolePill, { backgroundColor: badge.bg, borderColor: badge.border, borderWidth: 1 }]}>
                    <Text style={[cdStyles.rolePillText, { color: badge.fg }]}>{badge.label}</Text>
                  </View>
                </View>
                <Text
                  style={[cdStyles.scheduleCaption, { color: urgent ? DARK_URGENT_ERROR : palette.subText }]}
                  numberOfLines={2}
                >
                  {scheduleLine}
                </Text>
              </View>
            </View>
            <View style={cdStyles.rowActions}>
              {appointment.status === 2 ? (
                <>
                  {actionChip(
                    palette.elevatedSurface,
                    DARK_PRIMARY_FIXED_DIM,
                    1,
                    'rgba(115, 219, 154, 0.35)',
                    'Complete',
                    () => onUpdateStatus(appointment.id, 3),
                    isStatusActionDisabled(appointment, 3, isMutating),
                    `appointment-row-${appointment.id}-set-3`
                  )}
                  <TouchableOpacity
                    style={[
                      cdStyles.chipBtn,
                      cdStyles.moreBtn,
                      {
                        backgroundColor: palette.secondaryContainer,
                        borderColor: palette.outlineVariant
                      }
                    ]}
                    onPress={() =>
                      Alert.alert('Appointment', 'Additional actions are not available in this preview yet.')
                    }
                    accessibilityRole="button"
                    accessibilityLabel="More appointment actions"
                  >
                    <Text style={[cdStyles.chipBtnText, { color: palette.onSecondaryContainer }]}>···</Text>
                  </TouchableOpacity>
                </>
              ) : urgent ? (
                <>
                  {actionChip(
                    palette.primaryContainer,
                    palette.onPrimaryContainer,
                    0,
                    undefined,
                    'Approve',
                    () => onUpdateStatus(appointment.id, 2),
                    isStatusActionDisabled(appointment, 2, isMutating),
                    `appointment-row-${appointment.id}-set-2`
                  )}
                  {actionChip(
                    DARK_REJECT_BG,
                    DARK_REJECT_FG,
                    1,
                    'rgba(255, 180, 171, 0.45)',
                    'Reject',
                    () => onUpdateStatus(appointment.id, 4),
                    isStatusActionDisabled(appointment, 4, isMutating),
                    `appointment-row-${appointment.id}-set-4`
                  )}
                </>
              ) : (
                <>
                  {actionChip(
                    palette.primaryContainer,
                    palette.onPrimaryContainer,
                    0,
                    undefined,
                    'Approve',
                    () => onUpdateStatus(appointment.id, 2),
                    isStatusActionDisabled(appointment, 2, isMutating),
                    `appointment-row-${appointment.id}-set-2`
                  )}
                  {actionChip(
                    palette.secondaryContainer,
                    palette.onSecondaryContainer,
                    1,
                    palette.outlineVariant,
                    'Cancel',
                    () => onUpdateStatus(appointment.id, 4),
                    isStatusActionDisabled(appointment, 4, isMutating),
                    `appointment-row-${appointment.id}-set-4`
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      );
    }

    if (customerStitchLight) {
      return (
        <View
          key={appointment.id}
          style={[
            slStyles.apCard,
            {
              backgroundColor: palette.surfaceLowest,
              borderColor: palette.outlineVariant,
              borderLeftWidth: accent ? 4 : StyleSheet.hairlineWidth,
              borderLeftColor: accent ?? palette.outlineVariant,
              opacity: isCancelled ? 0.78 : 1
            }
          ]}
        >
          <View style={slStyles.apHeader}>
            <View style={slStyles.apHeaderText}>
              <Text style={[slStyles.apTitle, { color: palette.text }]} numberOfLines={2}>
                {appointmentCardTitle(appointment)}
              </Text>
              <Text style={[slStyles.apSubtitle, { color: palette.subText }]}>
                {consultantWithLine(appointment.consultantId)}
              </Text>
            </View>
            <View style={[slStyles.apPill, { backgroundColor: pill.bg }]}>
              <Text style={[slStyles.apPillText, { color: pill.fg }]}>
                {appointmentStatusLabels[appointment.status] ?? `Unknown(${appointment.status})`}
              </Text>
            </View>
          </View>
          <View style={slStyles.apMetaRow}>
            <Text style={[slStyles.apMetaItem, { color: palette.subText }]}>
              📅 {dateValid ? formatDisplayDate(d) : '—'}
            </Text>
            {appointment.status !== 4 ? (
              <Text style={[slStyles.apMetaItem, { color: palette.subText }]}>
                🕐 {dateValid ? formatDisplayTime(d) : '—'}
              </Text>
            ) : null}
          </View>
          {appointment.notes?.trim() ? (
            <View style={[slStyles.apNotes, { borderTopColor: palette.outlineVariant }]}>
              <Text style={[slStyles.apNotesText, { color: palette.subText }]} numberOfLines={4}>
                {appointment.notes.trim()}
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (customerStitchDark) {
      const dp = darkCardPillStyle(appointment.status, palette);
      const isCompleted = appointment.status === 3;
      const iconWrap =
        appointment.status === 2
          ? { bg: 'rgba(219, 255, 226, 0.1)', border: 'rgba(219, 255, 226, 0.2)', glyph: '🏭', color: DARK_PRIMARY_FIXED_DIM }
          : appointment.status === 1
            ? { bg: 'rgba(255, 210, 161, 0.1)', border: 'rgba(255, 210, 161, 0.2)', glyph: '📊', color: TERTIARY_FIXED_DIM }
            : isCompleted
              ? { bg: palette.imagePlaceholder, border: palette.outlineVariant, glyph: '📜', color: palette.border }
              : { bg: palette.imagePlaceholder, border: palette.outlineVariant, glyph: '📋', color: palette.border };

      return (
        <View
          key={appointment.id}
          style={[
            darkStyles.listCard,
            {
              backgroundColor: isCompleted ? 'rgba(13, 28, 47, 0.5)' : palette.mutedCard,
              borderColor: palette.outlineVariant,
              opacity: isCompleted ? 0.88 : 1
            }
          ]}
        >
          <View style={darkStyles.listTopRow}>
            <View style={darkStyles.listMain}>
              <View
                style={[
                  darkStyles.iconTile,
                  { backgroundColor: iconWrap.bg, borderColor: iconWrap.border }
                ]}
              >
                <Text style={{ fontSize: 20 }}>{iconWrap.glyph}</Text>
              </View>
              <View style={darkStyles.listTextCol}>
                <Text
                  style={[
                    darkStyles.listTitle,
                    { color: isCompleted ? palette.subText : palette.text }
                  ]}
                  numberOfLines={2}
                >
                  {appointmentCardTitle(appointment)}
                </Text>
                <View style={darkStyles.listMeta}>
                  <Text style={[darkStyles.listMetaTxt, { color: isCompleted ? palette.border : palette.subText }]}>
                    📅 {dateValid ? formatDisplayDate(d) : '—'}
                  </Text>
                  {!isCompleted && appointment.status !== 4 ? (
                    <Text style={[darkStyles.listMetaTxt, { color: palette.subText }]}>
                      🕐 {dateValid ? formatDisplayTime(d) : '—'}
                    </Text>
                  ) : null}
                  {appointment.status !== 4 ? (
                    <Text style={[darkStyles.listMetaTxt, { color: palette.subText }]}>
                      📍 {locationHint(appointment)}
                    </Text>
                  ) : null}
                  {isCompleted ? (
                    <Text style={[darkStyles.listMetaTxt, { color: palette.border }]}>✅ Task Completed</Text>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={darkStyles.listAside}>
              <View style={[darkStyles.listPill, { backgroundColor: dp.bg, borderColor: dp.border, borderWidth: 1 }]}>
                <Text style={[darkStyles.listPillText, { color: dp.fg }]}>{darkStatusLabel(appointment.status)}</Text>
              </View>
              <Text style={[darkStyles.refSmall, { color: palette.border }]}>{`REF: #${tvRef(appointment.id)}`}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View key={appointment.id} style={[legacyStyles.row, { borderColor: palette.border }]}>
        <Text style={[legacyStyles.rowTitle, { color: palette.text }]}>#{appointment.id}</Text>
        <View style={[legacyStyles.statusBadge, { backgroundColor: palette.mutedCard, borderColor: palette.border }]}>
          <Text style={[legacyStyles.statusBadgeLabel, { color: palette.subText }]}>Mevcut durum</Text>
          <Text style={[legacyStyles.statusBadgeValue, { color: palette.text }]}>
            {appointmentStatusLabels[appointment.status] ?? `Unknown(${appointment.status})`}
          </Text>
        </View>
        <Text style={[legacyStyles.rowText, { color: palette.text }]}>
          Tarih: {new Date(appointment.appointmentDate).toLocaleString()}
        </Text>
        {appointment.notes ? <Text style={[legacyStyles.rowText, { color: palette.text }]}>Not: {appointment.notes}</Text> : null}
        {(role === 2 || role === 3) && (
          <>
            <Text style={[legacyStyles.actionsLabel, { color: palette.subText }]}>
              {isAppointmentTerminal(appointment.status)
                ? 'Bu randevu tamamlandi veya iptal edildi; durum degisikligi kapali.'
                : 'Durumu guncelle:'}
            </Text>
            <View style={legacyStyles.filterRow}>
              {([2, 3, 4] as const).map((nextStatus) => {
                const disabled = isStatusActionDisabled(appointment, nextStatus, isMutating);
                return (
                  <TouchableOpacity
                    key={nextStatus}
                    testID={`appointment-row-${appointment.id}-set-${nextStatus}`}
                    style={[
                      legacyStyles.chip,
                      { borderColor: palette.border },
                      appointment.status === nextStatus && { backgroundColor: palette.button },
                      disabled && legacyStyles.chipDisabled
                    ]}
                    onPress={() => onUpdateStatus(appointment.id, nextStatus)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        legacyStyles.chipText,
                        { color: appointment.status === nextStatus ? palette.buttonText : palette.text },
                        disabled && { color: palette.subText }
                      ]}
                    >
                      {appointmentStatusLabels[nextStatus]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={slStyles.root}>
      {consultantStitchLight ? (
        <View style={slStyles.section}>
          <Text style={[clStyles.consultHead, { color: palette.text }]}>Consultant Appointments</Text>
          <Text style={[clStyles.consultSub, { color: palette.subText }]}>
            Manage your daily field operation schedule
          </Text>
          <View style={clStyles.bentoRow}>
            <View
              style={[
                clStyles.bentoTile,
                {
                  backgroundColor: palette.surfaceLowest,
                  borderColor: borderSoft
                }
              ]}
            >
              <View style={clStyles.bentoTop}>
                <Text style={{ fontSize: 18, color: palette.button }}>▣</Text>
                <View style={[clStyles.todayPill, { backgroundColor: LIGHT_PRIMARY_FIXED }]}>
                  <Text style={[clStyles.todayPillText, { color: LIGHT_ON_PRIMARY_FIXED }]}>TODAY</Text>
                </View>
              </View>
              <View>
                <Text style={[clStyles.bentoStat, { color: palette.text }]}>{totalRecords}</Text>
                <Text style={[clStyles.bentoLabel, { color: palette.subText }]}>Total Booked</Text>
              </View>
            </View>
            <View
              style={[
                clStyles.bentoTile,
                {
                  backgroundColor: palette.surfaceLowest,
                  borderColor: borderSoft
                }
              ]}
            >
              <View style={clStyles.bentoTop}>
                <Text style={{ fontSize: 18, color: PENDING_BORDER }}>!</Text>
              </View>
              <View>
                <Text style={[clStyles.bentoStat, { color: palette.text }]}>{pendingTotal}</Text>
                <Text style={[clStyles.bentoLabel, { color: palette.subText }]}>Pending Approval</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {consultantStitchDark ? (
        <View style={slStyles.section}>
          <View style={cdStyles.bentoStack}>
            <View
              style={[
                cdStyles.bentoHero,
                {
                  backgroundColor: palette.mutedCard,
                  borderColor: palette.outlineVariant
                }
              ]}
            >
              <View style={cdStyles.bentoHeroTop}>
                <Text style={[cdStyles.bentoKicker, { color: palette.border }]}>DAILY OVERVIEW</Text>
                <Text style={{ fontSize: 16, color: DARK_PRIMARY_FIXED_DIM }}>◉</Text>
              </View>
              <View>
                <Text style={[cdStyles.bentoHeadline, { color: palette.text }]}>{`${totalRecords} Scheduled`}</Text>
                <Text style={[cdStyles.bentoSubline, { color: DARK_PRIMARY_FIXED_DIM }]}>
                  {`${pendingTotal} Pending Approval`}
                </Text>
              </View>
            </View>
            <View style={cdStyles.bentoPair}>
              <View
                style={[
                  cdStyles.bentoStatTile,
                  {
                    backgroundColor: palette.mutedCard,
                    borderColor: palette.outlineVariant
                  }
                ]}
              >
                <Text style={{ fontSize: 16, color: TERTIARY_FIXED_DIM }}>⏱</Text>
                <Text style={[cdStyles.bentoStatLabel, { color: palette.border }]}>AVG DURATION</Text>
                <Text style={[cdStyles.bentoStatValue, { color: palette.text }]}>{`${avgDurationMins}m`}</Text>
              </View>
              <View
                style={[
                  cdStyles.bentoStatTile,
                  {
                    backgroundColor: palette.mutedCard,
                    borderColor: palette.outlineVariant
                  }
                ]}
              >
                <Text style={{ fontSize: 16, color: palette.primaryContainer }}>✓</Text>
                <Text style={[cdStyles.bentoStatLabel, { color: palette.border }]}>COMPLETED</Text>
                <Text style={[cdStyles.bentoStatValue, { color: palette.text }]}>{completedTotal}</Text>
              </View>
            </View>
          </View>
          <View style={cdStyles.listHeadRow}>
            <Text style={[cdStyles.listHeadTitle, { color: palette.text }]}>Consultant Appointments</Text>
            <View style={cdStyles.listHeadActions}>
              <TouchableOpacity
                style={[cdStyles.iconBtn, { backgroundColor: palette.elevatedSurface }]}
                onPress={() => Alert.alert('Filters', 'Use the status chips below to refine this list.')}
                accessibilityRole="button"
                accessibilityLabel="Open filters"
              >
                <Text style={{ color: palette.subText, fontSize: 18 }}>≡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cdStyles.iconBtn, { backgroundColor: palette.elevatedSurface }]}
                onPress={() => Alert.alert('Calendar', 'Calendar scheduling is not connected in this preview yet.')}
                accessibilityRole="button"
                accessibilityLabel="Open calendar"
              >
                <Text style={{ color: palette.subText, fontSize: 16 }}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {!customerStitchLight && !customerStitchDark && !consultantStitchLight && !consultantStitchDark ? (
        <>
          <Text style={[legacyStyles.title, { color: palette.text }]}>My Appointments</Text>
          <Text style={[legacyStyles.roleLabel, { color: palette.subText }]}>Role: {getRoleLabel(role)}</Text>
        </>
      ) : null}

      {role === 1 && customerStitchDark ? (
        <>
          <View style={[darkStyles.hero, { backgroundColor: palette.card, borderColor: `${palette.outlineVariant}55` }]}>
            <View style={darkStyles.heroTint} />
            <View style={darkStyles.heroTextBlock}>
              <Text style={[darkStyles.heroTitle, { color: DARK_PRIMARY_FIXED_DIM }]}>Service Appointments</Text>
              <Text style={[darkStyles.heroBody, { color: palette.subText }]}>
                Schedule and track your equipment inspections and field visits.
              </Text>
            </View>
          </View>

          <View style={[darkStyles.bookCard, { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }]}>
            <View style={darkStyles.bookHeader}>
              <Text style={{ fontSize: 20, color: DARK_PRIMARY_FIXED_DIM, fontWeight: '300' }}>+</Text>
              <Text style={[darkStyles.bookTitle, { color: palette.text }]}>Book Visit</Text>
            </View>
            <Text style={[darkStyles.darkLabel, { color: palette.subText }]}>Service Type</Text>
            <View style={[darkStyles.pickerShell, { borderColor: palette.outlineVariant, backgroundColor: palette.card }]}>
              <Picker
                selectedValue={darkServiceKey}
                onValueChange={(key) => {
                  const row = SERVICE_OPTIONS.find((s) => s.key === key);
                  setDarkServiceKey(key);
                  if (row) onConsultantIdChange(String(row.consultantId));
                }}
                dropdownIconColor={palette.border}
                style={[slStyles.picker, { color: palette.text }]}
              >
                {SERVICE_OPTIONS.map((o) => (
                  <Picker.Item key={o.key} label={o.label} value={o.key} color={palette.text} />
                ))}
              </Picker>
            </View>
            <View style={slStyles.dateTimeRow}>
              <View style={slStyles.dateTimeCol}>
                <Text style={[darkStyles.darkLabel, { color: palette.subText }]}>Date</Text>
                <TouchableOpacity
                  style={[darkStyles.darkField, { borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
                  onPress={toggleStitchDatePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Select appointment date"
                >
                  <Text style={[slStyles.fieldBtnText, { color: palette.text }]}>
                    {isValidIso(appointmentDateInput) ? formatDisplayDate(pickerValue) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={slStyles.dateTimeCol}>
                <Text style={[darkStyles.darkLabel, { color: palette.subText }]}>Time Slot</Text>
                <TouchableOpacity
                  style={[darkStyles.darkField, { borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
                  onPress={toggleStitchTimePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Select appointment time"
                >
                  <Text style={[slStyles.fieldBtnText, { color: palette.text }]}>
                    {isValidIso(appointmentDateInput) ? formatDisplayTime(pickerValue) : 'Select time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {stitchPicker ? (
              <>
                <DateTimePicker
                  value={pickerValue}
                  mode={stitchPicker}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onStitchPickerChange}
                />
                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    style={[slStyles.iosDone, { borderColor: palette.outlineVariant }]}
                    onPress={() => setStitchPicker(null)}
                  >
                    <Text style={[slStyles.iosDoneText, { color: palette.text }]}>Done</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}
            <Text style={[darkStyles.darkLabel, { color: palette.subText }]}>Location Details</Text>
            <TextInput
              style={[
                darkStyles.darkTextArea,
                { borderColor: palette.outlineVariant, color: palette.text, backgroundColor: palette.card }
              ]}
              value={appointmentNotesInput}
              onChangeText={onAppointmentNotesChange}
              placeholder="Enter sector or unit ID..."
              placeholderTextColor={palette.subText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {appointmentErrorMessage ? <StateMessage tone="error" text={appointmentErrorMessage} /> : null}
            {appointmentSuccessMessage ? <StateMessage text={appointmentSuccessMessage} color={palette.subText} /> : null}
            <TouchableOpacity
              style={[
                darkStyles.createPill,
                isMutating && slStyles.submitBtnDisabled,
                { backgroundColor: palette.primaryContainer }
              ]}
              onPress={onCreateAppointment}
              disabled={isMutating}
              accessibilityRole="button"
              accessibilityLabel="Create appointment"
            >
              <Text style={[darkStyles.createPillText, { color: palette.onPrimaryContainer }]}>
                {isMutating ? 'Creating…' : 'Create Appointment'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {role === 1 && customerStitchLight ? (
        <View style={slStyles.section}>
          <Text style={[slStyles.sectionTitle, { color: palette.text }]}>New Appointment</Text>
          <View
            style={[
              slStyles.formCard,
              {
                backgroundColor: palette.surfaceLowest,
                borderColor: borderSoft,
                shadowColor: '#000'
              }
            ]}
          >
            <Text style={[slStyles.inputLabel, { color: palette.subText }]}>Select Consultant</Text>
            <View style={[slStyles.pickerWrap, { borderColor: palette.border, backgroundColor: palette.card }]}>
              <Picker
                selectedValue={String(Number(consultantIdInput) || 2)}
                onValueChange={(v) => onConsultantIdChange(String(v))}
                style={slStyles.picker}
                dropdownIconColor={palette.border}
              >
                {CONSULTANT_OPTIONS.map((o) => (
                  <Picker.Item key={o.id} label={o.label} value={String(o.id)} />
                ))}
              </Picker>
            </View>

            <View style={slStyles.dateTimeRow}>
              <View style={slStyles.dateTimeCol}>
                <Text style={[slStyles.inputLabel, { color: palette.subText }]}>Date</Text>
                <TouchableOpacity
                  style={[slStyles.fieldBtn, { borderColor: palette.border, backgroundColor: palette.card }]}
                  onPress={toggleStitchDatePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Select appointment date"
                >
                  <Text style={[slStyles.fieldBtnText, { color: palette.text }]}>
                    {isValidIso(appointmentDateInput) ? formatDisplayDate(pickerValue) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={slStyles.dateTimeCol}>
                <Text style={[slStyles.inputLabel, { color: palette.subText }]}>Time</Text>
                <TouchableOpacity
                  style={[slStyles.fieldBtn, { borderColor: palette.border, backgroundColor: palette.card }]}
                  onPress={toggleStitchTimePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Select appointment time"
                >
                  <Text style={[slStyles.fieldBtnText, { color: palette.text }]}>
                    {isValidIso(appointmentDateInput) ? formatDisplayTime(pickerValue) : 'Select time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {stitchPicker ? (
              <>
                <DateTimePicker
                  value={pickerValue}
                  mode={stitchPicker}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onStitchPickerChange}
                />
                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    style={[slStyles.iosDone, { borderColor: palette.outlineVariant }]}
                    onPress={() => setStitchPicker(null)}
                  >
                    <Text style={[slStyles.iosDoneText, { color: palette.text }]}>Done</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}

            <Text style={[slStyles.inputLabel, { color: palette.subText, marginTop: 4 }]}>Consultation Notes</Text>
            <TextInput
              style={[
                slStyles.textArea,
                { borderColor: palette.border, color: palette.text, backgroundColor: palette.card }
              ]}
              value={appointmentNotesInput}
              onChangeText={onAppointmentNotesChange}
              placeholder="Briefly describe your requirements..."
              placeholderTextColor={palette.subText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {appointmentErrorMessage ? <StateMessage tone="error" text={appointmentErrorMessage} /> : null}
            {appointmentSuccessMessage ? <StateMessage text={appointmentSuccessMessage} color={palette.subText} /> : null}
            <TouchableOpacity
              style={[
                slStyles.submitBtn,
                isMutating && slStyles.submitBtnDisabled,
                { backgroundColor: palette.button }
              ]}
              onPress={onCreateAppointment}
              disabled={isMutating}
              accessibilityRole="button"
              accessibilityLabel="Schedule appointment"
            >
              <Text style={[slStyles.submitBtnText, { color: palette.buttonText }]}>
                {isMutating ? 'Scheduling…' : 'Schedule Appointment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {role !== 1 && !consultantStitchLight && !consultantStitchDark ? (
        <View style={[legacyStyles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <StateMessage
            text="Bu rolde yeni randevu olusturma devre disi; mevcut randevularinizi asagida goruntuleyebilirsiniz."
            color={palette.subText}
          />
        </View>
      ) : null}

      {stitchLight ? (
        <View style={slStyles.section}>
          {renderFilters(true)}
        </View>
      ) : customerStitchDark || consultantStitchDark ? (
        <View style={slStyles.section}>{renderDarkFilters()}</View>
      ) : (
        <View style={[legacyStyles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[legacyStyles.formTitle, { color: palette.text }]}>Filter By Status</Text>
          {renderFilters(false)}
        </View>
      )}

      {stitchLight || customerStitchDark || consultantStitchDark ? (
        <View style={slStyles.section}>
          {stitchLight && !customerStitchDark && !consultantStitchLight && !consultantStitchDark ? (
            <Text style={[slStyles.sectionTitle, { color: palette.text }]}>Upcoming Appointments</Text>
          ) : null}
          {isLoading ? (
            <StateMessage text="Randevular yukleniyor..." color={palette.subText} />
          ) : errorMessage ? (
            <StateMessage tone="error" text={errorMessage} />
          ) : appointments.length === 0 ? (
            <StateMessage text="Henuz randevu bulunmuyor." color={palette.subText} />
          ) : (
            <View style={slStyles.apList}>{appointments.map(renderAppointmentRow)}</View>
          )}
          {consultantStitchDark && !isLoading && !errorMessage && appointments.length > 0 ? (
            <View
              style={[
                cdStyles.tailEmpty,
                {
                  borderColor: palette.outlineVariant,
                  backgroundColor: palette.mutedCard
                }
              ]}
            >
              <Text style={{ fontSize: 40, color: palette.outlineVariant, marginBottom: 8 }}>◷</Text>
              <Text style={[cdStyles.tailEmptyText, { color: palette.subText }]}>
                No further appointments for today.
              </Text>
              <TouchableOpacity
                style={cdStyles.tailLink}
                onPress={() => Alert.alert('Schedule', "Tomorrow's schedule is not loaded in this preview yet.")}
                accessibilityRole="button"
                accessibilityLabel="View tomorrow schedule"
              >
                <Text style={[cdStyles.tailLinkText, { color: DARK_PRIMARY_FIXED_DIM }]}>View tomorrow's schedule</Text>
                <Text style={{ color: DARK_PRIMARY_FIXED_DIM, fontSize: 14 }}>→</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {customerStitchDark && appointments.length > 0 ? (
            <View style={[darkStyles.listFooter, { borderTopColor: palette.outlineVariant }]}>
              <Text style={[darkStyles.listFooterText, { color: palette.border }]}>
                Showing most recent {appointments.length} of {totalRecords} appointments
              </Text>
              <TouchableOpacity
                style={darkStyles.loadMoreBtn}
                onPress={() => Alert.alert('History', 'Full appointment history is not loaded in the mobile preview yet.')}
                accessibilityRole="button"
                accessibilityLabel="Load full appointment history"
              >
                <Text style={[darkStyles.loadMoreText, { color: DARK_PRIMARY_FIXED_DIM }]}>Load full history</Text>
                <Text style={{ color: DARK_PRIMARY_FIXED_DIM, fontSize: 16 }}>↓</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[legacyStyles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {isLoading ? (
            <StateMessage text="Randevular yukleniyor..." />
          ) : errorMessage ? (
            <StateMessage tone="error" text={errorMessage} />
          ) : appointments.length === 0 ? (
            <StateMessage text="Henuz randevu bulunmuyor." />
          ) : (
            appointments.map(renderAppointmentRow)
          )}
        </View>
      )}
    </View>
  );
}

const darkStyles = StyleSheet.create({
  hero: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative'
  },
  heroTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(115, 219, 154, 0.06)'
  },
  heroTextBlock: { maxWidth: 320, zIndex: 2 },
  heroTitle: { fontSize: 22, fontWeight: '600', lineHeight: 28, letterSpacing: -0.3, marginBottom: 8 },
  heroBody: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bookCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    gap: 2
  },
  bookHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  bookTitle: { fontSize: 17, fontWeight: '600', lineHeight: 24 },
  darkLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.02, marginBottom: 8, marginTop: 6 },
  pickerShell: { borderWidth: 1, borderRadius: 8, marginBottom: 8, overflow: 'hidden' },
  darkField: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 46,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  darkTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 88,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20
  },
  createPill: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  createPillText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.02 },
  filterScroll: { marginBottom: 8 },
  filterScrollContent: { flexDirection: 'row', gap: 10, paddingBottom: 4, alignItems: 'center' },
  filterChip: { borderRadius: 999, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14 },
  filterChipInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  filterBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  filterBadgeText: { fontSize: 10, fontWeight: '700' },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12
  },
  listTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  listMain: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', flex: 1 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listTextCol: { flex: 1 },
  listTitle: { fontSize: 17, fontWeight: '600', lineHeight: 24, marginBottom: 6 },
  listMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  listMetaTxt: { fontSize: 12, fontWeight: '500' },
  listAside: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  listPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  listPillText: { fontSize: 11, fontWeight: '600' },
  refSmall: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  listFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center'
  },
  listFooterText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  loadMoreText: { fontSize: 12, fontWeight: '600' }
});

const clStyles = StyleSheet.create({
  consultHead: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1, marginBottom: 4 },
  consultSub: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.01, marginBottom: 16 },
  bentoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bentoTile: {
    flex: 1,
    minHeight: 112,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  bentoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  todayPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  todayPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.02 },
  bentoStat: { fontSize: 24, fontWeight: '600', lineHeight: 32, letterSpacing: -0.2 },
  bentoLabel: { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.01, marginTop: 2 },
  denseCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  denseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  densePerson: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarLetter: { fontSize: 16, fontWeight: '700' },
  denseNameCol: { flex: 1 },
  denseName: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  denseSub: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.01, marginTop: 2 },
  denseTimeCol: { alignItems: 'flex-end' },
  denseTime: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  denseDuration: { fontSize: 12, lineHeight: 16, fontStyle: 'italic', marginTop: 2 },
  locBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 12
  },
  locIcon: { fontSize: 14, width: 18, textAlign: 'center' },
  locText: { flex: 1, fontSize: 14, lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 4, alignItems: 'stretch' },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  actionBtnOutline: { borderWidth: 1 },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  archivedCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    opacity: 0.75,
    borderLeftWidth: 4
  },
  archivedInner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  archivedLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  archivedGlyph: { fontSize: 18, width: 22, textAlign: 'center' },
  archivedTextCol: { flex: 1 },
  archivedTitle: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  archivedMeta: { fontSize: 12, lineHeight: 16, fontWeight: '500', marginTop: 2 },
  archivedPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  archivedPillText: { fontSize: 12, fontWeight: '500' }
});

const cdStyles = StyleSheet.create({
  bentoStack: { gap: 12, marginBottom: 8 },
  bentoHero: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 112,
    justifyContent: 'space-between'
  },
  bentoHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bentoKicker: { fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.6 },
  bentoHeadline: { fontSize: 22, fontWeight: '600', lineHeight: 28, letterSpacing: -0.2, marginTop: 4 },
  bentoSubline: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 4, letterSpacing: 0.02 },
  bentoPair: { flexDirection: 'row', gap: 12 },
  bentoStatTile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  bentoStatLabel: { fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.5, marginTop: 4 },
  bentoStatValue: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1, marginTop: 2 },
  listHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4
  },
  listHeadTitle: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1, flex: 1, marginRight: 12 },
  listHeadActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  urgentAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#ffb4ab'
  },
  rowInner: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14
  },
  rowMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 220 },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  rowAvatarLetter: { fontSize: 18, fontWeight: '700' },
  rowTextBlock: { flex: 1 },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  rowName: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  rolePillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  scheduleCaption: { fontSize: 13, fontWeight: '500', lineHeight: 18, letterSpacing: 0.02 },
  rowActions: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipBtnDisabled: { opacity: 0.45 },
  chipBtnText: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  moreBtn: { minWidth: 44, paddingHorizontal: 12 },
  termCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    opacity: 0.82,
    padding: 14
  },
  termRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  termTextCol: { flex: 1 },
  termTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  termMeta: { fontSize: 12, fontWeight: '500', lineHeight: 16, marginTop: 4 },
  termPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  termPillText: { fontSize: 12, fontWeight: '600' },
  tailEmpty: {
    marginTop: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    opacity: 0.72
  },
  tailEmptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  tailLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  tailLinkText: { fontSize: 12, fontWeight: '600', lineHeight: 16 }
});

const slStyles = StyleSheet.create({
  root: { marginBottom: 8 },
  section: { marginTop: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', lineHeight: 24, letterSpacing: -0.1, marginBottom: 12 },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  inputLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 0.01, marginBottom: 6 },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 14,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center'
  },
  picker: { width: '100%' },
  dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  dateTimeCol: { flex: 1 },
  fieldBtn: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  fieldBtnText: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 88,
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 22
  },
  iosDone: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 4
  },
  iosDoneText: { fontWeight: '600' },
  submitBtn: {
    marginTop: 4,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: { fontSize: 14, fontWeight: '600' },
  filterScroll: { marginBottom: 4 },
  filterScrollContent: { flexDirection: 'row', gap: 8, paddingBottom: 6, alignItems: 'center' },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterChipH: { marginRight: 0 },
  filterChipWrap: {},
  filterChipText: { fontSize: 12, fontWeight: '500', letterSpacing: 0.01 },
  apList: { gap: 12 },
  apCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  apHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  apHeaderText: { flex: 1, marginRight: 10 },
  apTitle: { fontSize: 17, fontWeight: '600', lineHeight: 24 },
  apSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  apPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  apPillText: { fontSize: 12, fontWeight: '500' },
  apMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  apMetaItem: { fontSize: 12, fontWeight: '500' },
  apNotes: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  apNotesText: { fontSize: 14, lineHeight: 20 },
  actionsLabel: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 8 },
  consultantChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniChip: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  miniChipDisabled: { opacity: 0.45 },
  miniChipText: { fontSize: 12, fontWeight: '600' }
});

const legacyStyles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  roleLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 8, backgroundColor: 'transparent' },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  dateTrigger: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  dateTriggerText: { fontSize: 15, fontWeight: '600' },
  dateTriggerHint: { fontSize: 12, marginTop: 4 },
  secondaryAction: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8 },
  secondaryActionText: { fontWeight: '600' },
  button: { marginTop: 6, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontWeight: '700', textAlign: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  chipDisabled: { opacity: 0.45 },
  chipText: { fontSize: 12, fontWeight: '600' },
  row: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  rowTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  rowText: { fontSize: 13, marginBottom: 3 },
  statusBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  statusBadgeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  statusBadgeValue: { fontSize: 15, fontWeight: '800' },
  actionsLabel: { fontSize: 12, fontWeight: '600', marginTop: 6, marginBottom: 6 }
});
