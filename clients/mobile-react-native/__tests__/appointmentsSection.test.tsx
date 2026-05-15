import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppointmentsSection } from '../src/features/appointments/AppointmentsSection';
import { AppointmentDto } from '../src/types/appointment';
import { getPalette } from '../src/theme/mobileTheme';

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const Picker = (props: Record<string, unknown>) => React.createElement('Picker', props, props.children);
  (Picker as { Item?: unknown }).Item = () => null;
  return { Picker };
});

jest.mock('react-native', () => ({
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  ScrollView: 'ScrollView',
  Platform: { OS: 'ios' },
  StyleSheet: { create: <T,>(styles: T) => styles, hairlineWidth: 1 }
}));

const palette = getPalette('light');

const sampleAppointments: AppointmentDto[] = [
  {
    id: 301,
    customerId: 10,
    consultantId: 2,
    appointmentDate: '2026-06-01T10:00:00Z',
    notes: 'sample',
    status: 1
  }
];

function renderSection(overrides?: Partial<React.ComponentProps<typeof AppointmentsSection>>) {
  const props: React.ComponentProps<typeof AppointmentsSection> = {
    appointments: sampleAppointments,
    role: 1,
    palette,
    themeMode: 'light',
    isLoading: false,
    errorMessage: null,
    isMutating: false,
    consultantIdInput: '2',
    appointmentDateInput: '2026-06-01T10:00:00Z',
    appointmentNotesInput: '',
    appointmentFilterStatus: 'all',
    appointmentErrorMessage: null,
    appointmentSuccessMessage: null,
    onConsultantIdChange: jest.fn(),
    onAppointmentDateChange: jest.fn(),
    onAppointmentNotesChange: jest.fn(),
    onAppointmentFilterChange: jest.fn(),
    onCreateAppointment: jest.fn(),
    onUpdateStatus: jest.fn(),
    ...overrides
  };

  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<AppointmentsSection {...props} />);
  });
  return { tree, props };
}

describe('AppointmentsSection', () => {
  it('shows stitch create form for customer role and hides it for consultant role', () => {
    const customer = renderSection({ role: 1 });
    const customerTextDump = customer.tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(customerTextDump).toContain('New Appointment');
    expect(customerTextDump).toContain('Schedule Appointment');
    expect(customerTextDump).toContain('Date');
    expect(customerTextDump).toContain('Time');
    expect(customerTextDump).not.toContain('Role:');
    customer.tree.unmount();

    const consultant = renderSection({ role: 2, pendingAppointmentsCount: 1 });
    const consultantTextDump = consultant.tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(consultantTextDump).not.toContain('New Appointment');
    expect(consultantTextDump).toContain('Consultant Appointments');
    expect(consultantTextDump).toContain('Manage your daily field operation schedule');
    expect(consultantTextDump).toContain('Total Booked');
    expect(consultantTextDump).toContain('Pending Approval');
    expect(consultantTextDump).not.toContain('devre disi');
    consultant.tree.unmount();
  });

  it('toggles date picker visibility when date field is pressed', () => {
    const { tree } = renderSection({ role: 1, appointmentDateInput: '' });
    const dateTrigger = tree.root.findAll(
      (node) => node.props?.accessibilityLabel === 'Select appointment date'
    )[0];
    expect(dateTrigger).toBeDefined();

    act(() => {
      dateTrigger.props.onPress();
    });
    expect(tree.root.findAllByType('DateTimePicker' as any).length).toBe(1);

    act(() => {
      dateTrigger.props.onPress();
    });
    expect(tree.root.findAllByType('DateTimePicker' as any).length).toBe(0);
    tree.unmount();
  });

  it('fires filter callback when status chip is pressed', () => {
    const onAppointmentFilterChange = jest.fn();
    const { tree } = renderSection({ role: 1, onAppointmentFilterChange });

    const touchables = tree.root.findAll((node) => node.props && typeof node.props.onPress === 'function');
    const approvedFilterChip = touchables.find((node) => {
      const textDump = node.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
      return textDump.includes('Approved');
    });

    expect(approvedFilterChip).toBeDefined();
    act(() => {
      approvedFilterChip!.props.onPress();
    });
    expect(onAppointmentFilterChange).toHaveBeenCalledWith(2);
    tree.unmount();
  });

  it('fires update status callback for consultant row action when target is enabled', () => {
    const onUpdateStatus = jest.fn();
    const { tree } = renderSection({ role: 2, onUpdateStatus });

    const touchables = tree.root.findAll((node) => node.props && typeof node.props.onPress === 'function');
    const completeBtn = touchables.find((node) => node.props?.testID === 'appointment-row-301-set-3');
    expect(completeBtn).toBeDefined();
    expect(completeBtn!.props.disabled).not.toBe(true);

    act(() => {
      completeBtn!.props.onPress();
    });
    expect(onUpdateStatus).toHaveBeenCalledWith(301, 3);
    tree.unmount();
  });

  it('does not render legacy status chips when appointment is completed on consultant dark', () => {
    const onUpdateStatus = jest.fn();
    const completedAppointment: AppointmentDto = { ...sampleAppointments[0], status: 3 };
    const darkPalette = getPalette('dark');
    const { tree } = renderSection({
      role: 2,
      themeMode: 'dark',
      palette: darkPalette,
      appointments: [completedAppointment],
      onUpdateStatus
    });

    const rowChips = tree.root.findAll(
      (node) => typeof node.props?.testID === 'string' && node.props.testID.startsWith('appointment-row-301-set-')
    );
    expect(rowChips).toHaveLength(0);
    tree.unmount();
  });

  it('shows loading message while appointments are loading', () => {
    const { tree } = renderSection({ isLoading: true, appointments: [] });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('Randevular yukleniyor');
    tree.unmount();
  });

  it('shows error message when list query failed', () => {
    const { tree } = renderSection({ isLoading: false, errorMessage: 'Ag hatasi', appointments: [] });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('Ag hatasi');
    tree.unmount();
  });

  it('shows empty state when there are no appointments', () => {
    const { tree } = renderSection({ isLoading: false, errorMessage: null, appointments: [] });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('Henuz randevu bulunmuyor');
    tree.unmount();
  });

  it('shows select date hint when appointment date string is not parseable', () => {
    const { tree } = renderSection({ role: 1, appointmentDateInput: 'not-a-valid-iso' });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('Select date');
    tree.unmount();
  });

  it('renders controller validation message under the create form', () => {
    const { tree } = renderSection({
      role: 1,
      appointmentErrorMessage: 'Gecerli bir consultant ID girin.'
    });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('Gecerli bir consultant ID girin.');
    tree.unmount();
  });

  it('renders Stitch dark customer hero and book visit form', () => {
    const darkPalette = getPalette('dark');
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <AppointmentsSection
          appointments={sampleAppointments}
          role={1}
          palette={darkPalette}
          themeMode="dark"
          isLoading={false}
          errorMessage={null}
          isMutating={false}
          consultantIdInput="2"
          appointmentDateInput="2026-06-01T10:00:00Z"
          appointmentNotesInput=""
          appointmentFilterStatus="all"
          appointmentErrorMessage={null}
          appointmentSuccessMessage={null}
          onConsultantIdChange={jest.fn()}
          onAppointmentDateChange={jest.fn()}
          onAppointmentNotesChange={jest.fn()}
          onAppointmentFilterChange={jest.fn()}
          onCreateAppointment={jest.fn()}
          onUpdateStatus={jest.fn()}
          totalAppointmentsCount={12}
        />
      );
    });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('Service Appointments');
    expect(textDump).toContain('Book Visit');
    expect(textDump).toContain('All Records');
    expect(textDump).toContain('12');
    tree.unmount();
  });

  it('renders Stitch dark consultant dashboard header and bento stats', () => {
    const darkPalette = getPalette('dark');
    const { tree } = renderSection({
      role: 2,
      themeMode: 'dark',
      palette: darkPalette,
      appointments: sampleAppointments,
      totalAppointmentsCount: 12,
      pendingAppointmentsCount: 4,
      completedAppointmentsCount: 8,
      averageAppointmentDurationMins: 45
    });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('DAILY OVERVIEW');
    expect(textDump).toContain('12 Scheduled');
    expect(textDump).toContain('4 Pending Approval');
    expect(textDump).toContain('AVG DURATION');
    expect(textDump).toContain('45m');
    expect(textDump).toContain('COMPLETED');
    expect(textDump).toContain('8');
    expect(textDump).toContain('Consultant Appointments');
    tree.unmount();
  });
});
