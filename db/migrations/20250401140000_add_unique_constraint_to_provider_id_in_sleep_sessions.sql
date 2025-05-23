-- +goose Up
-- +goose StatementBegin
ALTER TABLE sleep_sessions
ADD CONSTRAINT sleep_sessions_provider_id_key UNIQUE (provider_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE sleep_sessions
DROP CONSTRAINT sleep_sessions_provider_id_key;
-- +goose StatementEnd