-- +goose Up
-- +goose StatementBegin
ALTER TABLE sleep_sessions
ADD COLUMN provider_id VARCHAR(50);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE sleep_sessions
DROP COLUMN provider_id;
-- +goose StatementEnd