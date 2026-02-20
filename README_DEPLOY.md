Deployment

This repository includes a `Dockerfile` and a GitHub Actions workflow to build and publish a container to GitHub Container Registry (GHCR).

Build locally

```bash
# from repo root
docker build -t intermediary-health-hub:local .
docker run -p 8000:8000 intermediary-health-hub:local
# open http://localhost:8000
```

Publish via GitHub Actions

- Push to the `main` branch to trigger `.github/workflows/publish-image.yml`.
- The workflow pushes images to `ghcr.io/<owner>/<repo>` using the repository's `GITHUB_TOKEN`.

Notes

- After the image is published you can deploy it to any container host (Render, Fly, Railway, AWS ECS, GCP Cloud Run, etc.).
- For a one-click platform-specific deployment, I can add `render.yaml` or `fly.toml` next—tell me the provider.

Frontend on Vercel

1. Connect your GitHub repository to Vercel (https://vercel.com/new) and select this repo.
2. Set the **Root Directory** to `frontend` (or leave default and Vercel will detect the `frontend` folder).
3. No build command is required for a static `index.html`; Vercel will serve the `frontend` directory as a static site.

Or use the Vercel CLI from your machine:

```bash
npm i -g vercel
cd frontend
vercel --prod
```

Notes on the backend

- The GitHub Actions workflow publishes a Docker image to GitHub Container Registry (`ghcr.io/<owner>/<repo>`).
- Vercel is optimized for static frontends and serverless functions; for a FastAPI backend the recommended options are:
	- Deploy the Docker image to a container host (Render, Fly, Railway, Google Cloud Run, AWS ECS) and point the frontend to the backend URL.
	- Alternatively, convert the backend into serverless functions (non-trivial for FastAPI) if you want to host everything on Vercel.

Render quick example (deploy image)

- Create a new Web Service on Render and choose "Deploy from a Docker image". Use the GHCR image URL produced by the GitHub Action.

If you want, I can add a `render.yaml` or `fly.toml` to make one-click deploys for a container host—tell me which provider and I'll scaffold it.

Render one-click via `render.yaml`

1. I added a `render.yaml` in the repo root. Edit the `repo` field to `github.com/<your-org-or-username>/<repo-name>` so Render can import it automatically.
2. In the Render dashboard choose "New -> Import from Git" and select this repository. Render will detect `render.yaml` and create the service.
3. The service uses the `Dockerfile` at the repo root and exposes `/api/health` as the health check.

If you'd like, I can replace the placeholder repo value in `render.yaml` with your actual GitHub repo path if you give it to me.
