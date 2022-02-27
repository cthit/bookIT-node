/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable("event", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v1()"),
    },
    party_report_id: {
      type: "uuid",
      foreignKey: true,
      references: "party_report(id)",
      notNull: false,
      onDelete: "cascade",
    },
    phone: {
      type: "text",
      notNull: true,
    },
    title: {
      type: "text",
      notNull: true,
    },
    description: {
      type: "text",
    },
    start: {
      type: "timestamp",
      notNull: true,
    },
    end: {
      type: "timestamp",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    room: {
      type: "text[]",
      notNull: true,
    },
    booked_by: {
      type: "text",
      notNull: true,
    },
    booked_as: {
      type: "text",
      notNull: true,
    },
  });
};

exports.down = pgm => {};
