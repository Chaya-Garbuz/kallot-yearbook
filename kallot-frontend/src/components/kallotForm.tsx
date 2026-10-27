import { useForm } from "react-hook-form";
import { useSpecializations } from "../hooks/useSpecializations";
import { useYeshivot } from "../hooks/useYeshivot";
import type { KallaFormValues } from "../types/kallot";
import type { ClassStat } from "../types/classes";
import ErrorMessage from "./errorMessage";

type KallaFormProps = {
  defaultValues: KallaFormValues;
  onSubmit: (values: KallaFormValues) => void;
  isPending: boolean;
  error: Error | null;
  submitLabel: string;
  classes?: ClassStat[];
};

export default function KallaForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel,
  classes,
}: KallaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KallaFormValues>({ defaultValues });

  const specializationsQuery = useSpecializations();
  const yeshivotQuery = useYeshivot();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="kalla-form">

      <label htmlFor="name">שם הכלה</label>
      <input
        id="name"
        type="text"
        {...register("name", {
          required: "יש להזין שם",
          minLength: { value: 2, message: "השם צריך להכיל לפחות 2 תווים" },
          maxLength: { value: 40, message: "השם יכול להכיל עד 40 תווים" },
        })}
      />
      {errors.name && <p>{errors.name.message}</p>}

      {classes && (
        <>
          <label htmlFor="classId">כיתה</label>
          <select id="classId" {...register("classId", { required: "יש לבחור כיתה" })}>
            <option value="">בחרי כיתה</option>
            {classes.map((classOption) => (
              <option key={classOption.id} value={classOption.id}>
                {classOption.name}
              </option>
            ))}
          </select>
          {errors.classId && <p>{errors.classId.message}</p>}
        </>
      )}

      <label htmlFor="specializationId">התמחות</label>
      <select
        id="specializationId"
        {...register("specializationId", { required: "יש לבחור התמחות" })}
      >
        <option value="">בחרי התמחות</option>
        {specializationsQuery.data?.map((specialization) => (
          <option key={specialization.id} value={specialization.id}>
            {specialization.name}
          </option>
        ))}
      </select>
      {errors.specializationId && <p>{errors.specializationId.message}</p>}

      <label htmlFor="yeshivaId">ישיבה</label>
      <select id="yeshivaId" {...register("yeshivaId", { required: "יש לבחור ישיבה" })}>
        <option value="">בחרי ישיבה</option>
        {yeshivotQuery.data?.map((yeshiva) => (
          <option key={yeshiva.id} value={yeshiva.id}>
            {yeshiva.name}
          </option>
        ))}
      </select>
      {errors.yeshivaId && <p>{errors.yeshivaId.message}</p>}

      <label htmlFor="engagedAt">תאריך אירוסין</label>
      <input
        id="engagedAt"
        type="date"
        {...register("engagedAt", { required: "יש לבחור תאריך אירוסין" })}
      />
      {errors.engagedAt && <p>{errors.engagedAt.message}</p>}

      <label htmlFor="weddingAt">תאריך חתונה (לא חובה)</label>
      <input id="weddingAt" type="date" {...register("weddingAt")} />

      <label htmlFor="hallName">אולם (לא חובה)</label>
      <input
        id="hallName"
        type="text"
        {...register("hallName", {
          minLength: { value: 2, message: "שם האולם צריך להכיל לפחות 2 תווים" },
          maxLength: { value: 60, message: "שם האולם יכול להכיל עד 60 תווים" },
        })}
      />
      {errors.hallName && <p>{errors.hallName.message}</p>}

      <label htmlFor="hallCity">עיר (לא חובה)</label>
      <input
        id="hallCity"
        type="text"
        {...register("hallCity", {
          minLength: { value: 2, message: "שם העיר צריך להכיל לפחות 2 תווים" },
          maxLength: { value: 30, message: "שם העיר יכול להכיל עד 30 תווים" },
        })}
      />
      {errors.hallCity && <p>{errors.hallCity.message}</p>}

      {error && <ErrorMessage message={error.message} />}

      <button type="submit" disabled={isPending}>
        {isPending ? "שומרת..." : submitLabel}
      </button>
    </form>
  );
}