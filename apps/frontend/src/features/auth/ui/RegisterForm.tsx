import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { registerApi, loginApi } from "../api";
import { useAuth } from "../store";
import { useNavigate } from "react-router-dom";
import { useState } from "react";


const schema = z.object({
    name: z.string().min(1, "Requerido"),
    email: z.string().min(1, "Requerido").email("Email inválido"),
    password: z.string().min(1, "Requerido").min(8, "Min 8 caracteres"),
});
type FormValues = z.infer<typeof schema>;

function mapApiErrors(e: any): string {
    const code = e?.response?.data?.error;
    switch (code) {
        case "USER_EMAIL_TAKEN":
            return "Ese email ya está registrado.";
        case "INVALID_INPUT":
            return "Datos inválidos. Revisá los campos.";
        default:
            return "Error al registrar. Intentá nuevamente.";
    }
}

export function RegisterForm() {
    const { setAuth } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            await registerApi(values);
            const login = await loginApi({ email: values.email, password: values.password });
            return login;
        },
        onSuccess: ({ token, user }) => {
            setServerError(null);
            setAuth({ token, user });
            navigate('/dashboard', { replace: true });
        },
        onError: (error) => {
            setServerError(mapApiErrors(error))
        }
    });

    const onSubmit = (values: FormValues) => mutation.mutate(values);
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 p-4 border rounded">
            <label className="flex flex-col gap-1">
                <span>Name</span>
                <input aria-label="Name" className="border p-2 w-full" {...register("name")} />
                {errors.name && <span className="text-sm text-red-600">{errors.name.message}</span>}
            </label>

            <label className="flex flex-col gap-1">
                <span>Email</span>
                <input aria-label="Email" type="email" className="border p-2 w-full" {...register("email")} />
                {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}
            </label>

            <label className="flex flex-col gap-1">
                <span>Password</span>
                <input aria-label="Password" type="password" className="border p-2 w-full" {...register("password")} />
                {errors.password && <span className="text-sm text-red-600">{errors.password.message}</span>}
            </label>

            <button type="submit" className="border p-2" disabled={mutation.isPending}>
                {mutation.isPending ? "Creando..." : "Crear cuenta"}
            </button>

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        </form>
    );
}
