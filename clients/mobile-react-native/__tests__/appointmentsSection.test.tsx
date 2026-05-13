import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppointmentsSection } from '../src/features/appointments/AppointmentsSection';
import { AppointmentDto } from '../src/types/appointment';

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('react-native', () => ({
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  Platform: { OS: 'ios' },
  StyleSheet: { create: <T,>(styles: T) => styles }
}));

const palette = {
  card: '#fff',
  text: '#111',
  subText: '#666',
  border: '#ddd',
  button: '#0a0',
  buttonText: '#fff',
  mutedCard: '#f4f4f5'
};

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
  it('shows create form for customer role and hides it for consultant role', () => {
    const customer = renderSection({ role: 1 });
    const customerTextDump = customer.tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(customerTextDump).toContain('Create Appointment');
    expect(customerTextDump).toContain('Randevu tarihi ve saati');
    expect(customerTextDump).toContain('Role:');
    customer.tree.unmount();

    const consultant = renderSection({ role: 2 });
    const consultantTextDump = consultant.tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(consultantTextDump).not.toContain('Create Appointment');
    expect(consultantTextDump).toContain('devre disi');
    consultant.tree.unmount();
  });

  it('toggles date picker visibility when date field is pressed', () => {
    const { tree } = renderSection({ role: 1, appointmentDateInput: '' });
    const dateTrigger = tree.root.findAll((node) => node.props?.accessibilityLabel === 'Open date and time picker')[0];
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
    const completedButtons = touchables.filter((node) => {
      const textDump = node.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
      return textDump.includes('Completed');
    });
    const enabledCompleted = completedButtons.filter((node) => !node.props.disabled);
    expect(enabledCompleted.length).toBeGreaterThan(0);

    act(() => {
      enabledCompleted[enabledCompleted.length - 1].props.onPress();
    });
    expect(onUpdateStatus).toHaveBeenCalledWith(301, 3);
    tree.unmount();
  });

  it('disables all status action chips when appointment is completed', () => {
    const onUpdateStatus = jest.fn();
    const completedAppointment: AppointmentDto = { ...sampleAppointments[0], status: 3 };
    const { tree } = renderSection({ role: 2, appointments: [completedAppointment], onUpdateStatus });

    const rowChips = tree.root.findAll(
      (node) => typeof node.props?.testID === 'string' && node.props.testID.startsWith('appointment-row-301-set-')
    );
    expect(rowChips).toHaveLength(3);
    expect(rowChips.every((n) => n.props.disabled === true)).toBe(true);
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

  it('shows invalid date hint when appointment date string is not parseable', () => {
    const { tree } = renderSection({ role: 1, appointmentDateInput: 'not-a-valid-iso' });
    const textDump = tree.root.findAllByType('Text' as any).map((n) => n.props.children).flat().join(' ');
    expect(textDump).toContain('Gecersiz tarih');
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
});
