## SQL queries

### Insert element

```SQL
INSERT INTO event (title, description, start, end_date as end, room) VALUES (
    'Fun Event',
    'A verry good event',
    '2021-08-10T21:00' ,
    '2021-08-10T22:00',
    '{ BIG_HUB }') RETURNING id;
```

### Insert party report

```SQL
INSERT INTO party_report (event_id, responsible_name, responsible_number, responsible_email) VALUES (
  '32611ba8-fade-11eb-9574-0242ac1a0002',
  'Alice',
  '1234',
  'alice@alice.com');
```

### Inner join select

```SQL
SELECT * FROM party_report INNER JOIN event
ON event.id=party_report.event_id;
```

```SQL
SELECT (responsible_name, responsible_email) as event, (title, start as start) as party_report
FROM party_report INNER JOIN event
ON event.id=party_report.event_id;
```

## GraphQL Queries

### Query all

```GraphQL
{
  events {
    id
    title
  }
}
```

### Query specific

```GraphQL
query GetEvent($id: String!) {
  event(id: $id) {
    id
  }
}
```

Variables

```json
{
  "id": "1068380c-f9f7-11eb-9702-0242ac1a0002"
}
```