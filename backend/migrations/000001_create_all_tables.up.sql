CREATE TABLE IF NOT EXISTS users  (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS ministry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS user_ministry (
    user_id UUID NOT NULL,
    ministry_id UUID NOT NULL,
    PRIMARY KEY (user_id, ministry_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ministry_id) REFERENCES ministry(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_ministry_user ON user_ministry(user_id);
CREATE INDEX idx_user_ministry_ministry ON user_ministry(ministry_id);



CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    UNIQUE (ministry_id, name),
    FOREIGN KEY (ministry_id) REFERENCES ministry(id)
);

CREATE TABLE IF NOT EXISTS ministry_role_assignment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ministry_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by_user_id UUID NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ministry_id) REFERENCES ministry(id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (granted_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_mra_user ON ministry_role_assignment(user_id);
CREATE INDEX idx_mra_ministry ON ministry_role_assignment(ministry_id);


CREATE TABLE IF NOT EXISTS layout_slot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    multiple BOOLEAN NOT NULL DEFAULT FALSE,
    order_position INT NOT NULL DEFAULT 0,

    UNIQUE (ministry_id, code)

    FOREIGN KEY (ministry_id) REFERENCES ministry(id)
);

CREATE INDEX idx_layout_slot_ministry ON layout_slot(ministry_id);



CREATE TABLE IF NOT EXISTS schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ministry_id) REFERENCES ministry(id)
);

CREATE INDEX idx_schedule_ministry ON schedule(ministry_id);



CREATE TABLE IF NOT EXISTS schedule_slot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL,
    layout_slot_id UUID NOT NULL,
    position INT NOT NULL DEFAULT 1,
    FOREIGN KEY (schedule_id) REFERENCES schedule(id),
    FOREIGN KEY (layout_slot_id) REFERENCES layout_slot(id)
);

CREATE INDEX idx_schedule_slot_schedule ON schedule_slot(schedule_id);



CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_availability_user ON availability(user_id);



CREATE TABLE IF NOT EXISTS assignment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL,           -- qual evento
    user_id UUID NOT NULL,               -- quem será atribuído
    layout_slot_id UUID,                 -- opcional: usado quando a posição importa
    role_id UUID,                        -- opcional: usado quando o papel importa
    assigned_by_user_id UUID NOT NULL,   -- quem fez a atribuição
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (schedule_id) REFERENCES schedule(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (layout_slot_id) REFERENCES layout_slot(id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id)
);

-- Indexes para consultas comuns
CREATE INDEX idx_assignment_schedule ON assignment(schedule_id);
CREATE INDEX idx_assignment_user ON assignment(user_id);
CREATE INDEX idx_assignment_layout_slot ON assignment(layout_slot_id);
CREATE INDEX idx_assignment_role ON assignment(role_id);