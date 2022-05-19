import Axios from "axios";

const gotify_host = process.env.GOTIFY_HOST;
const gotify_key = process.env.GOTIFY_KEY;
const vo_email = process.env.VO_EMAIL || "";

interface EmialOptions {
  to: string;
  subject: string;
  body: string;
}

const sendEmail = (email: EmialOptions) =>
  Axios.post(
    `${gotify_host}/mail`,
    {
      ...email,
      from: "admin@chalmers.it",
    },
    {
      headers: {
        Authorization: "pre-shared: " + gotify_key,
      },
    },
  );

export interface NotifyOptions {
  to?: string;
  subject: string;
  body: string;
}

export const notify = (notification: NotifyOptions) =>
  sendEmail({
    to: vo_email,
    ...notification,
  });
