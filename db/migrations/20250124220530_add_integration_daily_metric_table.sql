-- +goose Up
-- +goose StatementBegin
CREATE TABLE integration_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolved_daily_metric_id UUID NOT NULL REFERENCES resolved_daily_metrics(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON integration_daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS integration_daily_metrics;
-- +goose StatementEnd