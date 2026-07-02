# GEO Command Center Backend

This backend is built to align with the `GEO_PROMPT.txt` architecture:

- GEO prompt-cluster generation engine
- GEO multi-engine run abstraction (`chatgpt`, `google-ai-overviews`, `perplexity`, `gemini`, `claude`)
- GEO citation/mention normalization
- GEO scoring formulas (`page`, `cluster`, `project`)
- GEO recommendation/report service surfaces

## Run local

```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Initialize DB (choose one):

```bash
python app/db/init_db.py
```

or Alembic:

```bash
alembic -c alembic.ini upgrade head
```

## Test

```bash
pytest tests
```

## API routes

- `POST /api/v1/prompts/generate`
- `POST /api/v1/scores/page`
- `POST /api/v1/scores/cluster`
- `POST /api/v1/scores/project`
- `GET /api/v1/engine-runs/engines`
- `POST /api/v1/engine-runs/run`
- `POST /api/v1/crawl/start`
- `GET /api/v1/crawl/status/{project_id}`
- `GET /api/v1/recommendations`
- `GET /api/v1/reports/overview`

Most routes are multi-tenant scoped. Send `x-org-id` header:

```http
x-org-id: <organization_uuid>
```

This is intentionally modular so provider adapters and scoring subsystems can be extended without rewiring API surfaces.
