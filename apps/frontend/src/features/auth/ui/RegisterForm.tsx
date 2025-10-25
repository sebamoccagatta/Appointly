import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { registerApi } from "../api";

const schema = z.object({
    name: z.string().min(1, "Requerido"),
    email: z.string().min(1, "Requerido").email("Email inválido"),
    password: z.string().min(1, "Requerido").min(8, "Min 8 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const mutation = useMutation({ mutationFn: registerApi });

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
                <input aria-label="Email" className="border p-2 w-full" type="email" {...register("email")} />
                {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}
            </label>

            <label className="flex flex-col gap-1">
                <span>Password</span>
                <input aria-label="Password" className="border p-2 w-full" type="password" {...register("password")} />
                {errors.password && <span className="text-sm text-red-600">{errors.password.message}</span>}
            </label>

            <button type="submit" className="border p-2">
                {mutation.isPending ? "Creando..." : "Crear cuenta"}
            </button>

            {mutation.isError && (
                <p className="text-sm text-red-600">
                    {(mutation.error as any)?.response?.data?.error ?? "Error al registrar"}
                </p>
            )}
            {mutation.isSuccess && (
                <p className="text-sm text-green-600">
                    Cuenta creada para {mutation.data.name}. Ahora podés iniciar sesión.
                </p>
            )}
        </form>
    );
}
