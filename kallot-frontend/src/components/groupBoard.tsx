import YeshivaLegend from "./yeshivaLegend"
import ClassColumn from "./classColumn"
import type { ClassStat } from "../types/classes";
import type { Kalla } from "../types/kallot";
import type { Yeshiva } from "../types/yeshivot";


type GroupBoardProps = {
  groups: ClassStat[];
  groupField: "classId" | "specializationId";
  kallot: Kalla[];
  yeshivot: Yeshiva[];
  yeshivaColors: Record<string, string>;
  canEdit:boolean
};

export default function GroupBoard({ groups, groupField, kallot, yeshivot, yeshivaColors , canEdit}: GroupBoardProps) {

    return (
        <>
            <div className="class-board">
                <YeshivaLegend yeshivot={yeshivot} kallot={kallot} yeshivaColors={yeshivaColors} />
                {groups.map((group) => (
                    <ClassColumn
                        key={group.id}
                        classStat={group}
                        kallot={kallot.filter((kalla) => kalla[groupField]=== group.id)}
                        yeshivaColors={yeshivaColors}
                        canEdit={canEdit}
                    />
                ))}
            </div>
        </>
    )

}
