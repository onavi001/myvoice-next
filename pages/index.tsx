import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { loginUser, registerUser } from "../store/userSlice";
import { useRouter } from "next/router";
import Button from "../components/Button";
import Input from "../components/Input";

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });

  useEffect(() => {
    if (user) router.back();//router.push("/routine");
  }, [user]);

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
    if (!error && user) router.back();//router.push("/routine");
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">
      <div className="p-6 max-w-md w-full bg-[#2D2D2D] rounded-lg shadow-md">
        <h1 className="text-xl font-semibold mb-4">{isRegister ? "Registrarse" : "Iniciar Sesión"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <Input
              name="username"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={handleChange}
            />
          )}
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
          />
          <Button disabled={loading}>
            {loading ? "Cargando..." : isRegister ? "Registrarse" : "Iniciar Sesión"}
          </Button>
        </form>
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-2 text-[#B0B0B0] text-sm hover:text-[#34C759] w-full text-center"
        >
          {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </button>
        <button
          onClick={()=>{router.push("/forgot-password")}}
          className="mt-2 text-[#B0B0B0] text-sm hover:text-[#34C759] w-full text-center"
        >
          Olvide mi contraseña
        </button>
        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}