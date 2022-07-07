CREATE TABLE IF NOT EXISTS ddc_metric
(
    id     SERIAL NOT NULL,
    name   TEXT   NOT NULL,
    nodeId BIGINT,
    PRIMARY KEY (name, nodeId)
);

CREATE TABLE IF NOT EXISTS ddc_metric_value
(
    metricId  BIGINT         NOT NULL,
    value     NUMERIC(40, 0) NOT NULL,
    timestamp BIGINT         NOT NULL
);

CREATE INDEX IF NOT EXISTS ddc_metric_value_metric_id
    ON ddc_metric_value(metricId);

CREATE OR REPLACE VIEW ddc_metric_view AS
SELECT name, nodeId, value, timestamp
FROM ddc_metric_value
         JOIN ddc_metric on ddc_metric_value.metricId = ddc_metric.id;
