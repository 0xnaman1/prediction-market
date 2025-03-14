"use client";

import Image from "next/image";
import { Button } from "./button";
import { Card } from "./card";

interface Market {
  id: string;
  title: string;
  imageUrl: string;
  chance: number;
  volume: string;
  options: {
    name: string;
    percentage: number;
  }[];
}

export function BettingMarket({ market }: { market: Market }) {
  return (
    <Card className="w-full overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            <Image
              src={market.imageUrl}
              alt={market.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {market.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {market.chance}% chance
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">
                {market.volume} Vol.
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {market.options.map((option) => (
            <div
              key={option.name}
              className="flex items-center justify-between"
            >
              <span className="text-sm font-medium">{option.name}</span>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold">
                  {option.percentage}%
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                  >
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                  >
                    No
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}
