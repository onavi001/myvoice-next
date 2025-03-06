import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { loginUser, registerUser } from "../store/userSlice";
import { useRouter } from "next/router";

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });

  useEffect(() => {
    if (user) router.push("/routine");
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      await dispatch(registerUser(formData));
    } else {
      await dispatch(loginUser({ email: formData.email, password: formData.password }));
    }
    if (!error && user) router.push("/routine");
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">
      <div className="p-6 max-w-md w-full bg-[#2D2D2D] rounded-lg shadow-md">
        <h1 className="text-xl font-semibold mb-4">{isRegister ? "Registrarse" : "Iniciar Sesión"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              name="username"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 bg-[#1A1A1A] border border-[#4A4A4A] rounded text-white placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 bg-[#1A1A1A] border border-[#4A4A4A] rounded text-white placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 bg-[#1A1A1A] border border-[#4A4A4A] rounded text-white placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#34C759] text-black py-2 rounded hover:bg-[#2DBF4E] transition-colors disabled:opacity-50"
          >
            {loading ? "Cargando..." : isRegister ? "Registrarse" : "Iniciar Sesión"}
          </button>
        </form>
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-2 text-[#B0B0B0] text-sm hover:text-[#34C759]"
        >
          {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}