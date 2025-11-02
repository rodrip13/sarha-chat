import { useState } from "react";
import { Mail, ArrowRight, Lock, Eye, EyeOff, Baby } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

const LoginForm: React.FC = ( ) => {

  const { signInWithEmail, signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (mode === "forgot") {
        // Modo recuperación de contraseña
        const { error } = await signInWithEmail(email);
        if (error) throw error;
        setMessage("¡Revisa tu correo! Te hemos enviado un enlace para restablecer tu contraseña.");
      } else {
        // Modo login con contraseña
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
        setMessage("¡Inicio de sesión exitoso!");
      }
    } catch (error: any) {
      console.error('❌ [LOGIN FORM] Error:', error);
      setMessage(`Error: ${error.error_description || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "forgot" : "login");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-contessa-100 via-contessa-200 to-contessa-300 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-contessa-600 rounded-2xl mb-4 shadow-lg">
            <Baby className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sarha
          </h1>
          <p className="text-gray-600">
            Accede al chat que tiene todos los conocimientos sobre Nacer Acompañada por Marha Scanu
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2"> 
              {mode === "login" ? "Iniciar Sesión" : "Recuperar Contraseña"}
            </h2>
            {mode === "forgot" && (
              <p className="text-sm text-gray-600">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
              </p>
            )}
          </div>
          
          {message && (
            <div className={`mb-4 p-3 ${
              message.includes("Error") 
                ? "bg-red-50 text-red-800 border border-red-200" 
                : "bg-blue-50 text-blue-800 border border-blue-200"
            } rounded-lg text-center text-sm`}>
              Error en las credenciales
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-contessa-500 focus:border-transparent transition-colors placeholder-gray-400"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña - Solo en modo login */}
            {mode === "login" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-contessa-500 focus:border-transparent transition-colors placeholder-gray-400"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Link de olvidé contraseña - Solo en modo login */}
            {mode === "login" && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-contessa-600 hover:text-contessa-700 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Botón de Login/Recuperar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-contessa-600 hover:bg-contessa-700 disabled:bg-contessa-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-5 w-5 mr-2" />
                  <span>{mode === "login" ? "Iniciando sesión..." : "Enviando enlace..."}</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Iniciar Sesión" : "Enviar enlace"}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Link para volver al login */}
            {mode === "forgot" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            ¿No tienes una cuenta?{" "}
            <button className="text-contessa-600 hover:text-contessa-700 font-medium transition-colors">
              Contacta al instructor
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
