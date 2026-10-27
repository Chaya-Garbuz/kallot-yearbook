
import { Link } from "react-router-dom";
import type { ClassStat } from "../types/classes";
import type { Kalla } from "../types/kallot"
type ClassColumnProps = {
  classStat: ClassStat,
  kallot: Kalla[];
  yeshivaColors: Record<string, string>;
  canEdit: boolean;
}



export default function ClassColumn({ classStat, kallot, yeshivaColors,canEdit }: ClassColumnProps) {

  return (
    <>
      <div className="class-column">
        <h3>{classStat.name}</h3>
        <p>
          <span>בנות</span>
          <strong>{classStat.size}</strong>
        </p>
        <p>
          <span>כלות</span>
          <strong>{classStat.kallotCount}</strong>
        </p>
        <p>
          <span>מאורסות</span>
          <strong>{classStat.percent}%</strong>
        </p>

        {kallot.length === 0 ? (
          <p>אין כלות</p>
        ) : (
          <ul>
            {kallot.map((kalla) => (
              <li
                key={kalla.id}
                style={{ backgroundColor: yeshivaColors[kalla.yeshivaId] }}
                title={kalla.yeshivaName}
              >
                {canEdit ? (
                  <Link to={`/kallot/${kalla.id}/edit`}>
                    {kalla.name}
                  </Link>
                ) : (
                  <span>{kalla.name}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}