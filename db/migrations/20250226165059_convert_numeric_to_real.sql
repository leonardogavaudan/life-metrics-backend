-- +goose Up
-- +goose StatementBegin
ALTER TABLE integration_daily_metrics 
ALTER COLUMN value TYPE REAL USING value::REAL;

ALTER TABLE time_series_metrics 
ALTER COLUMN value TYPE REAL USING value::REAL;

ALTER TABLE resolved_daily_metrics 
ALTER COLUMN value TYPE REAL USING value::REAL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE integration_daily_metrics 
ALTER COLUMN value TYPE NUMERIC USING value::NUMERIC;

ALTER TABLE time_series_metrics 
ALTER COLUMN value TYPE NUMERIC USING value::NUMERIC;

ALTER TABLE resolved_daily_metrics 
ALTER COLUMN value TYPE NUMERIC USING value::NUMERIC;
-- +goose StatementEnd
