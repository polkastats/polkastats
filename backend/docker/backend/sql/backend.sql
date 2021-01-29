GRANT ALL PRIVILEGES ON DATABASE polkastats TO polkastats;

CREATE TABLE IF NOT EXISTS block (  
  block_number BIGINT NOT NULL,
  block_author TEXT NOT NULL,
  block_author_name TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsics_root TEXT NOT NULL,
  state_root TEXT NOT NULL,
  active_era BIGINT NOT NULL,
  session_index BIGINT NOT NULL,
  is_election BOOLEAN NOT NULL,
  total_events INT NOT NULL,
  total_extrinsics INT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )  
);

CREATE TABLE IF NOT EXISTS harvester_error (  
  block_number BIGINT NOT NULL,
  error TEXT NOT NULL,
  timestamp BIGINT NOT NULL
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
  success BOOLEAN NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, extrinsic_index ) 
);

CREATE INDEX IF NOT EXISTS extrinsic_section_idx ON extrinsic (section);
CREATE INDEX IF NOT EXISTS extrinsic_method_idx ON extrinsic (method);
CREATE INDEX IF NOT EXISTS extrinsic_signer_idx ON extrinsic (signer);

GRANT ALL PRIVILEGES ON TABLE block TO polkastats;
GRANT ALL PRIVILEGES ON TABLE harvester_error TO polkastats;
GRANT ALL PRIVILEGES ON TABLE event TO polkastats;
GRANT ALL PRIVILEGES ON TABLE extrinsic TO polkastats;
GRANT ALL PRIVILEGES ON TABLE ranking TO polkastats;
