

export type HomeView  = "classes" | "specializations" | "yeshivot";

type ViewTabsProps = {
  selected: HomeView ;
  onChange: (size: HomeView ) => void;
};

export default function ViewTabs({ selected, onChange }: ViewTabsProps) {
  return (
    <div className="size-picker">
      <button
        type="button"
        className={selected === "classes" ? "active" : ""}
        onClick={() => onChange("classes")}
      >
        כיתות
      </button>
      <button
        type="button"
        className={selected === "specializations" ? "active" : ""}
        onClick={() => onChange("specializations")}
      >
        התמחויות
      </button>
      <button
        type="button"
        className={selected === "yeshivot" ? "active" : ""}
        onClick={() => onChange("yeshivot")}
      >
        ישיבות
      </button>
    </div>
  );
}