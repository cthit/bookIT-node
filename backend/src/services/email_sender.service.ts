import { event, party_report } from "@prisma/client";
import Axios from "axios";
import { Event } from "../models";
import { to } from "../utils";

const gotify_host = process.env.GOTIFY_HOST;
const gotify_key = process.env.GOTIFY_KEY;
const vo_email = process.env.VO_EMAIL || "";

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

const sendEmail = (email: EmailOptions) =>
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

/**
 * Notifies VO via email that an party report has been created
 */
export const partyReportCreated = async (event: Event) => {
  let { err } = await to(
    notify({
      subject: "bookIT - Ny aktivitetsanmälan",
      body: `
    En ny aktivitestsanmälan har skapats i bookIT.
    Börjar: ${event.start}
    Slutar: ${event.end}
    Rum: ${event.room}
    Se anmälan här: https://bookit.chalmers.it/party_reports/${event.id}
    
    Mvh bookIT
    `,
    }),
  );

  if (err) {
    console.log("Failed to send email to VO");
    console.log(err.message);
  }
};

/**
 * Notifies VO via email that an event has been updated
 */
export const eventUpdated = async (old_event: Event, event: Event) => {
  let { err } = await to(
    notify({
      subject: "bookIT - Aktivitet ändrad",
      body: `
    En godkänd aktivitestsanmälan har ändrats i bookIT.
    ${
      old_event.start !== event.start
        ? `Börjar: ${event.start} (tidigare ${old_event.start})`
        : ""
    }
    ${
      old_event.end !== event.end
        ? `Slutar: ${event.end} (tidigare ${old_event.end})`
        : ""
    }
    ${
      old_event.room.toString() !== event.room.toString()
        ? `Rum: ${event.room} (tidigare ${old_event.room})`
        : ""
    }
    Se anmälan här: https://bookit.chalmers.it/party_reports/${event.id}
    
    Mvh bookIT
    `,
    }),
  );

  if (err) {
    console.log("Failed to send email to VO");
    console.log(err.message);
  }
};

const svStatusMessage = (event: event, status: string) => `
    Aktivitetsanmälan för '${event.title}' har blivit ${
  status === "ACCEPTED" ? "Godkänd" : "Nekad"
}!

    Mvh bookIT
`;

const enStatusMessage = (event: event, status: string) => `
    The party report for '${event.title}' has been ${
  status === "ACCEPTED" ? "Accepted" : "Denied"
}!

    BR bookIT
`;

/**
 * Notifies the user that an event has been accepted
 */
export const statusChanged = async (
  event: event,
  report: party_report,
  status: string,
  language: string,
) => {
  let subject = "";
  if (language === "sv") {
    subject =
      "Aktivitetsanmälan " + (status == "ACCEPTED" ? "Godkänd!" : "Nekad!");
  } else {
    subject =
      "Party Report " + (status == "ACCEPTED" ? "Accepted!" : "Denied!");
  }

  const bodyMessage = language === "sv" ? svStatusMessage : enStatusMessage;
  let { err } = await to(
    notify({
      subject: "bookIT - " + subject,
      body: bodyMessage(event, status),
      to: report.responsible_email,
    }),
  );

  if (err) {
    console.log("Failed to send email to VO");
    console.log(err.message);
  }
};
