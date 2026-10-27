
import { login } from "../api/authApi";
import type { LoginBody } from "../types/auth";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form"
import { useAuth } from "../hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import ErrorMessage from "../components/errorMessage";


export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBody>();

  const { setSession } = useAuth();
  const navigate = useNavigate();

  const loginMutation = useMutation({

    mutationFn: (data: LoginBody) => login(data.email.trim(), data.password),

    onSuccess: async (result) => {
      await setSession(result.token);
      navigate("/", { replace: true });
    },
  });

  function onSubmit(data: LoginBody) {
    loginMutation.mutate(data);
  }


  return (
    <div className="login-page">
      <form onSubmit={handleSubmit(onSubmit)} className="login-form">
        <h1>התחברות</h1>
        <p>התחברי לחשבון שלך כדי להמשיך</p>

        <label htmlFor="email">אימייל</label>
        <input
          id="email"
          type="email"
          {...register("email", {
            required: "יש להזין אימייל",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "כתובת אימייל לא תקינה" },
          })} />
        {errors.email && <p>{errors.email.message}</p>}

        <label htmlFor="password">סיסמא</label>
        <input
          id="password"
          type="password"
          {...register("password", {
            required: "יש להזין סיסמא",
          })}
        />
        {errors.password && <p>{errors.password.message}</p>}

        {loginMutation.error && <ErrorMessage message={loginMutation.error.message} />}


        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "מתחברת..." : "התחברות"}
        </button>
      </form>
      <Link to="/register">אין לך חשבון? להרשמה</Link>
    </div>
  );
}
