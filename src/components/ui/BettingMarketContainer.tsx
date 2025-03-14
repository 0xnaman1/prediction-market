"use client";

import { BettingMarket } from "./BettingMarket";

const SAMPLE_MARKETS = [
  {
    id: "1",
    title: "Trump ends Ukraine war in first 90 days?",
    imageUrl: "https://picsum.photos/200", // Random placeholder image
    chance: 32,
    volume: "$32m",
    options: [
      { name: "Yes", percentage: 32 },
      { name: "No", percentage: 68 },
    ],
  },
  {
    id: "2",
    title: "US recession in 2025?",
    imageUrl: "https://picsum.photos/201", // Different random image
    chance: 39,
    volume: "$729k",
    options: [
      { name: "Yes", percentage: 39 },
      { name: "No", percentage: 61 },
    ],
  },
  {
    id: "3",
    title: "Which company has best AI model end of March?",
    imageUrl: "https://picsum.photos/202", // Different random image
    chance: 73,
    volume: "$2m",
    options: [
      { name: "xAI", percentage: 73 },
      { name: "OpenAI", percentage: 16 },
      { name: "Google", percentage: 6 },
    ],
  },
];

export function BettingMarketContainer() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Top Markets</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search by market"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="new">New</option>
            <option value="trending">Trending</option>
            <option value="volume">Volume</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {SAMPLE_MARKETS.map((market) => (
          <BettingMarket key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
}
