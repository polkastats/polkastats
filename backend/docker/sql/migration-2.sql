INSERT INTO total (name, count) VALUES ('transactions_fees', 0);

-- Transactions Fees
START TRANSACTION;
CREATE FUNCTION transactions_fees() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF NEW.is_signed = 'true' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE total SET count = count + CAST(NEW.fee_info::json->>'partialFee' AS INTEGER) WHERE name = 'transactions_fees';
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE total SET count = count - CAST(NEW.fee_info::json->>'partialFee' AS INTEGER) WHERE name = 'transactions_fees';
      RETURN OLD;
    ELSE
      RETURN NULL;
    END IF;
  END IF;
  RETURN NULL;
END;$$;
CREATE CONSTRAINT TRIGGER transactions_fees_mod
  AFTER INSERT OR DELETE ON extrinsic
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE transactions_fees();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER transactions_fees_trunc AFTER TRUNCATE ON extrinsic
  FOR EACH STATEMENT EXECUTE PROCEDURE transactions_fees();
-- initialize the counter table
UPDATE total SET count = COALESCE((SELECT SUM(CAST(fee_info::json->>'partialFee' AS BIGINT)) FROM extrinsic WHERE is_signed = 'true' AND fee_info <> ''), 0) WHERE name = 'transactions_fees';
COMMIT;