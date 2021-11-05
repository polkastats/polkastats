INSERT INTO total (name, count) VALUES ('signed_extrinsics', 0);

-- Signed Extrinsics
START TRANSACTION;
CREATE FUNCTION signed_extrinsics_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF NEW.is_signed = true THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE total SET count = count + 1 WHERE name = 'signed_extrinsics';
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE total SET count = count - 1 WHERE name = 'signed_extrinsics';
      RETURN OLD;
    ELSE
      UPDATE total SET count = 0 WHERE name = 'signed_extrinsics';
      RETURN NULL;
    END IF;
  END IF;
  RETURN NULL;
END;$$;
CREATE CONSTRAINT TRIGGER signed_extrinsics_count_mod
  AFTER INSERT OR DELETE ON extrinsic
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE signed_extrinsics_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER signed_extrinsics_count_trunc AFTER TRUNCATE ON extrinsic
  FOR EACH STATEMENT EXECUTE PROCEDURE signed_extrinsics_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE is_signed = true) WHERE name = 'signed_extrinsics';
COMMIT;
