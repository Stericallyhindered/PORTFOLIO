from app.db.session import SessionLocal
from app.models.models import Organization, Project


def run():
    db = SessionLocal()
    try:
        org = Organization(name="Demo GEO Org", slug="demo-geo-org", plan="pro")
        db.add(org)
        db.flush()
        project = Project(
            organization_id=org.id,
            name="GEO Command Center Demo",
            slug="geo-command-center-demo",
            brand_name="GEO Command Center",
            primary_domain="example.com",
        )
        db.add(project)
        db.commit()
        print("Seed completed")
    finally:
        db.close()


if __name__ == "__main__":
    run()
