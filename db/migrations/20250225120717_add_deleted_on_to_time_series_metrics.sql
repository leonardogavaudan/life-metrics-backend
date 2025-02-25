-- +goose Up
-- +goose StatementBegin
ALTER TABLE time_series_metrics
ADD COLUMN deleted_on TIMESTAMPTZ DEFAULT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE time_series_metrics
DROP COLUMN IF EXISTS deleted_on;
-- +goose StatementEnd 