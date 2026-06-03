-- ============================================================
-- STREAMFLIX — PostgreSQL
-- ============================================================

-- Extensión para UUIDs (opcional pero útil para IDs públicos)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PLANES DE SUSCRIPCIÓN
-- Tabla maestra: se define una vez, no cambia frecuentemente
-- ============================================================
CREATE TABLE subscription_plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(30) NOT NULL UNIQUE,   -- 'Gratuito','Básico','Intermedio','Premium'
    price_monthly   DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    max_devices     SMALLINT NOT NULL DEFAULT 1,
    max_quality     VARCHAR(10) NOT NULL DEFAULT 'SD',  -- SD, HD, FHD, 4K
    has_downloads   BOOLEAN NOT NULL DEFAULT FALSE,
    has_ads         BOOLEAN NOT NULL DEFAULT TRUE,
    ai_priority     SMALLINT NOT NULL DEFAULT 1,   -- 1=baja, 4=alta (prioridad modelo IA)
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- USUARIOS
-- Separado de auth_user de Django: extendemos con perfil propio
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL, -- ID público (no exponer PK interna)
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,             -- Django maneja el hashing
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    avatar_url      VARCHAR(500),
    country         VARCHAR(60) DEFAULT 'Peru',
    language        VARCHAR(10) DEFAULT 'es',          -- código ISO
    birth_date      DATE,
    gender          CHAR(1) CHECK (gender IN ('M','F','O')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login      TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- SUSCRIPCIONES DE USUARIO
-- Un usuario tiene una suscripción activa a la vez
-- Historial completo de cambios de plan
-- ============================================================
CREATE TABLE user_subscriptions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         INTEGER NOT NULL REFERENCES subscription_plans(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','cancelled','expired','paused')),
    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at      TIMESTAMP WITH TIME ZONE,          -- NULL = sin vencimiento (Gratuito)
    cancelled_at    TIMESTAMP WITH TIME ZONE,
    auto_renew      BOOLEAN NOT NULL DEFAULT TRUE,
    payment_ref     VARCHAR(200),                      -- referencia de pago externo
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- GÉNEROS
-- Tabla normalizada: evita repetir strings en movies
-- ============================================================
CREATE TABLE genres (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(60) NOT NULL UNIQUE,
    slug    VARCHAR(60) NOT NULL UNIQUE  -- para URLs: 'sci-fi', 'action'
);

-- ============================================================
-- ACTORES / DIRECTORES
-- Tabla única para personas del equipo de una película
-- ============================================================
CREATE TABLE people (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(200) NOT NULL,
    slug        VARCHAR(200) NOT NULL UNIQUE,
    birth_date  DATE,
    nationality VARCHAR(80),
    photo_url   VARCHAR(500),
    bio         TEXT
);

-- ============================================================
-- PELÍCULAS
-- Núcleo del sistema. Referenciada por casi todas las demás tablas.
-- ============================================================
CREATE TABLE movies (
    id                  SERIAL PRIMARY KEY,
    movielens_id        INTEGER UNIQUE,           -- ID original MovieLens (para mapear con el modelo IA)
    title               VARCHAR(300) NOT NULL,
    title_original      VARCHAR(300),
    slug                VARCHAR(300) NOT NULL UNIQUE,
    description         TEXT,
    year                SMALLINT,
    duration_min        SMALLINT,                 -- duración en minutos
    content_rating      VARCHAR(10),              -- G, PG, PG-13, R, NC-17
    language            VARCHAR(30) DEFAULT 'English',
    country             VARCHAR(80),
    poster_url          VARCHAR(500),
    backdrop_url        VARCHAR(500),
    trailer_youtube_id  VARCHAR(50),              -- ID del video YouTube para embed
    imdb_rating         DECIMAL(3,1),
    weighted_rating     DECIMAL(5,4) DEFAULT 0.0, -- rating calculado por el modelo (fórmula IMDb)
    avg_rating          DECIMAL(5,4) DEFAULT 0.0,
    num_ratings         INTEGER DEFAULT 0,
    is_original         BOOLEAN NOT NULL DEFAULT FALSE,  -- StreamFlix Original
    award_winner        BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    min_plan_id         INTEGER REFERENCES subscription_plans(id) DEFAULT 1, -- plan mínimo para ver
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- RELACIONES PELÍCULA ↔ GÉNERO (many-to-many)
-- ============================================================
CREATE TABLE movie_genres (
    movie_id    INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    genre_id    INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,   -- género principal para el modelo IA
    PRIMARY KEY (movie_id, genre_id)
);

-- ============================================================
-- RELACIONES PELÍCULA ↔ PERSONA (elenco y dirección)
-- ============================================================
CREATE TABLE movie_people (
    movie_id    INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    person_id   INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('director','actor','producer','writer')),
    character   VARCHAR(200),   -- nombre del personaje (solo para actores)
    billing     SMALLINT,       -- orden de crédito (1 = protagonista)
    PRIMARY KEY (movie_id, person_id, role)
);

-- ============================================================
-- HISTORIAL DE VISUALIZACIÓN
-- Registra cada sesión de reproducción del usuario
-- Fuente principal de datos para el modelo de recomendación
-- ============================================================
CREATE TABLE watch_history (
    id              BIGSERIAL PRIMARY KEY,         -- BIGSERIAL por el volumen esperado
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id        INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    watched_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_pct    SMALLINT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    device_type     VARCHAR(20) DEFAULT 'web'      -- web, mobile, tv
                    CHECK (device_type IN ('web','mobile','tv','tablet')),
    session_minutes SMALLINT DEFAULT 0
);

-- ============================================================
-- CALIFICACIONES (ratings)
-- Un usuario califica una película una sola vez (UNIQUE constraint)
-- UPDATE si ya existe, INSERT si es nueva
-- ============================================================
CREATE TABLE ratings (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id    INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    rating      DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 5.0),
    liked       BOOLEAN,                           -- like/dislike explícito (además del rating numérico)
    review      TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, movie_id)                     -- un rating por usuario por película
);

-- ============================================================
-- LISTA PERSONAL (Mi Lista)
-- Películas que el usuario guarda para ver después
-- ============================================================
CREATE TABLE user_watchlist (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id    INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    added_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, movie_id)
);

-- ============================================================
-- PREFERENCIAS DE USUARIO
-- Géneros y actores favoritos: cold-start fix para el modelo IA
-- Se recogen en el registro y se actualizan con el comportamiento
-- ============================================================
CREATE TABLE user_genre_preferences (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre_id    INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    weight      DECIMAL(4,3) DEFAULT 1.000,        -- 0.000-1.000, aumenta con interacción
    source      VARCHAR(20) DEFAULT 'explicit'
                CHECK (source IN ('explicit','implicit')), -- explicit=eligió al registrarse, implicit=calculado
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, genre_id)
);

CREATE TABLE user_actor_preferences (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_id   INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    weight      DECIMAL(4,3) DEFAULT 1.000,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, person_id)
);

-- ============================================================
-- RECOMENDACIONES (caché del modelo IA)
-- El modelo genera top-N para cada usuario y se guarda aquí
-- Django lee de esta tabla — no llama al modelo en cada request
-- Se recalcula en batch (tarea periódica con Celery o cron)
-- ============================================================
CREATE TABLE recommendations (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id        INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    score           DECIMAL(8,6) NOT NULL,          -- score híbrido [0-1]
    rank            SMALLINT NOT NULL,               -- posición 1-N en la lista del usuario
    model_version   VARCHAR(20) DEFAULT '1.0',
    generated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at      TIMESTAMP WITH TIME ZONE,        -- para saber si el caché expiró
    UNIQUE (user_id, movie_id)
);

-- ============================================================
-- MÉTRICAS DEL MODELO IA (para el panel de administrador)
-- Cada vez que se re-entrena el modelo se inserta un registro
-- ============================================================
CREATE TABLE model_metrics (
    id              SERIAL PRIMARY KEY,
    version         VARCHAR(20) NOT NULL,
    rmse            DECIMAL(8,6),
    mae             DECIMAL(8,6),
    rmse_cv         DECIMAL(8,6),
    precision_at_5  DECIMAL(8,6),
    precision_at_10 DECIMAL(8,6),
    recall_at_5     DECIMAL(8,6),
    ndcg_at_5       DECIMAL(8,6),
    ndcg_at_10      DECIMAL(8,6),
    f1_dt           DECIMAL(8,6),
    improvement_pct DECIMAL(6,2),
    n_users         INTEGER,
    n_movies        INTEGER,
    n_ratings       INTEGER,
    trained_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes           TEXT
);

-- ============================================================
-- ADMINISTRADORES
-- Tabla separada de users para mayor seguridad
-- Un admin también existe en users con is_admin=TRUE
-- ============================================================
CREATE TABLE admin_logs (
    id          BIGSERIAL PRIMARY KEY,
    admin_id    INTEGER NOT NULL REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,             -- 'movie.create', 'user.suspend', etc.
    target_type VARCHAR(50),                       -- 'movie', 'user', 'plan'
    target_id   INTEGER,
    detail      JSONB,                             -- datos del cambio en formato JSON
    ip_address  INET,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES — críticos para performance con millones de registros
-- ============================================================

CREATE INDEX idx_pwd_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_pwd_reset_user  ON password_reset_tokens(user_id);

-- Búsquedas frecuentes en movies
CREATE INDEX idx_movies_movielens_id ON movies(movielens_id);
CREATE INDEX idx_movies_year ON movies(year);
CREATE INDEX idx_movies_weighted_rating ON movies(weighted_rating DESC);
CREATE INDEX idx_movies_is_active ON movies(is_active);
CREATE INDEX idx_movies_content_rating ON movies(content_rating);

-- Watch history: consultas por usuario y por película
CREATE INDEX idx_watch_history_user ON watch_history(user_id);
CREATE INDEX idx_watch_history_movie ON watch_history(movie_id);
CREATE INDEX idx_watch_history_watched_at ON watch_history(watched_at DESC);

-- Ratings: acceso por usuario y por película
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_movie ON ratings(movie_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);

-- Recomendaciones: acceso por usuario ordenado por rank
CREATE INDEX idx_recommendations_user_rank ON recommendations(user_id, rank);
CREATE INDEX idx_recommendations_expires ON recommendations(expires_at);

-- Suscripciones activas
CREATE INDEX idx_subscriptions_user_status ON user_subscriptions(user_id, status);

-- Historial de admin
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- ============================================================
-- DATOS INICIALES — Planes de suscripción
-- ============================================================
INSERT INTO subscription_plans (name, price_monthly, max_devices, max_quality, has_downloads, has_ads, ai_priority, description) VALUES
('Gratuito',    0.00,  1, 'SD',  FALSE, TRUE,  1, 'Acceso gratuito con anuncios. Calidad SD. Recomendaciones básicas.'),
('Básico',      8.99,  2, 'HD',  FALSE, FALSE, 2, 'Sin anuncios. Calidad HD. 2 dispositivos simultáneos.'),
('Intermedio', 12.99,  3, 'FHD', FALSE, FALSE, 3, 'Sin anuncios. Full HD. 3 dispositivos. Lista personal ilimitada.'),
('Premium',    17.99,  4, '4K',  TRUE,  FALSE, 4, 'Sin anuncios. 4K. 4 dispositivos. Descargas. IA prioritaria.');

-- Géneros base (los mismos que usa MovieLens + extras StreamFlix)
INSERT INTO genres (name, slug) VALUES
('Action', 'action'), ('Adventure', 'adventure'), ('Animation', 'animation'),
('Children''s', 'childrens'), ('Comedy', 'comedy'), ('Crime', 'crime'),
('Documentary', 'documentary'), ('Drama', 'drama'), ('Fantasy', 'fantasy'),
('Film-Noir', 'film-noir'), ('Horror', 'horror'), ('Musical', 'musical'),
('Mystery', 'mystery'), ('Romance', 'romance'), ('Sci-Fi', 'sci-fi'),
('Thriller', 'thriller'), ('War', 'war'), ('Western', 'western');

-- Insertar métricas iniciales del modelo entrenado en Colab
INSERT INTO model_metrics (version, rmse, mae, rmse_cv, precision_at_5, precision_at_10,
    recall_at_5, ndcg_at_5, ndcg_at_10, f1_dt, improvement_pct, n_users, n_movies, n_ratings, notes)
VALUES ('1.0', 0.8470, 0.6588, 0.9638, 0.4059, 0.3051,
        0.1656, 0.4718, 0.4165, 0.7198, 22.19, 6040, 3416, 999611,
        'Modelo inicial. SVD scipy k=50. Trained on MovieLens 1M + StreamFlix attributes.');

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;