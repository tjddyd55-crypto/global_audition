CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('APPLICANT','AGENCY','ADMIN')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE auditions (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','OPEN','CLOSED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY,
  audition_id UUID NOT NULL REFERENCES auditions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED','REVIEWED','ACCEPTED','REJECTED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (audition_id, applicant_id)
);

-- indexes
CREATE INDEX idx_auditions_owner ON auditions(owner_id);
CREATE INDEX idx_applications_audition ON applications(audition_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);