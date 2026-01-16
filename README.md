# equity-valuation-dashboard
equity-valuation-dashboard TIKR style

You will have **two main projects**: a Python valuation API (on Cloud Run) and a Next.js UI (on Vercel). [cloud.google](https://cloud.google.com/run/pricing)

***

## Python valuation API (Cloud Run)

**Files**

- `main.py`  
  - FastAPI app with:
    - `Assumptions` model for single ticker.  
    - `BatchRequest` / `BatchResponse` models for portfolios.  
    - `POST /analyze` returning `summary`, `hist_table`, `forecast_table`.  
    - `POST /analyze_batch` returning `results: [ {summary, hist_table, forecast_table}, … ]`.  
  - Uses your existing `analyze_ticker()` and `make_tables()` functions built from the Streamlit/Jupyter work.  

- `requirements.txt`  
  - At minimum: `fastapi`, `uvicorn[standard]`, `yfinance`, `pandas`, `numpy`, `matplotlib` (plus anything else your logic uses).  

- `Dockerfile`  
  - Python 3.11 slim base.  
  - Installs `requirements.txt`.  
  - Copies code.  
  - Starts FastAPI with Uvicorn on port `8080`:
    ```dockerfile
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
    ```

**Deployment**

1. Build and push image with Cloud Build. [cloudchipr](https://cloudchipr.com/blog/cloud-run-pricing)
2. Deploy to Cloud Run:
   - `--region` in a free‑tier region (e.g., `us-central1`).  
   - `--allow-unauthenticated`.  
   - `--cpu 0.5`, `--memory 512Mi` (or 1Gi).  
   - `--min-instances 0` so it scales to zero and stays inside the free tier under light use. [pump](https://www.pump.co/blog/google-cloud-run-pricing)
3. Note the HTTPS base URL, e.g. `https://valuation-api-xxxxx.a.run.app`.

***

## Next.js UI (Vercel)

**Files**

- Next.js app created with `create-next-app` (App Router). [vercel](https://vercel.com/docs/plans/hobby)
- `app/page.tsx`  
  - Client component with:
    - Textarea for comma‑separated tickers (e.g., `NOW,NFLX`).  
    - Numeric input for `yearsForward`.  
    - “Analyze” button.  
    - `handleAnalyze()` that POSTs to `NEXT_PUBLIC_API_URL + "/analyze_batch"` with:
      ```json
      { "tickers": [ { "ticker": "NOW", "years_forward": 4 }, ... ] }
      ```
    - Stores results in state:
      - First result drives the main card, chart, and tables.  
      - All results populate a portfolio summary table.  
  - Renders:
    - Top-left **summary card** (current price, target, total return, annualized IRR).  
    - Top-right **price forecast chart** (using `recharts` LineChart).  
    - Bottom-left **Historical** table.  
    - Bottom-right **Forecast Scenarios** table.  

- `components` (optional abstractions)  
  - `Card.tsx`, `PriceChart.tsx`, `HistoricalTable.tsx`, `ForecastTable.tsx` to keep layout close to TIKR screenshots.  

- Styling  
  - Tailwind or basic CSS modules for white cards, rounded borders, subtle shadows, matching the NOW/NFLX layout. [northflank](https://northflank.com/blog/render-vs-vercel)

- `package.json`  
  - Dependencies: `next`, `react`, `react-dom`, `recharts`, plus dev tooling.  

- `.env.local` (not committed)  
  - `NEXT_PUBLIC_API_URL="https://valuation-api-xxxxx.a.run.app"`.

**Deployment**

1. Push the Next.js repo to GitHub/GitLab/Bitbucket.  
2. In the Vercel dashboard:  
   - Import the repo as a new project. [freerdps](https://freerdps.com/blog/is-vercel-hosting-free/)
   - Vercel auto‑detects Next.js (build command `next build`, output `.next`). [vercel](https://vercel.com/docs/limits)
   - Configure environment variable `NEXT_PUBLIC_API_URL` to your Cloud Run URL. [kuberns](https://kuberns.com/blogs/post/vercel-app-guide/)
3. Deploy; Vercel builds and assigns a URL like `https://valuation-ui.vercel.app`. [linktly](https://www.linktly.com/infrastructure-software/vercel-review/)

On the **Hobby** (free) Vercel plan, this UI is free for personal use with bandwidth and function limits sufficient for a low‑traffic valuation dashboard. [northflank](https://northflank.com/blog/vercel-vs-netlify-choosing-the-deployment-platform-in-2025)
