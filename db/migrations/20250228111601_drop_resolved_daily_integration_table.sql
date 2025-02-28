-- +goose Up
-- +goose StatementBegin
ALTER TABLE integration_daily_metrics
DROP COLUMN resolved_daily_metric_id
-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE integration_daily_metrics
ADD COLUMN resolved_daily_metric_id UUID;

-- +goose StatementEnd
