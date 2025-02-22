-- +goose Up
-- +goose StatementBegin
ALTER TABLE integration_daily_metrics
ADD CONSTRAINT integration_daily_metrics_integration_id_metric_type_event_date_key
UNIQUE (integration_id, metric_type, event_date);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE integration_daily_metrics
DROP CONSTRAINT integration_daily_metrics_integration_id_metric_type_event_date_key;
-- +goose StatementEnd
