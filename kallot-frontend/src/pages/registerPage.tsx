
import { useAuth } from "../hooks/useAuth";
import { register as registerUser } from "../api/authApi";
import type { RegisterBody } from "../types/auth"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useClassesByCode } from "../hooks/useClassesByCode";
import {   useNavigate } from "react-router-dom";
import ErrorMessage from "../components/errorMessage";


function Register() {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterBody>();

    const { setSession } = useAuth();
    const [checkedCode, setCheckedCode] = useState("");
    const classesQuery = useClassesByCode(checkedCode);
    const navigate = useNavigate();

    const registerMutation = useMutation({


        mutationFn: (data: RegisterBody) => registerUser({
            name: data.name,
            email: data.email.trim(),
            password: data.password,
            classId: data.classId,
            joinCode: data.joinCode.trim(),
        }),


        onSuccess: async (result) => {
            await setSession(result.token);
            navigate("/", { replace: true });
        },
    });
    function onSubmit(data: RegisterBody) {
        registerMutation.mutate(data);
    }

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)} className="register-form">
                <label htmlFor="name">שם</label>
                <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    {...register("name", {
                        required: "יש להזין שם",
                        minLength: { value: 2, message: "השם צריך להכיל לפחות 2 תווים" },
                        maxLength: { value: 30, message: "השם יכול להכיל עד 30 תווים" },
                    })}
                />
                {errors.name && <p>{errors.name.message}</p>}

                <label htmlFor="email">אימייל</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email", {
                        required: "יש להזין אימייל",
                        pattern: { value: /^\S+@\S+\.\S+$/, message: "כתובת אימייל לא תקינה" },
                    })}
                />
                {errors.email && <p>{errors.email.message}</p>}

                <label htmlFor="password">סיסמא</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register("password", {
                        required: "יש להזין סיסמא",
                        minLength: { value: 8, message: "הסיסמא צריכה להכיל לפחות 8 תווים" },
                        pattern: {
                            value: /^(?=.*[A-Za-z])(?=.*\d)/,
                            message: "הסיסמא צריכה להכיל לפחות אות אחת באנגלית וספרה אחת",
                        },
                    })}
                />
                {errors.password && <p>{errors.password.message}</p>}

                <label htmlFor="joinCode">קוד שנתון</label>
                <input
                    id="joinCode"
                    type="text"
                    autoComplete="off"
                    {...register("joinCode", {
                        required: "יש להזין קוד שנתון",
                    })}


                />
                <button type="button" onClick={() => setCheckedCode(watch("joinCode").trim())}>
                    בדיקה
                </button>
                {errors.joinCode && <p>{errors.joinCode.message}</p>}

                <label htmlFor="classId">כיתה</label>
                <select
                    id="classId"
                    {...register("classId", {
                        required: "יש לבחור כיתה",
                    })}
                >
                    <option value="">
                        {classesQuery.data ? "בחרי כיתה" : "קודם יש לבדוק את קוד השנתון"}
                    </option>

                    {classesQuery.data?.classes.map((classOption) => (
                        <option key={classOption.id} value={classOption.id}>
                            {classOption.name}
                        </option>
                    ))}
                </select>
                {errors.classId && <p>{errors.classId.message}</p>}
                {classesQuery.isLoading && <p>בודקת...</p>}
                {classesQuery.error && <ErrorMessage message={classesQuery.error.message} />}
                {classesQuery.data && <p>שנתון: {classesQuery.data.yearbook.name}</p>}

                {registerMutation.error && <ErrorMessage message={registerMutation.error.message} />}

                <button type="submit" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "נרשמת..." : "הרשמה"}
                </button>
            </form>
        </div>
    )
}

export default Register
