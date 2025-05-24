-- +goose Up
-- +goose StatementBegin
ALTER TABLE sleep_sessions ADD COLUMN total_sleep_seconds INTEGER;

-- Update existing records to calculate total_sleep_seconds
UPDATE sleep_sessions
SET total_sleep_seconds = EXTRACT(EPOCH FROM (end_timestamp - start_timestamp));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE sleep_sessions DROP COLUMN total_sleep_seconds;
-- +goose StatementEnd
