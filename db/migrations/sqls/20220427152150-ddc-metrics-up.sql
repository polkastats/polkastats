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
