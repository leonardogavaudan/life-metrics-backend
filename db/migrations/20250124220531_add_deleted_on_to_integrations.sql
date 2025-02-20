-- +goose Up
-- +goose StatementBegin
ALTER TABLE integrations
ADD COLUMN deleted_on TIMESTAMP;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE integrations
DROP COLUMN deleted_on;
-- +goose StatementEnd