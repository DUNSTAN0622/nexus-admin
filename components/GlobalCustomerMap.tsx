"use client";

import { useState } from "react";
import { scaleLinear } from "d3-scale";
import {
  ComposableMap,
  Geographies,
  Geography,
  type GeographyProps,
} from "react-simple-maps";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import type { CountryData } from "@/types/analytics";

countries.registerLocale(enLocale);

const worldAtlasUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "taiwan province of china": "taiwan",
  "russian federation": "russia",
  "iran islamic republic of": "iran",
  "bolivia plurinational state of": "bolivia",
  "venezuela bolivarian republic of": "venezuela",
  "tanzania united republic of": "tanzania",
  "syrian arab republic": "syria",
  "moldova republic of": "moldova",
  "congo the democratic republic of the": "dem rep congo",
  "lao peoples democratic republic": "laos",
  "brunei darussalam": "brunei",
  "korea republic of": "south korea",
  "korea democratic peoples republic of": "north korea",
  czechia: "czech rep",
  "cabo verde": "cape verde",
  "ivory coast": "cote divoire",
  "palestine state of": "palestine",
  "micronesia federated states of": "micronesia",
};

type TooltipState = {
  x: number;
  y: number;
  count: number;
  name: string;
};

type GeographyFeature = GeographyProps["geography"] & {
  properties?: {
    name?: string;
  };
};

type GlobalCustomerMapProps = {
  countryData: CountryData;
};

function normalizeCountryName(value: string) {
  const normalizedName = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.'(),-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return COUNTRY_NAME_ALIASES[normalizedName] ?? normalizedName;
}

function resolveCountryName(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  if (normalizedCode.length === 2 || normalizedCode.length === 3) {
    const countryName = countries.getName(normalizedCode, "en");
    return countryName ? normalizeCountryName(countryName) : null;
  }

  return null;
}

export default function GlobalCustomerMap({
  countryData,
}: GlobalCustomerMapProps) {
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);

  const countryCountMap = Object.entries(countryData).reduce<
    Record<string, number>
  >((normalizedCounts, [countryCode, customerCount]) => {
    const resolvedCountryName = resolveCountryName(countryCode);

    if (!resolvedCountryName) {
      return normalizedCounts;
    }

    normalizedCounts[resolvedCountryName] =
      (normalizedCounts[resolvedCountryName] ?? 0) + customerCount;

    return normalizedCounts;
  }, {});

  const maxCustomerCount = Math.max(...Object.values(countryCountMap), 1);
  const countryColorScale = scaleLinear<string>()
    .domain([0, maxCustomerCount])
    .range(["#132638", "#06b6d4"])
    .clamp(true);

  return (
    <div className="relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,_rgba(15,23,42,0.96)_0%,_rgba(12,30,48,0.96)_100%)] p-5 shadow-[0_20px_70px_rgba(8,47,73,0.24)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Market Coverage
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">全球客戶分布</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              從地理分布觀察重點市場輪廓，協助營運與業務團隊調整資源配置。
            </p>
          </div>
        </div>
        <div className="min-w-fit shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex min-w-fit flex-col items-end gap-2 text-right">
            <p className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-slate-500">
              覆蓋市場數
            </p>
            <p className="text-2xl font-semibold text-white">
              {Object.keys(countryCountMap).length}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-slate-950/50 p-2">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 165 }}
          className="h-auto w-full"
        >
          <Geographies geography={worldAtlasUrl}>
            {({ geographies }) =>
              geographies.map((geographyShape) => {
                const geographyFeature = geographyShape as GeographyFeature;
                const geographyName =
                  geographyFeature.properties?.name ?? "Unknown";
                const normalizedGeographyName =
                  normalizeCountryName(geographyName);
                const customerCount =
                  countryCountMap[normalizedGeographyName] ?? 0;

                return (
                  <Geography
                    key={geographyShape.rsmKey}
                    geography={geographyShape}
                    fill={
                      customerCount > 0
                        ? countryColorScale(customerCount)
                        : "#0f172a"
                    }
                    stroke="#1e293b"
                    strokeWidth={0.55}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: customerCount > 0 ? "#22d3ee" : "#1e293b",
                        outline: "none",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(event) => {
                      setTooltipState({
                        x: event.clientX,
                        y: event.clientY,
                        count: customerCount,
                        name: geographyName,
                      });
                    }}
                    onMouseMove={(event) => {
                      setTooltipState((currentTooltipState) =>
                        currentTooltipState
                          ? {
                              ...currentTooltipState,
                              x: event.clientX,
                              y: event.clientY,
                            }
                          : currentTooltipState,
                      );
                    }}
                    onMouseLeave={() => {
                      setTooltipState(null);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {tooltipState ? (
        <div
          className="pointer-events-none fixed z-50 rounded-2xl border border-cyan-400/20 bg-slate-950/95 px-4 py-3 text-sm shadow-[0_16px_40px_rgba(2,132,199,0.18)]"
          style={{
            left: tooltipState.x + 16,
            top: tooltipState.y + 16,
          }}
        >
          <p className="font-medium text-white">{tooltipState.name}</p>
          <p className="mt-1 text-slate-300">客戶數：{tooltipState.count}</p>
        </div>
      ) : null}
    </div>
  );
}
