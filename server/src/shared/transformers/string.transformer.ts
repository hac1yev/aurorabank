export const trimAndCollapseSpaces = (value: any) =>
  typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : String(value ?? '');
