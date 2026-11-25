-- Agency-shared, audition/stage scoped review bookmarks. Never changes assessment state.
CREATE TABLE application_shortlists (
    agency_user_id UUID NOT NULL REFERENCES users(id),
    audition_id UUID NOT NULL REFERENCES auditions(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number >= 0),
    saved_by UUID NOT NULL REFERENCES users(id),
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    memo TEXT CHECK (char_length(memo) <= 1000),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (agency_user_id, audition_id, application_id, round_number)
);
CREATE INDEX application_shortlists_scope ON application_shortlists(audition_id, round_number, application_id);
