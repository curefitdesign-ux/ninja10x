-- Add reaction_type support for emoji reactions
-- We'll store: 'heart', 'clap', 'fistbump', 'wow', 'fire'

-- No schema change needed since reaction_type already exists as TEXT
-- Just ensure we're using it properly