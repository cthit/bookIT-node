BEGIN;

INSERT INTO g_text (text_id, sv, en)
VALUES ('144401ae-01a7-4dce-b6ad-03d63173f8d8', 'BookIT lokal utveckling', 'BookIT local development')
ON CONFLICT DO NOTHING;

-- Local-only credentials use the mock user's password: password1337.
INSERT INTO g_client (
    client_uid, client_id, client_secret, redirect_uri, pretty_name,
    created_at, description, official
)
VALUES (
    'b2753bd1-9ca2-42e7-b0f2-28dd56bcc15d', 'BOOKITLOCALDEVELOPMENTCLIENT01',
    (SELECT password FROM g_user WHERE cid = 'bookmember'),
    'http://localhost:8080/api/callback', 'BookIT local',
    CURRENT_TIMESTAMP, '144401ae-01a7-4dce-b6ad-03d63173f8d8', true
)
ON CONFLICT DO NOTHING;

INSERT INTO g_client_scope (client_uid, scope, created_at)
VALUES ('b2753bd1-9ca2-42e7-b0f2-28dd56bcc15d', 'PROFILE', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO g_api_key (
    api_key_id, pretty_name, token, key_type, created_at, updated_at, version, description
)
VALUES (
    '9c48b6ac-3b70-4c50-b171-b41eb111af67', 'BookIT local',
    (SELECT password FROM g_user WHERE cid = 'bookmember'),
    'CLIENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '144401ae-01a7-4dce-b6ad-03d63173f8d8'
)
ON CONFLICT DO NOTHING;

INSERT INTO g_client_api_key (created_at, client_uid, api_key_id)
VALUES (
    CURRENT_TIMESTAMP, 'b2753bd1-9ca2-42e7-b0f2-28dd56bcc15d', '9c48b6ac-3b70-4c50-b171-b41eb111af67'
)
ON CONFLICT DO NOTHING;

INSERT INTO g_client_authority (created_at, client_uid, authority_name)
VALUES (CURRENT_TIMESTAMP, 'b2753bd1-9ca2-42e7-b0f2-28dd56bcc15d', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO g_client_authority_user (created_at, user_id, client_uid, authority_name)
VALUES (
    CURRENT_TIMESTAMP, '88eec5c2-5ebb-4e13-9a76-fcc4dac9e74f',
    'b2753bd1-9ca2-42e7-b0f2-28dd56bcc15d', 'admin'
)
ON CONFLICT DO NOTHING;

COMMIT;
