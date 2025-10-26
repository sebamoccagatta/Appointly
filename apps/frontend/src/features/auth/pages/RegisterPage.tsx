import { Link } from "react-router-dom";
import { RegisterForm } from "../ui/RegisterForm";

export default function RegisterPage() {
    return (
        <div className="min-h-screen grid place-items-center p-6">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-semibold mb-4">Crear cuenta en Appointly</h1>
                <RegisterForm />
                <p className="text-sm mt-3">
                    ¿Ya tenés cuenta?{" "}
                    <Link to="/login" className="underline">Iniciar sesión</Link>
                </p>
            </div>
        </div>
    );
}