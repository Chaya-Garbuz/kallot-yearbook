

import type { ClassStat } from "../types/classes";

type ClassFilterProps = {
    classes: ClassStat[];
    selected: string;
    onChange: (classId: string) => void;
};

export default function ClassFilter({ classes, selected, onChange }: ClassFilterProps) {

    return (
        <div className="class-filter">
            <label htmlFor="class-filter">כיתה:</label>

            <select
                id="class-filter"
                value={selected}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">כל הכיתות</option>

                {classes.map((classOption) => (
                    <option key={classOption.id} value={classOption.id}>
                        {classOption.name}
                    </option>
                ))}      
            </select>
        </div>
    )

}
