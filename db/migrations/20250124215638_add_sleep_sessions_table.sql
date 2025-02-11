-- +goose Up
-- +goose StatementBegin
CREATE TABLE time_series_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  sleep_id UUID REFERENCES sleep_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  UNIQUE (user_id, event_timestamp, metric_type)
);

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON time_series_metrics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS time_series_metrics;
-- +goose StatementEnd
