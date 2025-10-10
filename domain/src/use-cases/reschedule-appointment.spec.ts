import { describe, expect, test } from 'vitest';

import { AppointmentStatus, type Appointment } from '../entities/appointment';
import { UserRole } from '../entities/user';
import type { Offering } from '../entities/offering';
import type { Schedule, WeeklyTemplateItem } from '../entities/schedule';

import type { AppointmentRepository } from '../services/appointment-ports';
import type { OfferingRepository } from '../services/offering-ports';
import type { ScheduleRepository } from '../services/schedule-ports';
import type { Clock, IdGenerator } from '../services/shared-ports';

import { rescheduleAppointment } from './reschedule-appointment';

class FakeAppointmentRepo implements AppointmentRepository {
  constructor(private rows: Appointment[] = []) {}
  async findById(id: string) { return this.rows.find(a => a.id === id) ?? null; }
  async findOverlap(params: { scheduleId: string; from: Date; to: Date }) {
    return this.rows.filter(a =>
      a.scheduleId === params.scheduleId &&
      a.start < params.to &&
      params.from < a.end
    );
  }
  async create(a: Appointment) { this.rows.push(a); }
  async update(a: Appointment) {
    const i = this.rows.findIndex(x => x.id === a.id);
    if (i >= 0) this.rows[i] = a;
  }

  seed(a: Appointment) { this.rows.push(a); }
  all() { return this.rows; }
}

class FakeOfferingRepo implements OfferingRepository {
  constructor(private rows: Offering[] = []) {}
  async findById(id: string) { return this.rows.find(o => o.id === id) ?? null; }
}

class FakeScheduleRepo implements ScheduleRepository {
  constructor(private rows: Schedule[] = []) {}
  async findById(id: string) { return this.rows.find(s => s.id === id) ?? null; }
}

const fixedNow = new Date('2025-01-01T10:00:00Z');
const clock: Clock = { now: () => fixedNow };
const ids: IdGenerator = { next: () => 'appt-new-1' };

function fullDayTemplateFor(date: Date): WeeklyTemplateItem[] {
  const weekday = date.getUTCDay() as 0|1|2|3|4|5|6;
  return [{ weekday, windows: [{ start: '00:00', end: '23:59' }] }];
}

const baseOffering: Offering = {
  id: 'off-1',
  name: 'Consultation',
  durationMinutes: 30,
  status: 'ACTIVE',
  createdAt: fixedNow, updatedAt: fixedNow,
};

function baseScheduleFor(d: Date): Schedule {
  return {
    id: 'sch-1',
    professionalId: 'pro-1',
    weeklyTemplate: fullDayTemplateFor(d),
    bufferMinutes: 10,
    timezone: 'America/Argentina/Buenos_Aires',
    createdAt: fixedNow, updatedAt: fixedNow,
  };
}

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-1',
    scheduleId: 'sch-1',
    offeringId: 'off-1',
    professionalId: 'pro-1',
    customerId: 'cus-1',
    start: new Date('2025-01-02T12:00:00Z'),
    end: new Date('2025-01-02T12:30:00Z'),
    status: AppointmentStatus.CONFIRMED,
    createdAt: new Date('2024-12-31T09:00:00Z'),
    updatedAt: new Date('2024-12-31T09:00:00Z'),
    audit: [],
    ...overrides,
  };
}

describe('RescheduleAppointment Use Case', () => {
  test('happy path: customer reschedules to a valid future slot (old becomes CANCELLED, new created)', async () => {
    const old = makeAppt(); // 2025-01-02 12:00
    const newStart = new Date('2025-01-02T13:00:00Z'); // válido
    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(newStart)]);
    const apptRepo = new FakeAppointmentRepo([old]);

    const result = await rescheduleAppointment({
      data: {
        appointmentId: old.id,
        newStart: newStart,
        actorId: 'cus-1',
        actorRole: UserRole.USER,
        reason: 'need later time',
      },
      deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
    });

    // Nuevo turno
    expect(result.id).toBe('appt-new-1');
    expect(result.start).toEqual(newStart);
    expect(result.status).toBe(AppointmentStatus.PENDING);

    // Antiguo turno debe quedar CANCELLED
    const updatedOld = (await apptRepo.findById('appt-1'))!;
    expect(updatedOld.status).toBe(AppointmentStatus.CANCELLED);
    expect(updatedOld.audit?.at(-1)).toMatchObject({ action: 'RESCHEDULE', byUserId: 'cus-1' });
  });

  test('forbidden: only participants (customer/professional) or admin can reschedule', async () => {
    const old = makeAppt();
    const newStart = new Date('2025-01-02T13:00:00Z');
    const apptRepo = new FakeAppointmentRepo([old]);
    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(newStart)]);

    await expect(rescheduleAppointment({
      data: { appointmentId: old.id, newStart, actorId: 'intruder', actorRole: UserRole.USER },
      deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
    })).rejects.toThrow('FORBIDDEN_RESCHEDULE');
  });

  test('policy: customer cannot reschedule inside cancel window (< cancelMinHours)', async () => {
    // Viejo turno dentro de las próximas 10h → cliente no puede
    const old = makeAppt({ start: new Date('2025-01-01T20:00:00Z'), end: new Date('2025-01-01T20:30:00Z') });
    const newStart = new Date('2025-01-01T21:00:00Z');
    const apptRepo = new FakeAppointmentRepo([old]);
    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(newStart)]);

    await expect(rescheduleAppointment({
      data: { appointmentId: old.id, newStart, actorId: 'cus-1', actorRole: UserRole.USER },
      deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
    })).rejects.toThrow('CANCEL_WINDOW_VIOLATION');
  });

  test('assistant can reschedule even inside window; new appointment respects buffer & availability', async () => {
    const old = makeAppt({ start: new Date('2025-01-01T20:00:00Z'), end: new Date('2025-01-01T20:30:00Z') });
    const newStart = new Date('2025-01-01T21:00:00Z'); // válido
    const apptRepo = new FakeAppointmentRepo([old]);
    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(newStart)]);

    const result = await rescheduleAppointment({
      data: { appointmentId: old.id, newStart, actorId: 'pro-1', actorRole: UserRole.ASSISTANT },
      deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
    });

    expect(result.start).toEqual(newStart);
    expect(result.status).toBe(AppointmentStatus.PENDING);
    const oldUpdated = (await apptRepo.findById(old.id))!;
    expect(oldUpdated.status).toBe(AppointmentStatus.CANCELLED);
  });

  test('fails when appointment not found', async () => {
    const apptRepo = new FakeAppointmentRepo([]);
    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const d = new Date('2025-01-02T13:00:00Z');
    const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(d)]);

    await expect(rescheduleAppointment({
      data: { appointmentId: 'missing', newStart: d, actorId: 'cus-1', actorRole: UserRole.USER },
      deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
    })).rejects.toThrow('APPOINTMENT_NOT_FOUND');
  });

  test('fails when appointment is not reschedulable (cancelled/attended/no-show)', async () => {
    const cancelled = makeAppt({ status: AppointmentStatus.CANCELLED, id: 'a1' });
    const attended  = makeAppt({ status: AppointmentStatus.ATTENDED,  id: 'a2' });
    const noShow    = makeAppt({ status: AppointmentStatus.NO_SHOW,   id: 'a3' });
    const apptRepo = new FakeAppointmentRepo([cancelled, attended, noShow]);
    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const d = new Date('2025-01-02T13:00:00Z');
    const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(d)]);

    const deps = { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } };

    await expect(rescheduleAppointment({ data: { appointmentId: 'a1', newStart: d, actorId: 'cus-1', actorRole: UserRole.USER }, deps }))
      .rejects.toThrow('RULE_INVALID_TRANSITION');
    await expect(rescheduleAppointment({ data: { appointmentId: 'a2', newStart: d, actorId: 'cus-1', actorRole: UserRole.USER }, deps }))
      .rejects.toThrow('RULE_INVALID_TRANSITION');
    await expect(rescheduleAppointment({ data: { appointmentId: 'a3', newStart: d, actorId: 'cus-1', actorRole: UserRole.USER }, deps }))
      .rejects.toThrow('RULE_INVALID_TRANSITION');
  });

  test('fails when newStart is in the past', async () => {
    const old = makeAppt();
    const past = new Date('2024-12-31T10:00:00Z');
    const apptRepo = new FakeAppointmentRepo([old]);
    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(old.start)]);

    await expect(rescheduleAppointment({
      data: { appointmentId: old.id, newStart: past, actorId: 'cus-1', actorRole: UserRole.USER },
      deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
    })).rejects.toThrow('RULE_PAST_APPOINTMENT');
  });

  test('fails when schedule not found or offering not found/inactive', async () => {
    const old = makeAppt();
    const d = new Date('2025-01-02T13:00:00Z');

    // schedule missing
    {
      const apptRepo = new FakeAppointmentRepo([old]);
      const offeringRepo = new FakeOfferingRepo([baseOffering]);
      const scheduleRepo = new FakeScheduleRepo([]);
      await expect(rescheduleAppointment({
        data: { appointmentId: old.id, newStart: d, actorId: 'cus-1', actorRole: UserRole.USER },
        deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
      })).rejects.toThrow('SCHEDULE_NOT_FOUND');
    }

    // offering missing
    {
      const apptRepo = new FakeAppointmentRepo([old]);
      const offeringRepo = new FakeOfferingRepo([]);
      const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(d)]);
      await expect(rescheduleAppointment({
        data: { appointmentId: old.id, newStart: d, actorId: 'cus-1', actorRole: UserRole.USER },
        deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
      })).rejects.toThrow('OFFERING_NOT_FOUND');
    }

    // offering inactive
    {
      const inactive: Offering = { ...baseOffering, status: 'INACTIVE' as const };
      const apptRepo = new FakeAppointmentRepo([old]);
      const offeringRepo = new FakeOfferingRepo([inactive]);
      const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(d)]);
      await expect(rescheduleAppointment({
        data: { appointmentId: old.id, newStart: d, actorId: 'cus-1', actorRole: UserRole.USER },
        deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
      })).rejects.toThrow('OFFERING_INACTIVE');
    }
  });

  test('respects buffer and overlap on the new slot', async () =>
  {
    // Hay un turno existente 13:00–13:30; con buffer 10', próximo permitido 13:40.
    const old = makeAppt(); // 12:00–12:30
    const existing = makeAppt({ id: 'other', start: new Date('2025-01-02T13:00:00Z'), end: new Date('2025-01-02T13:30:00Z') });

    const apptRepo = new FakeAppointmentRepo([old, existing]);
    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([baseScheduleFor(existing.start)]);

    // Intento a 13:30 (igual al fin del existente) → debe fallar por buffer 10'
    await expect(rescheduleAppointment({
      data: { appointmentId: old.id, newStart: new Date('2025-01-02T13:30:00Z'), actorId: 'pro-1', actorRole: UserRole.ASSISTANT },
      deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
    })).rejects.toThrow('OVERLAP_APPOINTMENT');

    // Intento a 13:40 → OK
    const ok = await rescheduleAppointment({
      data: { appointmentId: old.id, newStart: new Date('2025-01-02T13:40:00Z'), actorId: 'pro-1', actorRole: UserRole.ASSISTANT },
      deps: { offeringRepo, scheduleRepo, appointmentRepo: apptRepo, clock, ids, policy: { cancelMinHours: 24 } },
    });
    expect(ok.start).toEqual(new Date('2025-01-02T13:40:00Z'));
  });
});