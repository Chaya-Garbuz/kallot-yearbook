
import { useAuth } from "../hooks/useAuth";
import { useAllStats } from "../hooks/useOverview";
import { useKallot } from "../hooks/useKallot"
import { buildYeshivaColors } from "../utils/yeshivaColors"
import { useYeshivot } from "../hooks/useYeshivot";
import ViewTabs from "../components/viewTab";
import type { HomeView } from "../components/viewTab";
import GroupBoard from "../components/groupBoard";
import ClassFilter from "../components/classFilter";
import Loading from "../components/loading";
import ErrorMessage from "../components/errorMessage";
import { useState } from "react";

function Home() {
    const [selectedClassId, setSelectedClassId] = useState("");
    const { user } = useAuth();
    const statsQuery = useAllStats();
    const kallotQuery = useKallot({ pageSize: 200, sort: "engagedAt", order: "asc", classId: selectedClassId || undefined, });
    const yeshivotQuery = useYeshivot();

    const [view, setView] = useState<HomeView>("classes");
    if (!user) {
        return null;
    }

    if (statsQuery.isLoading || kallotQuery.isLoading || yeshivotQuery.isLoading) {
        return <Loading />;
    }

    if (statsQuery.error) {
        return <ErrorMessage message={statsQuery.error.message}/>;
    }

 if (kallotQuery.error) {
  return <ErrorMessage message={kallotQuery.error.message} />;
}

    if (!statsQuery.data) {
        return null;
    }


    const data = statsQuery.data;
    const kallot = kallotQuery.data?.items ?? [];
    const yeshivot = yeshivotQuery.data ?? [];
    const yeshivaColors = buildYeshivaColors(yeshivot);

    const visibleClasses = selectedClassId
  ? data.classes.filter((group) => group.id === selectedClassId)
  : data.classes;

  const canEdit =
  user?.role === "REP" ||
  user?.role === "ADMIN";

    return (
        <>
        
            <section className="overview-summary">
                <div
                    className="percent-ring"
                    style={{ background: `conic-gradient(var(--gold) ${data.totals.percent}%, var(--ring-track) 0)` }}
                >
                    <div className="percent-ring-inner">
                        <strong>{data.totals.percent}%</strong>
                        <span>מאורסות</span>
                    </div>
                </div>

                <div className="overview-text">
                    <p className="overview-label">{data.yearbook.name}</p>
                    <h1>{data.totals.kallot} כלות מתוך {data.totals.girls} בנות המחזור</h1>

                    <div className="overview-stats">
                        <div>
                            <strong>{data.totals.classes}</strong>
                            <span>כיתות</span>
                        </div>
                        <div>
                            <strong>{data.totals.yeshivot}</strong>
                            <span>ישיבות</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="home-controls">
                <ViewTabs selected={view} onChange={setView} />
                <ClassFilter
                    classes={data.classes}
                    selected={selectedClassId}
                    onChange={setSelectedClassId}
                />
            </div>

            {view === "classes" && (
                <GroupBoard groups={visibleClasses} groupField="classId" kallot={kallot} yeshivot={yeshivot} yeshivaColors={yeshivaColors} canEdit={canEdit}></GroupBoard>
            )}

            {view === "specializations" && (
                <GroupBoard groups={data.specializations} groupField="specializationId" kallot={kallot} yeshivot={yeshivot} yeshivaColors={yeshivaColors} canEdit={canEdit}></GroupBoard>
            )}

            {view === "yeshivot" && (
                <p>הגרף יגיע בקרוב</p>
            )}


        </>
    )
}

export default Home


