import type { Yeshiva } from "../types/yeshivot";
import type { Kalla } from "../types/kallot";

type YeshivaLegendProps = {
  yeshivot: Yeshiva[];
  kallot: Kalla[];
  yeshivaColors: Record<string, string>;
};

export default function YeshivaLegend({ yeshivot, kallot, yeshivaColors }: YeshivaLegendProps) {
  const counts: Record<string, number> = {};

  for (const kalla of kallot) {
    counts[kalla.yeshivaId] = (counts[kalla.yeshivaId] ?? 0) + 1;
  }

  return (
    <div className="yeshiva-legend">
      <h3>ישיבות</h3>

      <ul>
        {yeshivot.map((yeshiva) => (
          <li key={yeshiva.id} style={{ backgroundColor: yeshivaColors[yeshiva.id] }}>
            <span>{yeshiva.name}</span>
            <span>{counts[yeshiva.id] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}