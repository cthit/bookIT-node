import axios from "axios";

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

export const formatDT = (date: Date) => date.toLocaleString("se").slice(0, -3);

export const authRequest = async (endpoint: string, access_token?: string) => {
  const headers = {
    "Authorization": access_token ? `Bearer ${access_token}` : `pre-shared ${process.env.API_KEY}`
  }
  return (await axios.get(`${process.env.ISSUER_BASE_URL}${endpoint}`, {headers})).data
} 