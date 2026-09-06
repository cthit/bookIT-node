import axios from "axios";

export const to = <T>(promise: Promise<T>): Promise<{ err?: unknown; res?: T }> =>
  promise.then((res) => ({ res })).catch((err: unknown) => ({ err }));

export const authRequest = async <T>(endpoint: string, accessToken?: string): Promise<T> => {
  const headers = {
    Authorization: accessToken ? `Bearer ${accessToken}` : `pre-shared ${process.env.API_KEY}`,
  };
  const response = await axios.get<T>(`${process.env.ISSUER_BASE_URL}${endpoint}`, {
    headers,
    timeout: 10_000,
  });
  return response.data;
};
