import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAllStats } from "../hooks/useOverview";
import { useCreateKalla } from "../hooks/useKallot";
import KallaForm from "../components/kallotForm";
import {toKallaBody }from "../utils/toKallaBody"
import type { KallaFormValues } from "../types/kallot";

const emptyValues: KallaFormValues = {
  name: "",
  classId: "",
  specializationId: "",
  yeshivaId: "",
  engagedAt: "",
  weddingAt: "",
  hallName: "",
  hallCity: "",
};

function AddKallot() {
  const { user } = useAuth();
  const statsQuery = useAllStats();
  const createMutation = useCreateKalla();
  const navigate = useNavigate();


  const isAdmin = user?.role === "ADMIN";

  function handleSave(values: KallaFormValues) {
    const classId = isAdmin ? values.classId : user?.classId;
      const res= toKallaBody(values);
    if (!classId) {
      return;
    }

    createMutation.mutate(
      {
        classId,
        body:res
      },
      {
        onSuccess: () => navigate("/", { replace: true }),
      }
    );
  }

  return (
    <div className="form-page">
      <h1>הוספת כלה</h1>

      <KallaForm
        defaultValues={emptyValues}
        onSubmit={handleSave}
        isPending={createMutation.isPending}
        error={createMutation.error}
        submitLabel="הוספה"
        classes={isAdmin ? statsQuery.data?.classes : undefined}
      />
    </div>
  );
}

export default AddKallot;