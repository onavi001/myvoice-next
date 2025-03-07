import { AppProps } from "next/app";
import { Provider } from "react-redux";
import { AppDispatch, RootState, store } from "../store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyUser } from "../store/userSlice";
import { useRouter } from "next/router";
import { logout } from "../store/userSlice";
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import { addRoutine } from "../store/routineSlice";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch:AppDispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  const { routines ,error: routineError } = useSelector((state: RootState) => state.routine);
  const router = useRouter();
  const selectedRoutine = useSelector((state: RootState) => state.routine.selectedRoutineIndex);
  useEffect(() => {
    dispatch(verifyUser());
  }, [dispatch]);
  const generateRoutineWithAI = async () => {
    // Simulación de una rutina generada por IA
    const aiGeneratedRoutine = {
      name: "Rutina de Fuerza Generada por IA",
      days: [
        {
          dayName: "Día 1 - Pecho y Tríceps",
          exercises: [
            {
              name: "Press de banca",
              sets: 4,
              reps: 8,
              weight: "70kg",
              rest: "90s",
              tips: ["Mantén la espalda recta", "Controla el descenso"],
              completed: false,
              muscleGroup: "Pecho",
              videos: [{ url: "https://www.youtube.com/embed/example1", isCurrent: true }],
            },
            {
              name: "Fondos en paralelas",
              sets: 3,
              reps: 12,
              weight: "Peso corporal",
              rest: "60s",
              tips: ["Baja hasta 90 grados", "Mantén los codos cerca"],
              completed: false,
              muscleGroup: "Tríceps",
              videos: [],
            },
          ],
          musclesWorked: ["Pecho", "Tríceps"],
          warmupOptions: ["5 min cinta", "Rotaciones de hombros"],
          explanation: "Enfocado en fuerza y volumen para pecho y tríceps.",
        },
        {
          dayName: "Día 2 - Espalda y Bíceps",
          exercises: [
            {
              name: "Dominadas",
              sets: 4,
              reps: 10,
              weight: "Peso corporal",
              rest: "90s",
              tips: ["Sube hasta la barbilla", "Controla la bajada"],
              completed: false,
              muscleGroup: "Espalda",
              videos: [{ url: "https://www.youtube.com/embed/example2", isCurrent: true }],
            },
            {
              name: "Curl de bíceps",
              sets: 3,
              reps: 12,
              weight: "15kg",
              rest: "60s",
              tips: ["Evita balanceo", "Contrae en la cima"],
              completed: false,
              muscleGroup: "Bíceps",
              videos: [],
            },
          ],
          musclesWorked: ["Espalda", "Bíceps"],
          warmupOptions: ["5 min remo", "Estiramientos dinámicos"],
          explanation: "Enfocado en fuerza y definición para espalda y bíceps.",
        },
      ],
    };
    if (user) {
      await dispatch(addRoutine({ ...aiGeneratedRoutine, userId: user._id }));
      if (!routineError) {
        router.push("/routine");
      }
    }
  };
  return (
    <>
      <Navbar
        onMyRoutine={() => router.push("/routine")}
        onNewRoutine={() => router.push("/routine-form")}
        onProgress={() => router.push("/progress")}
        onLogout={() => dispatch(logout())}
        onGenerateRoutine={generateRoutineWithAI}
        
        onEditRoutine={
          router.asPath === "/routine" ? () => selectedRoutine !== null && router.push(`/routine-edit/${routines[selectedRoutine]._id}`) : undefined
        }
      />
      {children}
    </>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AppInitializer>
        <Component {...pageProps} />
      </AppInitializer>
    </Provider>
  );
}
export default MyApp;