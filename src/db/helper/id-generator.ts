export const generateId = (prefix: string): string => {
  return `${prefix}_${crypto.randomUUID()}`;
};
