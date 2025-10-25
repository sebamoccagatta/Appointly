import { LoginForm } from "../ui/LoginForm";

export default function LoginPage() {
    return (

        <div className="min-h-screen grid place-items-center p-6">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-semibold mb-4" >Ingresar a Appointly</h1>
                <LoginForm />
            </div>
        </div>
    )
}