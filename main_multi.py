from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Assumptions(BaseModel):
    ticker: str
    years_forward: int = 4
    rev_mid: float = 0.18
    rev_low: float = 0.165
    rev_high: float = 0.20
    margin_mid: float = 0.27
    margin_low: float = 0.25
    margin_high: float = 0.28
    pe_exit_mid: float = 30.0
    pe_exit_low: float = 25.0
    pe_exit_high: float = 35.0

class BatchRequest(BaseModel):
    tickers: List[Assumptions]

class SingleResult(BaseModel):
    summary: dict
    hist_table: list
    forecast_table: list

class BatchResponse(BaseModel):
    results: List[SingleResult]

@app.post("/analyze", response_model=SingleResult)
def analyze_single(a: Assumptions):
    summary, _prices = analyze_ticker(
        ticker=a.ticker,
        years_forward=a.years_forward,
        rev_mid=a.rev_mid,
        rev_low=a.rev_low,
        rev_high=a.rev_high,
        margin_mid=a.margin_mid,
        margin_low=a.margin_low,
        margin_high=a.margin_high,
        pe_exit_mid=a.pe_exit_mid,
        pe_exit_low=a.pe_exit_low,
        pe_exit_high=a.pe_exit_high,
    )
    hist_table, forecast_table = make_tables(summary)
    return {
        "summary": summary,
        "hist_table": hist_table.to_dict(orient="records"),
        "forecast_table": forecast_table.to_dict(orient="records"),
    }

@app.post("/analyze_batch", response_model=BatchResponse)
def analyze_batch(req: BatchRequest):
    batch_results = []
    for a in req.tickers:
        summary, _prices = analyze_ticker(
            ticker=a.ticker,
            years_forward=a.years_forward,
            rev_mid=a.rev_mid,
            rev_low=a.rev_low,
            rev_high=a.rev_high,
            margin_mid=a.margin_mid,
            margin_low=a.margin_low,
            margin_high=a.margin_high,
            pe_exit_mid=a.pe_exit_mid,
            pe_exit_low=a.pe_exit_low,
            pe_exit_high=a.pe_exit_high,
        )
        hist_table, forecast_table = make_tables(summary)
        batch_results.append({
            "summary": summary,
            "hist_table": hist_table.to_dict(orient="records"),
            "forecast_table": forecast_table.to_dict(orient="records"),
        })
    return {"results": batch_results}

