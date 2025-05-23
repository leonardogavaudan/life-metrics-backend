-- +goose Up
-- +goose StatementBegin
ALTER TABLE sleep_sessions
ALTER COLUMN provider_id SET NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE sleep_sessions
ALTER COLUMN provider_id DROP NOT NULL;
-- +goose StatementEnd