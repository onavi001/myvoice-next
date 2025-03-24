import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import Head from "next/head";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { motion } from "framer-motion";
import { GetServerSideProps } from "next";
import { dbConnect } from "../../lib/mongodb";

export default function Home() {
  const { user } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  // Variantes para animaciones
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.2, ease: "easeOut" },
    }),
  };

  return (
    <>
      <Head>
        <title>Bienvenido - My Voice</title>
        <meta name="description" content="Tu espacio personal en My Voice" />
      </Head>
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col items-center p-4">
        {/* Header */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-[#34C759] mt-8 mb-6 text-center"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          ¡Bienvenido, {user?.username || "Usuario"}!
        </motion.h1>
        <motion.p
          className="text-lg text-[#D1D1D1] mb-8 text-center max-w-2xl"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          Explora tus rutinas, sigue tu progreso y alcanza tus metas con My Voice.
        </motion.p>

        {/* Opciones principales */}
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="bg-[#252525] border-2 border-[#4A4A4A] p-6 rounded-md text-center hover:bg-[#2D2D2D] transition-colors">
              <h2 className="text-xl font-semibold text-[#34C759] mb-2">Mis Rutinas</h2>
              <p className="text-[#B0B0B0] mb-4">Gestiona y sigue tus planes de entrenamiento.</p>
              <Button
                onClick={() => router.push("/app/routine")}
                className="bg-[#34C759] text-black hover:bg-[#2DAF47] rounded-md py-2 px-4 text-sm font-semibold border border-[#2DAF47] shadow-md"
              >
                Ir a Rutinas
              </Button>
            </Card>
          </motion.div>

          <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="bg-[#252525] border-2 border-[#4A4A4A] p-6 rounded-md text-center hover:bg-[#2D2D2D] transition-colors">
              <h2 className="text-xl font-semibold text-[#34C759] mb-2">Progreso</h2>
              <p className="text-[#B0B0B0] mb-4">Revisa tus avances y estadísticas.</p>
              <Button
                onClick={() => router.push("/app/progress")}
                className="bg-[#34C759] text-black hover:bg-[#2DAF47] rounded-md py-2 px-4 text-sm font-semibold border border-[#2DAF47] shadow-md"
              >
                Ver Progreso
              </Button>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="bg-[#252525] border-2 border-[#4A4A4A] p-6 rounded-md text-center hover:bg-[#2D2D2D] transition-colors">
              <h2 className="text-xl font-semibold text-[#34C759] mb-2">Crear Rutina</h2>
              <p className="text-[#B0B0B0] mb-4">Diseña un nuevo plan personalizado.</p>
              <Button
                onClick={() => router.push("/app/routine-form")}
                className="bg-[#34C759] text-black hover:bg-[#2DAF47] rounded-md py-2 px-4 text-sm font-semibold border border-[#2DAF47] shadow-md"
              >
                Nueva Rutina
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.token;
  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  try {
    await dbConnect();
    //const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };
    // Aquí podrías cargar datos adicionales si los necesitas
    return { props: {} };
  } catch (error) {
    console.error("Error en getServerSideProps:", error);
    return { redirect: { destination: "/login", permanent: false } };
  }
};