import { RegisterForm } from "../ui/RegisterForm";

export default function RegisterPage() {
    return (
        <div className="min-h-screen grid place-items-center p-6">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-semibold mb-4">Crear cuenta en Appointly</h1>
                <RegisterForm />
            </div>
        </div>
    );
}