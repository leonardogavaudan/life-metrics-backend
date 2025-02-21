-- +goose Up
-- +goose StatementBegin
ALTER TABLE integrations
ALTER COLUMN deleted_on TYPE TIMESTAMPTZ;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE integrations
ALTER COLUMN deleted_on TYPE TIMESTAMP;
-- +goose StatementEnd
