START TRANSACTION;
CREATE OR REPLACE FUNCTION transactions_fees() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    IF NEW.is_signed = 'true' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE total
            SET count = count + CAST(NEW.fee_info::json ->> 'partialFee' AS BIGINT)
            WHERE name = 'transactions_fees';
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE total
            SET count = count - CAST(NEW.fee_info::json ->> 'partialFee' AS BIGINT)
            WHERE name = 'transactions_fees';
            RETURN OLD;
        ELSE
            RETURN NULL;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;
COMMIT;
