"""
RecommenderService — Singleton ML engine for StreamFlix.
Loads pre-trained models (SVD, TF-IDF, Decision Tree) and provides
hybrid recommendations combining collaborative filtering, content-based,
and decision tree filtering.
"""
import os
import logging
import threading
import numpy as np
import joblib
from django.conf import settings
from django.db import connection

logger = logging.getLogger(__name__)

# En Render (plan gratuito 512MB), no podemos cargar sklearn y pandas
# porque crashean por falta de memoria.
IS_RENDER = os.getenv('RENDER') is not None


class RecommenderService:
    """Singleton recommender service loaded once at Django startup."""

    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.ml_path = str(settings.ML_MODELS_PATH)
        self.loaded = False

        try:
            self._load_svd()
            self._load_content_based()
            self._load_decision_tree()
            self._build_id_mapping()
            self.loaded = True
            logger.info("RecommenderService: All models loaded successfully.")
        except Exception as e:
            logger.error(f"RecommenderService: Failed to load models: {e}")
            self.loaded = False

    def _load_svd(self):
        """Load SVD components and reconstruct the predicted ratings matrix."""
        svd_path = os.path.join(self.ml_path, 'svd_components.pkl')
        svd_data = joblib.load(svd_path)

        self.U = svd_data['U']
        self.sigma = svd_data['sigma']
        self.Vt = svd_data['Vt']
        self.user_means = svd_data['user_means']
        self.user2idx = svd_data['user2idx']
        self.movie2idx = svd_data['movie2idx']
        self.idx2movie = svd_data['idx2movie']

        # Reconstruct predicted ratings matrix
        self.R_predicted = np.clip(
            self.U @ np.diag(self.sigma) @ self.Vt, 1, 5
        )
        # Add user means back
        for i in range(self.R_predicted.shape[0]):
            self.R_predicted[i] += self.user_means[i]

        self.R_predicted = np.clip(self.R_predicted, 1, 5)

        logger.info(f"SVD loaded: R_predicted shape = {self.R_predicted.shape}")

    def _load_content_based(self):
        """Load TF-IDF, metadata, compute cosine similarity matrix."""
        if IS_RENDER:
            logger.warning("Render env: Skipping TF-IDF to save RAM.")
            self.cosine_sim_matrix = None
            return

        import pandas as pd
        from sklearn.metrics.pairwise import cosine_similarity

        metadata_path = os.path.join(self.ml_path, 'movies_metadata.csv')
        tfidf_path = os.path.join(self.ml_path, 'tfidf_vectorizer.pkl')
        indices_path = os.path.join(self.ml_path, 'movie_indices.pkl')

        self.metadata = pd.read_csv(metadata_path)

        # Create soup column
        self.metadata['Soup'] = self.metadata.apply(self._create_soup, axis=1)

        # Load TF-IDF vectorizer and transform
        self.tfidf = joblib.load(tfidf_path)
        tfidf_matrix = self.tfidf.transform(self.metadata['Soup'])

        # Compute cosine similarity
        self.cosine_sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

        # Load movie indices mapping
        indices_data = joblib.load(indices_path)
        if isinstance(indices_data, dict):
            self.movie_id_to_idx = indices_data.get('movie_id_to_idx', {})
            self.idx_to_movie_id = indices_data.get('idx_to_movie_id', {})
        else:
            # If it's a pandas Series
            self.movie_id_to_idx = {}
            self.idx_to_movie_id = {}
            if hasattr(indices_data, 'items'):
                for movie_id, idx in indices_data.items():
                    self.movie_id_to_idx[movie_id] = idx
                    self.idx_to_movie_id[idx] = movie_id

        logger.info(f"Content-based loaded: cosine_sim shape = {self.cosine_sim_matrix.shape}")

    @staticmethod
    def _create_soup(row):
        """Create the text soup for TF-IDF, matching the Colab implementation."""
        parts = []

        # Genres repeated 3x
        genres = str(row.get('Genres', '')).replace('|', ' ')
        parts.extend([genres] * 3)

        # Other features
        for col in ['Country', 'Language', 'Content_Rating', 'Era', 'Duration_Cat',
                     'Award_Winner', 'Is_Original']:
            val = str(row.get(col, '')).strip()
            if val and val.lower() != 'nan':
                parts.append(val)

        return ' '.join(parts).lower()

    def _load_decision_tree(self):
        """Load decision tree and label encoders."""
        if IS_RENDER:
            logger.warning("Render env: Skipping decision tree to save RAM.")
            self.decision_tree = None
            return

        dt_path = os.path.join(self.ml_path, 'decision_tree.pkl')
        le_path = os.path.join(self.ml_path, 'label_encoders.pkl')

        self.decision_tree = joblib.load(dt_path)
        self.label_encoders = joblib.load(le_path)

        logger.info("Decision tree and label encoders loaded.")

    def _build_id_mapping(self):
        """Build movielens_id ↔ database id mapping from PostgreSQL."""
        self.movielens_to_db = {}
        self.db_to_movielens = {}

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, movielens_id FROM movies WHERE movielens_id IS NOT NULL"
            )
            for row in cursor.fetchall():
                db_id, ml_id = row
                self.movielens_to_db[ml_id] = db_id
                self.db_to_movielens[db_id] = ml_id

        logger.info(f"ID mapping built: {len(self.movielens_to_db)} movies mapped.")

    # ─── Collaborative Filtering ────────────────────────────

    def get_cf_recommendations(self, user_id_db, n=20):
        """
        SVD-based collaborative filtering recommendations.
        Returns list of (db_movie_id, predicted_rating) tuples.
        """
        if not self.loaded:
            return []

        if user_id_db not in self.user2idx:
            return []  # cold start

        user_idx = self.user2idx[user_id_db]
        pred_row = self.R_predicted[user_idx].copy()

        # Exclude already watched movies
        watched_ml_ids = self._get_watched_movielens_ids(user_id_db)
        for ml_id in watched_ml_ids:
            if ml_id in self.movie2idx:
                pred_row[self.movie2idx[ml_id]] = -np.inf

        # Get top N
        top_n_idx = np.argsort(pred_row)[::-1][:n]

        results = []
        for idx in top_n_idx:
            if pred_row[idx] == -np.inf:
                continue
            ml_id = self.idx2movie.get(idx)
            if ml_id and ml_id in self.movielens_to_db:
                db_id = self.movielens_to_db[ml_id]
                results.append((db_id, float(pred_row[idx])))

        return results

    # ─── Content-Based ──────────────────────────────────────

    def get_content_recommendations(self, movielens_id, n=12):
        """
        Content-based recommendations using cosine similarity.
        Returns list of (db_movie_id, similarity_score) tuples.
        """
        if not self.loaded or getattr(self, 'cosine_sim_matrix', None) is None:
            return []

        if movielens_id not in self.movie_id_to_idx:
            return []

        idx = self.movie_id_to_idx[movielens_id]
        scores = self.cosine_sim_matrix[idx]
        top_n = np.argsort(scores)[::-1][1:n + 1]  # Exclude self

        results = []
        for i in top_n:
            ml_id = self.idx_to_movie_id.get(i)
            if ml_id and ml_id in self.movielens_to_db:
                db_id = self.movielens_to_db[ml_id]
                results.append((db_id, float(scores[i])))

        return results

    def get_content_recs_for_user(self, user_id_db, n=20):
        """
        Content-based recommendations aggregated from user's highly-rated movies.
        """
        if not self.loaded:
            return []

        # Get user's highly rated movies (>= 4.0)
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT m.movielens_id, r.rating
                FROM ratings r
                JOIN movies m ON r.movie_id = m.id
                WHERE r.user_id = %s AND r.rating >= 4.0 AND m.movielens_id IS NOT NULL
                ORDER BY r.rating DESC
                LIMIT 10
            """, [user_id_db])
            liked_movies = cursor.fetchall()

        if not liked_movies:
            return []

        scores_dict = {}
        for ml_id, rating in liked_movies:
            weight = (float(rating) - 4.0 + 1) / 2.0
            similar = self.get_content_recommendations(ml_id, n=5)
            for db_id, sim_score in similar:
                if db_id not in scores_dict:
                    scores_dict[db_id] = 0.0
                scores_dict[db_id] += sim_score * weight

        # Sort by aggregated score
        sorted_recs = sorted(scores_dict.items(), key=lambda x: x[1], reverse=True)
        return sorted_recs[:n]

    # ─── Decision Tree ──────────────────────────────────────

    def predict_will_like(self, user_id_db, db_movie_id):
        """
        Use decision tree to predict probability user will like a movie.
        Returns float [0-1].
        """
        if not self.loaded or getattr(self, 'decision_tree', None) is None:
            return 0.5
            
        import pandas as pd

        # Get movie movielens_id
        ml_id = self.db_to_movielens.get(db_movie_id)
        if ml_id is None:
            return 0.5

        # Find movie in metadata
        movie_row = self.metadata[self.metadata['MovieID'] == ml_id]
        if movie_row.empty:
            return 0.5

        movie_row = movie_row.iloc[0]

        # Get user info
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, country, language FROM users WHERE id = %s", [user_id_db]
            )
            user_row = cursor.fetchone()

        if not user_row:
            return 0.5

        try:
            # Build feature DataFrame matching the DT's expected features
            features = {}
            feature_cols = self.decision_tree.feature_names_in_ if hasattr(
                self.decision_tree, 'feature_names_in_'
            ) else []

            for col in feature_cols:
                val = movie_row.get(col, 0)
                if col in self.label_encoders:
                    le = self.label_encoders[col]
                    try:
                        val = le.transform([str(val)])[0]
                    except (ValueError, KeyError):
                        val = 0
                else:
                    try:
                        val = float(val) if val and str(val).lower() != 'nan' else 0.0
                    except (ValueError, TypeError):
                        val = 0.0
                features[col] = [val]

            df = pd.DataFrame(features)
            prob = self.decision_tree.predict_proba(df)[0][1]
            return float(prob)

        except Exception as e:
            logger.warning(f"DT prediction failed: {e}")
            return 0.5

    # ─── Hybrid ─────────────────────────────────────────────

    def get_hybrid_recommendations(self, user_id_db, n=20, alpha=0.6):
        """
        Hybrid recommendations: α*CF + (1-α)*CB + DT filter.
        """
        if not self.loaded:
            return self.cold_start_recommendations(user_id_db, n)

        cf_recs = self.get_cf_recommendations(user_id_db, n=n * 3)
        cb_recs = self.get_content_recs_for_user(user_id_db, n=n * 3)

        if not cf_recs and not cb_recs:
            return self.cold_start_recommendations(user_id_db, n)

        # Normalize scores to [0, 1]
        def normalize(recs):
            if not recs:
                return {}
            scores = [s for _, s in recs]
            min_s, max_s = min(scores), max(scores)
            rng = max_s - min_s if max_s != min_s else 1.0
            return {mid: (s - min_s) / rng for mid, s in recs}

        cf_norm = normalize(cf_recs)
        cb_norm = normalize(cb_recs)

        # Combine
        all_movie_ids = set(cf_norm.keys()) | set(cb_norm.keys())
        hybrid = {}

        for mid in all_movie_ids:
            cf_score = cf_norm.get(mid, 0.0)
            cb_score = cb_norm.get(mid, 0.0)
            h_score = alpha * cf_score + (1 - alpha) * cb_score

            # Bonus if in both
            if mid in cf_norm and mid in cb_norm:
                h_score += 0.05

            hybrid[mid] = h_score

        # Apply DT filter
        filtered = {}
        for mid, score in hybrid.items():
            prob = self.predict_will_like(user_id_db, mid)
            if prob < 0.45:
                continue
            adjusted = 0.7 * score + 0.3 * prob
            filtered[mid] = adjusted

        # Sort and return top N
        sorted_recs = sorted(filtered.items(), key=lambda x: x[1], reverse=True)
        return sorted_recs[:n]

    # ─── DB-Native Personalization ──────────────────────────

    def get_db_personalized_recommendations(self, user_id_db, n=20, plan_id=1):
        """
        Pure DB-driven personalized recommendations.
        Reads the user's actual ratings to build genre preference weights,
        then scores unrated movies by those weights × quality.
        Works regardless of movielens_id coverage.
        Returns list of (db_movie_id, score) tuples.
        """
        with connection.cursor() as cursor:

            # 1. Build genre weights from user's ratings + watchlist + history
            cursor.execute("""
                SELECT mg.genre_id,
                       SUM(
                           CASE
                               WHEN source_type = 'rating' THEN COALESCE(score, 3.0)
                               WHEN source_type = 'watchlist' THEN 4.0
                               WHEN source_type = 'history' THEN 3.5
                               ELSE 3.0
                           END
                       ) AS genre_score,
                       COUNT(*) AS cnt
                FROM (
                    SELECT movie_id, rating AS score, 'rating' AS source_type FROM ratings WHERE user_id = %s
                    UNION ALL
                    SELECT movie_id, 4.0 AS score, 'watchlist' AS source_type FROM user_watchlist WHERE user_id = %s
                    UNION ALL
                    SELECT movie_id, 3.5 AS score, 'history' AS source_type FROM watch_history WHERE user_id = %s
                ) as combined_signals
                JOIN movie_genres mg ON combined_signals.movie_id = mg.movie_id
                GROUP BY mg.genre_id
                ORDER BY genre_score DESC
            """, [user_id_db, user_id_db, user_id_db])
            genre_rows = cursor.fetchall()

        if not genre_rows:
            return []

        genre_weights = {gid: float(score) for gid, score, _ in genre_rows}

        # Normalise genre weights to [0, 1]
        max_w = max(genre_weights.values()) or 1.0
        genre_weights = {gid: w / max_w for gid, w in genre_weights.items()}

        with connection.cursor() as cursor:
            # 2. Get already consumed movie IDs (ratings, watchlist, history)
            cursor.execute("""
                SELECT DISTINCT movie_id FROM (
                    SELECT movie_id FROM ratings WHERE user_id = %s
                    UNION
                    SELECT movie_id FROM watch_history WHERE user_id = %s
                ) as consumed
            """, [user_id_db, user_id_db])
            rated_ids = tuple(row[0] for row in cursor.fetchall()) or (0,)

            # 3. Score candidate movies
            top_genre_ids = sorted(genre_weights, key=lambda g: -genre_weights[g])[:8]
            placeholders = ','.join(['%s'] * len(top_genre_ids))
            cursor.execute(f"""
                SELECT m.id,
                       COALESCE(m.weighted_rating, m.avg_rating, 3.0) AS quality,
                       mg.genre_id
                FROM movies m
                JOIN movie_genres mg ON m.id = mg.movie_id
                WHERE mg.genre_id IN ({placeholders})
                  AND m.is_active = TRUE
                  AND (m.min_plan_id <= %s OR m.min_plan_id IS NULL)
                  AND m.id NOT IN ({','.join(['%s'] * len(rated_ids))})
            """, top_genre_ids + [plan_id] + list(rated_ids))
            rows = cursor.fetchall()

        # 4. Aggregate scores per movie
        scores = {}
        quality_map = {}
        for movie_id, quality, genre_id in rows:
            pref = genre_weights.get(genre_id, 0.0)
            # Use MAX instead of SUM to prevent multi-genre movies (Action+Thriller+Crime) 
            # from artificially stacking points and beating a pure single-genre movie (Terror).
            scores[movie_id] = max(scores.get(movie_id, 0.0), pref)
            quality_map[movie_id] = float(quality or 3.0)

        if not quality_map:
            return []

        # 5. Final score = 0.65 preference + 0.35 quality (normalised)
        max_q = max(quality_map.values()) or 5.0
        final = []
        for mid, pref_score in scores.items():
            q = quality_map[mid] / max_q
            final.append((mid, 0.65 * pref_score + 0.35 * q))

        final.sort(key=lambda x: -x[1])
        return final[:n]

    # ─── Cold Start ─────────────────────────────────────────

    def cold_start_recommendations(self, user_id_db, n=20):
        """
        For new users: recommend top-rated movies from their favorite genres.
        """
        with connection.cursor() as cursor:
            # Get favorite genre IDs
            cursor.execute(
                "SELECT genre_id FROM user_genre_preferences WHERE user_id = %s",
                [user_id_db]
            )
            base_genre_ids = [row[0] for row in cursor.fetchall()]

            # Dynamically add genres from movies they rated >= 4.0 recently
            cursor.execute("""
                SELECT mg.genre_id 
                FROM ratings r
                JOIN movie_genres mg ON r.movie_id = mg.movie_id
                WHERE r.user_id = %s AND r.rating >= 4.0
                ORDER BY r.created_at DESC
                LIMIT 20
            """, [user_id_db])
            recent_genre_ids = [row[0] for row in cursor.fetchall()]

            # Combine and deduplicate
            genre_ids = list(set(base_genre_ids + recent_genre_ids))

            if not genre_ids:
                # Fallback: just top movies
                cursor.execute("""
                    SELECT id FROM movies
                    WHERE is_active = TRUE
                    ORDER BY weighted_rating DESC
                    LIMIT %s
                """, [n])
                return [(row[0], 1.0) for row in cursor.fetchall()]

            placeholders = ','.join(['%s'] * len(genre_ids))
            cursor.execute(f"""
                SELECT DISTINCT m.id, m.weighted_rating
                FROM movies m
                JOIN movie_genres mg ON m.id = mg.movie_id
                WHERE mg.genre_id IN ({placeholders})
                AND m.is_active = TRUE
                ORDER BY m.weighted_rating DESC
                LIMIT %s
            """, genre_ids + [n])

            return [(row[0], float(row[1])) for row in cursor.fetchall()]

    # ─── Helpers ────────────────────────────────────────────

    def _get_watched_movielens_ids(self, user_id_db):
        """Get set of movielens_ids the user has watched."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT DISTINCT m.movielens_id
                FROM watch_history wh
                JOIN movies m ON wh.movie_id = m.id
                WHERE wh.user_id = %s AND m.movielens_id IS NOT NULL
            """, [user_id_db])
            return {row[0] for row in cursor.fetchall()}
