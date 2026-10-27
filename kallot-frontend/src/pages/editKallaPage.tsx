import { useNavigate, useParams  } from "react-router-dom";

import {  useKalla, useUpdateKalla } from "../hooks/useKallot";
import KallaForm from "../components/kallotForm";
import { toKallaBody } from "../utils/toKallaBody"

import type {  KallaFormValues } from "../types/kallot";
import ErrorMessage from "../components/errorMessage";
import Loading from "../components/loading";

function EditKalla() {

  const { id } = useParams();
  const navigate = useNavigate();
  const kallaQuery = useKalla(id!);
  const kallaR = kallaQuery.data;
  const updateMutation = useUpdateKalla();

  function handleSave(values: KallaFormValues) {
      if (!id) {
    return;
  }

const body = toKallaBody(values);

    updateMutation.mutate(
      {
        id,
        body,
      },
      {
        onSuccess: () => navigate("/", { replace: true }),
      }
    );
  }
  if (kallaQuery.isLoading) {
  return <Loading />;
}

if (kallaQuery.error) {
  return <ErrorMessage message={kallaQuery.error.message} />;
}

if (!kallaR) {
  return null;
}


  return (
    <>
    <h3>עריכת כלה</h3>
    <KallaForm defaultValues={{
        classId: kallaR.classId,
        name: kallaR.name,
        specializationId: kallaR.specializationId,
        yeshivaId: kallaR.yeshivaId,
        engagedAt: kallaR.engagedAt,
        weddingAt: kallaR.weddingAt ?? "",
        hallName: kallaR.hallName ?? "",
        hallCity: kallaR.hallCity ?? "",
      }}
      onSubmit={handleSave}
      isPending={updateMutation.isPending}
      error={updateMutation.error}
      submitLabel="שמירה"
/>


    </>
  )
}

export default EditKalla
