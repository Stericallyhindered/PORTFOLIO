"""
Migration script to add full content columns to the pages table,
site_profiles columns, and pipeline_logs table.
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine


def migrate():
    """Add all missing columns and tables for the GEO pipeline."""
    
    # Columns to add to pages table
    pages_columns = [
        ("headings_json", "JSONB"),
        ("full_text", "TEXT"),
        ("links_json", "JSONB"),
        ("schema_json", "JSONB"),
    ]
    
    # Columns to add to site_profiles table
    site_profiles_columns = [
        ("industries_json", "JSONB"),
        ("products_json", "JSONB"),
        ("services_json", "JSONB"),
        ("features_json", "JSONB"),
        ("pain_points_json", "JSONB"),
        ("customer_types_json", "JSONB"),
        ("subindustries_json", "JSONB"),
        ("use_cases_json", "JSONB"),
        ("locations_json", "JSONB"),
        ("competitors_json", "JSONB"),
        ("core_topics_json", "JSONB"),
        ("supporting_topics_json", "JSONB"),
        ("keywords_json", "JSONB"),
        ("faq_questions_json", "JSONB"),
        ("claims_json", "JSONB"),
    ]
    
    with engine.connect() as conn:
        # Add pages columns
        print("Adding columns to pages table...")
        for column_name, column_type in pages_columns:
            try:
                conn.execute(text(f"""
                    ALTER TABLE pages 
                    ADD COLUMN IF NOT EXISTS {column_name} {column_type}
                """))
                print(f"  Added: pages.{column_name}")
            except Exception as e:
                print(f"  Skipped pages.{column_name}: {e}")
        
        # Add site_profiles columns
        print("\nAdding columns to site_profiles table...")
        for column_name, column_type in site_profiles_columns:
            try:
                conn.execute(text(f"""
                    ALTER TABLE site_profiles 
                    ADD COLUMN IF NOT EXISTS {column_name} {column_type}
                """))
                print(f"  Added: site_profiles.{column_name}")
            except Exception as e:
                print(f"  Skipped site_profiles.{column_name}: {e}")
        
        # Create pipeline_logs table
        print("\nCreating pipeline_logs table...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS pipeline_logs (
                    id VARCHAR PRIMARY KEY,
                    pipeline_run_id VARCHAR NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
                    timestamp TIMESTAMP DEFAULT NOW(),
                    level VARCHAR(20) NOT NULL,
                    stage VARCHAR(60) NOT NULL,
                    message TEXT NOT NULL,
                    details_json JSONB,
                    progress FLOAT DEFAULT 0.0
                )
            """))
            print("  Created: pipeline_logs table")
        except Exception as e:
            print(f"  Skipped pipeline_logs table: {e}")
        
        # Add columns to prompt_generation_runs table
        print("\nAdding columns to prompt_generation_runs table...")
        prompt_gen_columns = [
            ("site_context_json", "JSONB"),
            ("topic_graph_json", "JSONB"),
            ("seeds_generated", "INTEGER"),
            ("prompts_expanded", "INTEGER"),
            ("prompts_after_dedupe", "INTEGER"),
            ("prompts_after_quality", "INTEGER"),
            ("tier1_count", "INTEGER"),
            ("tier2_count", "INTEGER"),
            ("tier3_count", "INTEGER"),
            ("dedupe_stats_json", "JSONB"),
            ("quality_stats_json", "JSONB"),
            ("tier_stats_json", "JSONB"),
        ]
        for column_name, column_type in prompt_gen_columns:
            try:
                conn.execute(text(f"""
                    ALTER TABLE prompt_generation_runs 
                    ADD COLUMN IF NOT EXISTS {column_name} {column_type}
                """))
                print(f"  Added: prompt_generation_runs.{column_name}")
            except Exception as e:
                print(f"  Skipped prompt_generation_runs.{column_name}: {e}")
        
        # Create index for faster log queries
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_pipeline_logs_run_id 
                ON pipeline_logs(pipeline_run_id)
            """))
            print("  Created: idx_pipeline_logs_run_id index")
        except Exception as e:
            print(f"  Skipped index: {e}")
        
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_pipeline_logs_timestamp 
                ON pipeline_logs(timestamp DESC)
            """))
            print("  Created: idx_pipeline_logs_timestamp index")
        except Exception as e:
            print(f"  Skipped index: {e}")
        
        conn.commit()
    
    print("\nMigration complete!")


if __name__ == "__main__":
    migrate()
