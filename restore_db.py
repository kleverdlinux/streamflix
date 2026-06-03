import os
import re
import sys
import argparse
from urllib.parse import urlparse
import psycopg2

def main():
    parser = argparse.ArgumentParser(description="Restore StreamFlix database dump to a remote PostgreSQL database.")
    parser.add_argument("--url", help="Database connection URL (starts with postgresql:// or postgres://)")
    args = parser.parse_args()

    db_url = args.url
    if not db_url:
        db_url = input("Please enter your remote Database URL (from Render/Railway): ").strip()

    if not db_url:
        print("Error: No database URL provided.")
        sys.exit(1)

    # Normalize connection string for psycopg2 (replace postgres:// with postgresql:// if needed)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    sql_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "streamflix-v1.sql")
    if not os.path.exists(sql_file_path):
        print(f"Error: SQL dump file not found at {sql_file_path}")
        sys.exit(1)

    print(f"Reading SQL file: {sql_file_path}...")
    with open(sql_file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Clean up SQL commands that cause permission issues on cloud hosting:
    # 1. Remove ALTER TABLE ... OWNER TO ...
    # 2. Remove ALTER SEQUENCE ... OWNER TO ...
    # 3. Remove ALTER VIEW ... OWNER TO ...
    # 4. Remove comments and command-line imports like \restrict or \connect
    print("Cleaning up database dump for cloud deployment compatibility...")
    
    # Remove OWNER TO statements
    sql_content = re.sub(r'(?i)ALTER\s+(TABLE|SEQUENCE|VIEW|DATABASE|SCHEMA)\s+\S+\s+OWNER\s+TO\s+\S+;', '', sql_content)
    # Remove psql internal command line arguments like \restrict or \connect
    sql_content = re.sub(r'^\s*\\\S+.*$', '', sql_content, flags=re.MULTILINE)

    # Split SQL into blocks to execute them one by one. This prevents one minor error (like an extension warning)
    # from rolling back the whole migration.
    # We will split by empty lines or semicolons where appropriate, but executing blocks is safer.
    # Semicolon followed by newline is a good approximation of statement endings.
    statements = []
    current_statement = []
    for line in sql_content.splitlines():
        if line.strip().startswith("--") or not line.strip():
            continue
        current_statement.append(line)
        if line.strip().endswith(";"):
            statements.append("\n".join(current_statement))
            current_statement = []
    if current_statement:
        statements.append("\n".join(current_statement))

    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully!")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    print(f"Executing {len(statements)} SQL statements. This might take a minute...")
    success_count = 0
    fail_count = 0

    for i, stmt in enumerate(statements):
        stmt_strip = stmt.strip()
        if not stmt_strip:
            continue
        try:
            # Check for extension creation which might require superuser but is usually pre-installed
            if "CREATE EXTENSION" in stmt_strip:
                print("Skipping or trying extension creation...")
                try:
                    cur.execute(stmt_strip)
                    success_count += 1
                except Exception as ext_err:
                    print(f"  Extension warning (ignoring): {ext_err}")
                    conn.rollback() if not conn.autocommit else None
                continue

            cur.execute(stmt_strip)
            success_count += 1
        except Exception as stmt_err:
            fail_count += 1
            # Check if it's a minor error like table already exists or permission
            err_msg = str(stmt_err).strip()
            if "already exists" in err_msg:
                # Normal if running script twice, skip warning
                pass
            else:
                print(f"Statement {i+1} failed: {err_msg}")
                print(f"Failed query preview: {stmt_strip[:150]}...")
            
            if not conn.autocommit:
                conn.rollback()

    cur.close()
    conn.close()
    
    print("\n--- RESTORE STATUS ---")
    print(f"Successfully executed: {success_count} statements.")
    print(f"Failed/Skipped statements: {fail_count}")
    print("Database restoration complete!")

if __name__ == "__main__":
    main()
