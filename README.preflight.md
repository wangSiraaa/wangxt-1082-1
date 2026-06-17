# Trae Preflight

This folder is prepared for `wangxt-1082-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18382
- API_PORT: 19382
- WEB_PORT: 20382
- DB_PORT: 21382
- REDIS_PORT: 22382

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
