import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getMeApi, loginApi } from "../api";
import { useAuth } from "../../auth/store";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const schema = z.object({
    email: z.string().min(1, "Requerido").email("Email inválido"),
    password: z.string().min(1, "Requerido"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
    const { setAuth } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);
    const navigate = useNavigate();

    function mapLoginError(e: any): string {
        const code = e?.response?.data?.error;
        switch (code) {
            case "AUTH_INVALID_CREDENTIALS":
                return "Credenciales inválidas.";
            case "USER_BLOCKED":
                return "Tu cuenta está bloqueada.";
            default:
                return "No se pudo iniciar sesión.";
        }
    }

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
        mode: "onSubmit",
    });

    const mutation = useMutation({
        mutationFn: loginApi,
        onSuccess: async (res) => {
            const token = res.accessToken;
            if (!token) { setServerError("Login sin token"); return; }

            localStorage.setItem("auth", JSON.stringify({ token }));
            localStorage.setItem("token", token);

            try {
                const user = await getMeApi();
                setAuth({ token, user });           // ← ahora sí, estado consistente
                navigate("/dashboard", { replace: true });
            } catch {
                setServerError("No se pudo obtener el perfil.");
            }
        },
        onError: (error) => {
            setServerError(mapLoginError(error));
        }
    });

    const onSubmit = (values: FormValues) => {
        mutation.mutate(values);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 p-4 border rounded">
            <label className="flex flex-col gap-1">
                <span>Email</span>
                <input
                    aria-label="Email"
                    className="border p-2 w-full"
                    type="email"
                    {...register("email")}
                />
                {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}
            </label>

            <label className="flex flex-col gap-1">
                <span>Password</span>
                <input
                    aria-label="Password"
                    className="border p-2 w-full"
                    type="password"
                    {...register("password")}
                />
                {errors.password && <span className="text-sm text-red-600">{errors.password.message}</span>}
            </label>

            <button type="submit" className="border p-2">
                {mutation.isPending ? "Ingresando..." : "Ingresar"}
            </button>

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        </form>
    );
}
