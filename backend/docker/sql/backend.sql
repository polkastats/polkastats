GRANT ALL PRIVILEGES ON DATABASE polkastats TO polkastats;

CREATE TABLE IF NOT EXISTS block (  
  block_number BIGINT NOT NULL,
  finalized BOOLEAN NOT NULL,
  block_author TEXT NOT NULL,
  block_author_name TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsics_root TEXT NOT NULL,
  state_root TEXT NOT NULL,
  active_era BIGINT NOT NULL,
  current_index BIGINT NOT NULL,
  is_election BOOLEAN NOT NULL,
  spec_name TEXT NOT NULL,
  spec_version INT NOT NULL,
  total_events INT NOT NULL,
  total_extrinsics INT NOT NULL,
  total_issuance NUMERIC(40,0) NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )
);

CREATE TABLE IF NOT EXISTS harvest_error (  
  block_number BIGINT NOT NULL,
  error TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )
);

CREATE TABLE IF NOT EXISTS event (  
  block_number BIGINT NOT NULL,
  event_index INT NOT NULL,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  phase TEXT NOT NULL,
  data TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, event_index ) 
);

CREATE TABLE IF NOT EXISTS staking_reward (  
  block_number BIGINT NOT NULL,
  event_index INT NOT NULL,
  account_id TEXT NOT NULL,
  validator_stash_address TEXT NOT NULL,
  era INT NOT NULL,
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, event_index ) 
);

CREATE TABLE IF NOT EXISTS staking_slash (  
  block_number BIGINT NOT NULL,
  event_index INT NOT NULL,
  account_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, event_index ) 
);

CREATE TABLE IF NOT EXISTS extrinsic (  
  block_number BIGINT NOT NULL,
  extrinsic_index INT NOT NULL,
  is_signed BOOLEAN NOT NULL,
  signer TEXT,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  args TEXT NOT NULL,
  hash TEXT NOT NULL,
  doc TEXT NOT NULL,
  fee_info TEXT NOT NULL,
  fee_details TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT DEFAULT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, extrinsic_index ) 
);

CREATE TABLE IF NOT EXISTS signed_extrinsic (  
  block_number BIGINT NOT NULL,
  extrinsic_index INT NOT NULL,
  signer TEXT NOT NULL,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  args TEXT NOT NULL,
  hash TEXT NOT NULL,
  doc TEXT NOT NULL,
  fee_info TEXT NOT NULL,
  fee_details TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT DEFAULT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, extrinsic_index ) 
);

CREATE TABLE IF NOT EXISTS transfer (  
  block_number BIGINT NOT NULL,
  extrinsic_index INT NOT NULL,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  hash TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  amount BIGINT NOT NULL,
  fee_amount BIGINT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT DEFAULT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, extrinsic_index ) 
);

CREATE TABLE IF NOT EXISTS log  (  
  block_number BIGINT NOT NULL,
  log_index INT NOT NULL,
  type TEXT,
  engine TEXT NOT NULL,
  data TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, log_index ) 
);

CREATE TABLE IF NOT EXISTS ranking (
  block_height BIGINT NOT NULL,
  rank INT NOT NULL,
  active BOOLEAN NOT NULL,
  active_rating INT NOT NULL,
  name TEXT NOT NULL,
  identity TEXT NOT NULL,
  has_sub_identity BOOLEAN NOT NULL,
  sub_accounts_rating INT NOT NULL,
  verified_identity BOOLEAN NOT NULL,
  identity_rating INT NOT NULL,
  stash_address TEXT NOT NULL,
  stash_address_creation_block BIGINT NOT NULL,
  stash_parent_address_creation_block BIGINT NOT NULL,
  address_creation_rating INT NOT NULL,
  controller_address TEXT NOT NULL,
  included_thousand_validators BOOLEAN NOT NULL,
  thousand_validator TEXT NOT NULL,
  part_of_cluster BOOLEAN NOT NULL,
  cluster_name TEXT NOT NULL,
  cluster_members INT NOT NULL,
  show_cluster_member BOOLEAN NOT NULL,
  nominators INT NOT NULL,
  nominators_rating INT NOT NULL,
  commission TEXT NOT NULL,
  commission_history TEXT NOT NULL,
  commission_rating INT NOT NULL,
  active_eras INT NOT NULL,
  era_points_history TEXT NOT NULL,
  era_points_percent TEXT NOT NULL,
  era_points_rating INT NOT NULL,
  performance TEXT NOT NULL,
  performance_history TEXT NOT NULL,
  relative_performance TEXT NOT NULL,
  relative_performance_history TEXT NOT NULL,
  slashed BOOLEAN NOT NULL,
  slash_rating INT NOT NULL,
  slashes TEXT NOT NULL,
  council_backing BOOLEAN NOT NULL,
  active_in_governance BOOLEAN NOT NULL,
  governance_rating INT NOT NULL,
  payout_history TEXT NOT NULL,
  payout_rating INT NOT NULL,
  self_stake BIGINT NOT NULL,
  other_stake BIGINT NOT NULL,
  total_stake BIGINT NOT NULL,
  stake_history TEXT NOT NULL,
  total_rating INT NOT NULL,
  dominated BOOLEAN NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height, stash_address )
);

CREATE TABLE IF NOT EXISTS era_vrc_score (  
  stash_address TEXT NOT NULL,
  era INT NOT NULL,
  vrc_score INT NOT NULL,
  PRIMARY KEY ( stash_address, era )
);

CREATE TABLE IF NOT EXISTS era_commission (  
  stash_address TEXT NOT NULL,
  era INT NOT NULL,
  commission FLOAT NOT NULL,
  PRIMARY KEY ( stash_address, era )
);

CREATE TABLE IF NOT EXISTS era_commission_avg (  
  era INT NOT NULL,
  commission_avg FLOAT NOT NULL,
  PRIMARY KEY ( era )
);

CREATE TABLE IF NOT EXISTS era_self_stake (  
  stash_address TEXT NOT NULL,
  era INT NOT NULL,
  self_stake BIGINT NOT NULL,
  PRIMARY KEY ( stash_address, era )
);

CREATE TABLE IF NOT EXISTS era_self_stake_avg (  
  era INT NOT NULL,
  self_stake_avg BIGINT NOT NULL,
  PRIMARY KEY ( era )
);

CREATE TABLE IF NOT EXISTS era_relative_performance (  
  stash_address TEXT NOT NULL,
  era INT NOT NULL,
  relative_performance FLOAT NOT NULL,
  PRIMARY KEY ( stash_address, era )
);

CREATE TABLE IF NOT EXISTS era_relative_performance_avg (
  era INT NOT NULL,
  relative_performance_avg FLOAT NOT NULL,
  PRIMARY KEY ( era )
);

CREATE TABLE IF NOT EXISTS era_points (  
  stash_address TEXT NOT NULL,
  era INT NOT NULL,
  points INT NOT NULL,
  PRIMARY KEY ( stash_address, era )
);

CREATE TABLE IF NOT EXISTS era_points_avg (
  era INT NOT NULL,
  points_avg FLOAT NOT NULL,
  PRIMARY KEY ( era )
);

CREATE TABLE IF NOT EXISTS featured (  
  stash_address TEXT NOT NULL,
  name TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( stash_address )
);

CREATE TABLE IF NOT EXISTS account  (  
  account_id TEXT NOT NULL,
  identity TEXT NOT NULL,
  identity_display TEXT NOT NULL,
  identity_display_parent TEXT NOT NULL,
  balances TEXT NOT NULL,
  available_balance TEXT NOT NULL,
  free_balance TEXT NOT NULL,
  locked_balance TEXT NOT NULL,
  nonce BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  block_height BIGINT NOT NULL,
  PRIMARY KEY ( account_id )  
);

CREATE TABLE IF NOT EXISTS total (  
  name TEXT,
  count BIGINT NOT NULL,
  PRIMARY KEY ( name )
);

INSERT INTO total (name, count) VALUES
  ('blocks', 0),
  ('extrinsics', 0),
  ('transfers', 0),
  ('events', 0),
  ('active_validator_count', 0),
  ('waiting_validator_count', 0),
  ('nominator_count', 0),
  ('current_era', 0),
  ('active_era', 0),
  ('minimum_stake', 0);

CREATE INDEX IF NOT EXISTS block_finalized_idx ON block (finalized);
CREATE INDEX IF NOT EXISTS block_block_number_idx ON block (block_number);
CREATE INDEX IF NOT EXISTS block_block_hash_idx ON block (block_hash);

CREATE INDEX IF NOT EXISTS extrinsic_block_number_idx ON extrinsic (block_number);
CREATE INDEX IF NOT EXISTS extrinsic_section_idx ON extrinsic (section);
CREATE INDEX IF NOT EXISTS extrinsic_method_idx ON extrinsic (method);
CREATE INDEX IF NOT EXISTS extrinsic_signer_idx ON extrinsic (signer);

CREATE INDEX IF NOT EXISTS signed_extrinsic_block_number_idx ON signed_extrinsic (block_number);
CREATE INDEX IF NOT EXISTS signed_extrinsic_section_idx ON signed_extrinsic (section);
CREATE INDEX IF NOT EXISTS signed_extrinsic_method_idx ON signed_extrinsic (method);
CREATE INDEX IF NOT EXISTS signed_extrinsic_signer_idx ON signed_extrinsic (signer);
CREATE INDEX IF NOT EXISTS signed_extrinsic_hash_idx ON signed_extrinsic (hash);

CREATE INDEX IF NOT EXISTS transfer_block_number_idx ON transfer (block_number);
CREATE INDEX IF NOT EXISTS transfer_section_idx ON transfer (section);
CREATE INDEX IF NOT EXISTS transfer_method_idx ON transfer (method);
CREATE INDEX IF NOT EXISTS transfer_source_idx ON transfer (source);
CREATE INDEX IF NOT EXISTS transfer_destination_idx ON transfer (destination);
CREATE INDEX IF NOT EXISTS transfer_hash_idx ON transfer (hash);

CREATE INDEX IF NOT EXISTS event_block_number_idx ON event (block_number);
CREATE INDEX IF NOT EXISTS event_section_idx ON event (section);
CREATE INDEX IF NOT EXISTS event_method_idx ON event (method);

CREATE INDEX IF NOT EXISTS staking_reward_block_number_idx ON staking_reward (block_number);
CREATE INDEX IF NOT EXISTS staking_reward_account_id_idx ON staking_reward (account_id);

CREATE INDEX IF NOT EXISTS staking_slash_block_number_idx ON staking_slash (block_number);
CREATE INDEX IF NOT EXISTS staking_slash_account_id_idx ON staking_slash (account_id);

GRANT ALL PRIVILEGES ON TABLE block TO polkastats;
GRANT ALL PRIVILEGES ON TABLE harvest_error TO polkastats;
GRANT ALL PRIVILEGES ON TABLE event TO polkastats;
GRANT ALL PRIVILEGES ON TABLE staking_reward TO polkastats;
GRANT ALL PRIVILEGES ON TABLE staking_slash TO polkastats;
GRANT ALL PRIVILEGES ON TABLE extrinsic TO polkastats;
GRANT ALL PRIVILEGES ON TABLE signed_extrinsic TO polkastats;
GRANT ALL PRIVILEGES ON TABLE transfer TO polkastats;
GRANT ALL PRIVILEGES ON TABLE ranking TO polkastats;

GRANT ALL PRIVILEGES ON TABLE era_vrc_score TO polkastats;
GRANT ALL PRIVILEGES ON TABLE era_commission TO polkastats;
GRANT ALL PRIVILEGES ON TABLE era_commission_avg TO polkastats;
GRANT ALL PRIVILEGES ON TABLE era_self_stake TO polkastats;
GRANT ALL PRIVILEGES ON TABLE era_self_stake_avg TO polkastats;
GRANT ALL PRIVILEGES ON TABLE era_relative_performance TO polkastats;
GRANT ALL PRIVILEGES ON TABLE era_relative_performance_avg TO polkastats;
GRANT ALL PRIVILEGES ON TABLE era_points TO polkastats;
GRANT ALL PRIVILEGES ON TABLE era_points_avg TO polkastats;
GRANT ALL PRIVILEGES ON TABLE featured TO polkastats;
GRANT ALL PRIVILEGES ON TABLE account TO polkastats;
GRANT ALL PRIVILEGES ON TABLE total TO polkastats;

--
-- Fast counters
--
-- Taken from https://www.cybertec-postgresql.com/en/postgresql-count-made-fast/
--

-- Block
START TRANSACTION;
CREATE FUNCTION block_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'blocks';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'blocks';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'blocks';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER block_count_mod
  AFTER INSERT OR DELETE ON block
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE block_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER block_count_trunc AFTER TRUNCATE ON block
  FOR EACH STATEMENT EXECUTE PROCEDURE block_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';
COMMIT;

-- Extrinsics
START TRANSACTION;
CREATE FUNCTION extrinsic_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'extrinsics';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'extrinsics';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'extrinsics';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER extrinsic_count_mod
  AFTER INSERT OR DELETE ON extrinsic
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE extrinsic_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER extrinsic_count_trunc AFTER TRUNCATE ON extrinsic
  FOR EACH STATEMENT EXECUTE PROCEDURE extrinsic_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
COMMIT;


-- Events
START TRANSACTION;
CREATE FUNCTION event_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'events';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'events';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'events';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER event_count_mod
  AFTER INSERT OR DELETE ON event
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE event_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER event_count_trunc AFTER TRUNCATE ON event
  FOR EACH STATEMENT EXECUTE PROCEDURE event_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';
COMMIT;

-- Transfers
START TRANSACTION;
CREATE FUNCTION transfer_count() RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE total SET count = count + 1 WHERE name = 'transfers';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE total SET count = count - 1 WHERE name = 'transfers';
    RETURN OLD;
  ELSE
    UPDATE total SET count = 0 WHERE name = 'transfers';
    RETURN NULL;
  END IF;
END;$$;
CREATE CONSTRAINT TRIGGER transfer_count_mod
  AFTER INSERT OR DELETE ON transfer
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE PROCEDURE transfer_count();
-- TRUNCATE triggers must be FOR EACH STATEMENT
CREATE TRIGGER transfer_count_trunc AFTER TRUNCATE ON transfer
  FOR EACH STATEMENT EXECUTE PROCEDURE transfer_count();
-- initialize the counter table
UPDATE total SET count = (SELECT count(*) FROM transfer) WHERE name = 'transfers';
COMMIT;