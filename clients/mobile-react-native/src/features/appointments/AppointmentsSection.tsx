import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppointmentDto, AppointmentStatus } from '../../types/appointment';
import { StateMessage } from '../../ui/StateMessage';

const appointmentStatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Completed',
  4: 'Cancelled'
};

type Props = {
  appointments: AppointmentDto[];
  role: number | null;
  palette: {
    card: string;
    text: string;
    subText: string;
    border: string;
    button: string;
    buttonText: string;
    mutedCard: string;
  };
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

function formatAppointmentDateLabel(iso: string): string {
  if (!iso.trim()) {
    return 'Tarih ve saat secin';
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return 'Gecersiz tarih — tekrar secin';
  }
  return parsed.toLocaleString();
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

export function AppointmentsSection({
  appointments,
  role,
  palette,
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
  onCreateAppointment
}: Props): React.JSX.Element {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerValue = useMemo(() => parseAppointmentDateInput(appointmentDateInput), [appointmentDateInput]);

  const onDatePickerChange = (event: { type?: string }, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      onAppointmentDateChange(selectedDate.toISOString());
    }
  };

  return (
    <>
      <Text style={[styles.title, { color: palette.text }]}>My Appointments</Text>
      <Text style={[styles.roleLabel, { color: palette.subText }]}>Role: {getRoleLabel(role)}</Text>
      {role === 1 && (
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.formTitle, { color: palette.text }]}>Create Appointment</Text>
          <TextInput
            style={[styles.input, { borderColor: palette.border, color: palette.text }]}
            value={consultantIdInput}
            onChangeText={onConsultantIdChange}
            keyboardType="number-pad"
            placeholder="Consultant ID"
            placeholderTextColor={palette.subText}
          />
          <Text style={[styles.fieldLabel, { color: palette.subText }]}>Randevu tarihi ve saati</Text>
          <TouchableOpacity
            style={[styles.dateTrigger, { borderColor: palette.border, backgroundColor: palette.mutedCard }]}
            onPress={() => setShowDatePicker((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Open date and time picker"
          >
            <Text style={[styles.dateTriggerText, { color: palette.text }]}>{formatAppointmentDateLabel(appointmentDateInput)}</Text>
            <Text style={[styles.dateTriggerHint, { color: palette.subText }]}>{showDatePicker ? 'Seciciyi gizle' : 'Secmek icin dokunun'}</Text>
          </TouchableOpacity>
          {showDatePicker ? (
            <>
              <DateTimePicker
                value={pickerValue}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDatePickerChange}
              />
              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  style={[styles.secondaryAction, { borderColor: palette.border }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={[styles.secondaryActionText, { color: palette.text }]}>Tamam</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}
          <TextInput
            style={[styles.input, styles.notesInput, { borderColor: palette.border, color: palette.text }]}
            value={appointmentNotesInput}
            onChangeText={onAppointmentNotesChange}
            placeholder="Notes (optional)"
            placeholderTextColor={palette.subText}
            multiline
          />
          {appointmentErrorMessage ? <StateMessage tone="error" text={appointmentErrorMessage} /> : null}
          {appointmentSuccessMessage ? <StateMessage text={appointmentSuccessMessage} color={palette.subText} /> : null}
          <TouchableOpacity
            style={[styles.button, isMutating && styles.buttonDisabled, { backgroundColor: palette.button }]}
            onPress={onCreateAppointment}
            disabled={isMutating}
          >
            <Text style={[styles.buttonText, { color: palette.buttonText }]}>{isMutating ? 'Creating...' : 'Create Appointment'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {role !== 1 && (
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <StateMessage
            text="Bu rolde yeni randevu olusturma devre disi; mevcut randevularinizi asagida goruntuleyebilirsiniz."
            color={palette.subText}
          />
        </View>
      )}
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.formTitle, { color: palette.text }]}>Filter By Status</Text>
        <View style={styles.filterRow}>
          {(['all', 1, 2, 3, 4] as const).map((status) => (
            <TouchableOpacity
              key={String(status)}
              style={[styles.chip, { borderColor: palette.border }, appointmentFilterStatus === status && { backgroundColor: palette.button }]}
              onPress={() => onAppointmentFilterChange(status)}
            >
              <Text style={[styles.chipText, { color: appointmentFilterStatus === status ? palette.buttonText : palette.text }]}>
                {status === 'all' ? 'All' : appointmentStatusLabels[status]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {isLoading ? (
          <StateMessage text="Randevular yukleniyor..." />
        ) : errorMessage ? (
          <StateMessage tone="error" text={errorMessage} />
        ) : appointments.length === 0 ? (
          <StateMessage text="Henuz randevu bulunmuyor." />
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={[styles.row, { borderColor: palette.border }]}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>#{appointment.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: palette.mutedCard, borderColor: palette.border }]}>
                <Text style={[styles.statusBadgeLabel, { color: palette.subText }]}>Mevcut durum</Text>
                <Text style={[styles.statusBadgeValue, { color: palette.text }]}>
                  {appointmentStatusLabels[appointment.status] ?? `Unknown(${appointment.status})`}
                </Text>
              </View>
              <Text style={[styles.rowText, { color: palette.text }]}>
                Tarih: {new Date(appointment.appointmentDate).toLocaleString()}
              </Text>
              {appointment.notes ? <Text style={[styles.rowText, { color: palette.text }]}>Not: {appointment.notes}</Text> : null}
              {(role === 2 || role === 3) && (
                <>
                  <Text style={[styles.actionsLabel, { color: palette.subText }]}>
                    {isAppointmentTerminal(appointment.status)
                      ? 'Bu randevu tamamlandi veya iptal edildi; durum degisikligi kapali.'
                      : 'Durumu guncelle:'}
                  </Text>
                  <View style={styles.filterRow}>
                    {([2, 3, 4] as const).map((nextStatus) => {
                      const disabled = isStatusActionDisabled(appointment, nextStatus, isMutating);
                      return (
                        <TouchableOpacity
                          key={nextStatus}
                          testID={`appointment-row-${appointment.id}-set-${nextStatus}`}
                          style={[
                            styles.chip,
                            { borderColor: palette.border },
                            appointment.status === nextStatus && { backgroundColor: palette.button },
                            disabled && styles.chipDisabled
                          ]}
                          onPress={() => onUpdateStatus(appointment.id, nextStatus)}
                          disabled={disabled}
                        >
                          <Text
                            style={[
                              styles.chipText,
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
          ))
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
