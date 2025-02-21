-- +goose Up
-- +goose StatementBegin
ALTER TABLE user_preferences
ADD COLUMN deleted_on TIMESTAMPTZ DEFAULT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE user_preferences
DROP COLUMN deleted_on;
-- +goose StatementEnd