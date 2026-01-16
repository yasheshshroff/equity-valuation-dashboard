"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Summary = {
  ticker: string;
  name: string;
  current_price: number;
  target_price_mid: number;
  total_return_mid: number;
  annualized_mid: number;
};

type Row = { [key: string]: any };

export default function Home() {
  const [ticker, setTicker] = useState("NOW");
  const [yearsForward, setYearsForward] = useState(4);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [hist, setHist] = useState<Row[]>([]);
  const [forecast, setForecast] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Cloud Run URL

  const handleAnalyze = async () => {
    if (!apiUrl) {
      setError("API URL not configured");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, years_forward: yearsForward }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setSummary(data.summary);
      setHist(data.hist_table);
      setForecast(data.forecast_table);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    summary && forecast.length > 0
      ? Array.from({ length: yearsForward + 1 }).map((_, i) => ({
          year: i === 0 ? "Now" : `+${i}y`,
          price:
            i === yearsForward
              ? summary.target_price_mid
              : summary.current_price +
                ((summary.target_price_mid - summary.current_price) * i) /
                  yearsForward,
        }))
      : [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header / controls */}
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold">My Valuation Dashboard</h1>
            <p className="text-sm text-slate-500">
              Enter a ticker and assumptions to generate TIKR-style analysis.
            </p>
          </div>
          <div className="flex gap-3">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="border rounded px-3 py-2 text-sm"
              placeholder="Ticker (e.g. NOW)"
            />
            <input
              type="number"
              min={3}
              max={10}
              value={yearsForward}
              onChange={(e) => setYearsForward(Number(e.target.value))}
              className="border rounded px-3 py-2 w-20 text-sm"
            />
            <button
              onClick={handleAnalyze}
              className="bg-black text-white text-sm px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? "Loading..." : "Analyze"}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        {summary && (
          <>
            {/* Top row: card + chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
                <p className="text-xs text-slate-500">
                  My Valuation of {summary.ticker}
                </p>
                <h2 className="text-lg font-semibold">
                  Based on mid case assumptions
                </h2>
                <div className="mt-2 space-y-2 text-sm">
                  <div>
                    <div className="text-slate-500">Current stock price</div>
                    <div className="text-xl font-semibold">
                      ${summary.current_price.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Target price</div>
                    <div className="text-xl font-semibold">
                      ${summary.target_price_mid.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Potential total return</div>
                    <div className="text-lg font-semibold">
                      {(summary.total_return_mid * 100).toFixed(1)}% over{" "}
                      {yearsForward} years
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Annualized</div>
                    <div className="text-lg font-semibold">
                      {(summary.annualized_mid * 100).toFixed(1)}% / year
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold mb-3">Price Forecast</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom row: tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">Historical</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-1">Metric</th>
                      <th className="py-1">1 Year</th>
                      <th className="py-1">5 Years</th>
                      <th className="py-1">10 Years</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hist.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-1">{row["Metric"]}</td>
                        <td className="py-1">{formatCell(row["1 Year"])}</td>
                        <td className="py-1">{formatCell(row["5 Years"])}</td>
                        <td className="py-1">{formatCell(row["10 Years"])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">
                  Forecast Scenarios
                </h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-1">Scenario</th>
                      <th className="py-1">Rev CAGR</th>
                      <th className="py-1">Margin</th>
                      <th className="py-1">Exit P/E</th>
                      <th className="py-1">Target</th>
                      <th className="py-1">Total</th>
                      <th className="py-1">IRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-1">{row["Scenario"]}</td>
                        <td className="py-1">
                          {formatPct(row["Revenue Growth (CAGR)"])}
                        </td>
                        <td className="py-1">
                          {formatPct(row["Net Income Margin"])}
                        </td>
                        <td className="py-1">{row["Exit P/E"]?.toFixed(1)}</td>
                        <td className="py-1">
                          ${row["Target Price 2030E"]?.toFixed(2)}
                        </td>
                        <td className="py-1">
                          {formatPct(row["Total Return"])}
                        </td>
                        <td className="py-1">
                          {formatPct(row["IRR (Annual Return)"])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function formatCell(value: any) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (Math.abs(value) < 1 && Math.abs(value) > 0.0001) {
    return (value * 100).toFixed(1) + "%";
  }
  return value.toFixed ? value.toFixed(2) : String(value);
}

function formatPct(v: any) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v * 100).toFixed(1) + "%";
}

