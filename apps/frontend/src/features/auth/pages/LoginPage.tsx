import { LoginForm } from "../ui/LoginForm";
import { Link } from "react-router-dom";

export default function LoginPage() {
    return (

        <div className="min-h-screen grid place-items-center p-6">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-semibold mb-4" >Ingresar a Appointly</h1>
                <LoginForm />
                <p className="text-sm mt-3">
                    ¿No tenés cuenta?{" "}
                    <Link to="/register" className="underline">Registrar</Link>
                </p>
            </div>
        </div>
    )
}