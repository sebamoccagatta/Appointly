
export function LoginForm() {
  return (
    <form className="flex flex-col gap-3 p-4 border rounded">
      <label>
        Email
        <input aria-label="Email" className="border p-2 w-full" />
      </label>
      <label>
        Password
        <input aria-label="Password" type="password" className="border p-2 w-full" />
      </label>
      <button type="submit" className="border p-2">Ingresar</button>
      <p className="text-sm text-gray-500">TODO: implementar lógica</p>
    </form>
  );
}
