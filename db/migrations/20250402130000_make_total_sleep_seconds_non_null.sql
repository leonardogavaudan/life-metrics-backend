-- +goose Up
-- +goose StatementBegin
ALTER TABLE sleep_sessions
    ALTER COLUMN total_sleep_seconds SET NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Make the column nullable again
ALTER TABLE sleep_sessions
    ALTER COLUMN total_sleep_seconds DROP NOT NULL;
-- +goose StatementEnd
