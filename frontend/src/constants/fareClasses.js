export const FARE_CLASSES = [
  { id: 'economy', label: 'Economy' },
  { id: 'business', label: 'Business' },
  { id: 'first', label: 'First Class' },
];

export function fareClassLabel(id) {
  return FARE_CLASSES.find((c) => c.id === id)?.label ?? id;
}

export const DEFAULT_FARE_CLASS = 'economy';
