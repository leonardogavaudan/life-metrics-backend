-- +goose Up
-- +goose StatementBegin
DROP TABLE integration_daily_metrics
-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
CREATE TABLE integration_daily_metrics
-- +goose StatementEnd
