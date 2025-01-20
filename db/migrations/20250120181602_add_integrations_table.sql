-- +goose Up
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE UNIQUE INDEX idx_integrations_user_provider ON integrations(user_id, provider);

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- +goose Down
DROP TABLE IF EXISTS integrations;