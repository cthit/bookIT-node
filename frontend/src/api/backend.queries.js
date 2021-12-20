export const getEvents_query = `
query GetEvents($from: String!, $to: String!){ 
  eventsFT(from: $from, to: $to) {
    start
    end
    id
    title
    room
  }
}`;

export const getEvent_query = `
query GetEvent($id: String!) {
  event(id: $id) {
    title
    description
    start
    end
    booked_as
    booked_by
    created_at
    room
  }
}
`;

export const getFullEvent_query = `
query GetFullEvent($id: String) {
  event(id: $id) {
    start
    end
    description
    title
    party_report {
      id
      responsible_name
      responsible_email
      responsible_number
      co_responsible_name
      co_responsible_email
      co_responsible_number
      serving_permit
    }
    room
    phone
    booked_as
  }
}
`;

export const createEvent_query = `
mutation CreateEvent($event: InputEvent!) {
  createEvent(event: $event) {
    sv
    en
  }
}`;

export const getRules_query = `
{
  rules {
    id
    title
    start_date
    end_date
    start_time
    end_time
    day_mask
    priority
    room
    allow
  }
}
`;

export const getRule_query = `
query GetRule($id: String!) {
  rule(id: $id) {
    id
    title
    start_date
    end_date
    start_time
    end_time
    day_mask
    priority
    description
    room
    allow
    created_at
    updated_at
  }
}
`;

export const createRule_query = `
mutation CreateRule($rule: InputRule!) {
  createRule(rule: $rule)
}
`;

export const deleteRule_query = `
mutation DeleteRule($id: String!) {
  deleteRule(id: $id) 
}
`;

export const getUser_query = `
{
  user {
    cid
    groups
    is_admin
    language
  }
}
`;

export const getPartyReports_query = `
{
	party_events {
    id
    start
    end
    title
    created_at
    party_report {
      status
    }
  }
}
`;

export const getPartyReport_query = `
query GetEvent($id: String) {
  event(id: $id) {
    id
    start
    end
    description
    title
    created_at
    phone
    room
    party_report {
      id
      status
      responsible_name
      responsible_number
      responsible_email
      co_responsible_name
      co_responsible_number
      co_responsible_email
      serving_permit
    }
  }
}
`;

export const editEvent_query = `
mutation EditEvent($event: InputEvent) {
  editEvent(event: $event) {
    sv
    en
  }
}
`;

export const deleteEvent_query = `
mutation DeleteEvent($id: String) {
  deleteEvent(id: $id) {
    sv
    en
  }
}
`;
