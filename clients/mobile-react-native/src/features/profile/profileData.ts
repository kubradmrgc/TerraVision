import type { AppointmentDto } from '../../types/appointment';
import type { OrderDto } from '../../types/order';

export function splitOrdersForProfile(orders: OrderDto[]): { active: OrderDto[]; past: OrderDto[] } {
  const active = orders.filter((o) => o.status !== 4 && o.status !== 5);
  const past = orders.filter((o) => o.status === 4 || o.status === 5);
  return { active, past };
}

export function pastAppointmentsForProfile(appointments: AppointmentDto[]): AppointmentDto[] {
  return appointments
    .filter((a) => a.status === 3 || a.status === 4)
    .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
}
