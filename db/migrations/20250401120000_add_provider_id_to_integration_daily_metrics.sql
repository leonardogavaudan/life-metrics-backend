-- +goose Up
-- +goose StatementBegin
ALTER TABLE integration_daily_metrics
ADD COLUMN provider_id VARCHAR(50);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE integration_daily_metrics
DROP COLUMN provider_id;
-- +goose StatementEnd