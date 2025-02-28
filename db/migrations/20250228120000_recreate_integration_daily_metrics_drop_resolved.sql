-- +goose Up
-- +goose StatementBegin
-- Recreate the integration_daily_metrics table
CREATE TABLE integration_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  value REAL NOT NULL,
  unit VARCHAR(50) NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT integration_daily_metrics_integration_id_metric_type_event_date_key
  UNIQUE (integration_id, metric_type, event_date)
);

-- Create the timestamp trigger for the integration_daily_metrics table
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON integration_daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Drop the resolved_daily_metrics table
DROP TABLE IF EXISTS resolved_daily_metrics;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Recreate the resolved_daily_metrics table
CREATE TABLE resolved_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value REAL NOT NULL,
  unit VARCHAR(50) NOT NULL,
  integration_priority JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, event_date, metric_type)
);

-- Create the timestamp trigger for the resolved_daily_metrics table
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON resolved_daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Drop the integration_daily_metrics table
DROP TABLE IF EXISTS integration_daily_metrics;
-- +goose StatementEnd 