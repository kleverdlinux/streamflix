import psycopg2

tables_to_check = [
    'users', 'movies', 'ratings', 'watch_history', 
    'recommendations', 'genres', 'movie_genres', 'user_genre_preferences'
]

conn = psycopg2.connect(dbname='streamflix_db', user='postgres', password='admin1234', host='localhost', port='5432')
cur = conn.cursor()

for table in tables_to_check:
    print(f"\n--- Table: {table} ---")
    cur.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '{table}' 
        ORDER BY ordinal_position;
    """)
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]}")

conn.close()
