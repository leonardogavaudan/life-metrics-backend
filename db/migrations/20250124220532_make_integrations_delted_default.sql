-- +goose Up
-- +goose StatementBegin
ALTER TABLE integrations
ALTER COLUMN deleted_on SET DEFAULT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE integrations
ALTER COLUMN deleted_on DROP DEFAULT;
-- +goose StatementEnd