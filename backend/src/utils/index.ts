export const to = <T>(promise: Promise<T>): Promise<{ err?: any; res?: T }> => {
  return promise.then(res => ({ res })).catch(err => ({ err }));
};

export const equal = (a: any, b: any) => {
  if (a === b) return true;
  for (let key in a) {
    if (a[key] !== b[key]) return false;
  }

  for (let key in b) {
    if (a[key] !== b[key]) return false;
  }

  return true;
};
