import { pushUniqueEvent } from '../src/features/realtime/eventDedup';

describe('realtime event dedup', () => {
  it('ignores duplicate events with same key', () => {
    const seen = new Set<string>();
    const order: string[] = [];
    const first = pushUniqueEvent([], { id: 1 }, 'event:1', seen, order, 5);
    const second = pushUniqueEvent(first, { id: 1 }, 'event:1', seen, order, 5);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
  });

  it('keeps only max number of events', () => {
    const seen = new Set<string>();
    const order: string[] = [];
    let list: Array<{ id: number }> = [];

    for (let i = 1; i <= 4; i += 1) {
      list = pushUniqueEvent(list, { id: i }, `event:${i}`, seen, order, 3);
    }

    expect(list).toHaveLength(3);
    expect(list[0].id).toBe(4);
    expect(list[2].id).toBe(2);
    expect(seen.has('event:1')).toBe(false);
  });
});
