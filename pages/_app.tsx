import { AppProps } from "next/app";
import { Provider } from "react-redux";
import { AppDispatch, RootState, store } from "../store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyUser, logout } from "../store/userSlice";
import { useRouter } from "next/router";
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import Head from "next/head";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/layout";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch: AppDispatch = useDispatch();
  const { loading, token, user } = useSelector((state: RootState) => state.user);
  const { routines } = useSelector((state: RootState) => state.routine);
  const selectedRoutine = useSelector((state: RootState) => state.routine.selectedRoutineIndex);
  const router = useRouter();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRouteChanging, setIsRouteChanging] = useState(false);

  useEffect(() => {
    dispatch(verifyUser()).finally(() => setIsInitialLoad(false));
  }, [dispatch]);
  useEffect(() => {
    if (isInitialLoad) return;
    if (!token && router.pathname === "/") {
      router.replace("/login");
    } else if (token && router.pathname === "/login") {
      router.push("/app");
    }
  }, [token, router.pathname, isInitialLoad, router]);

  useEffect(() => {
    const handleRouteChangeStart = () => setIsRouteChanging(true);
    const handleRouteChangeComplete = () => setIsRouteChanging(false);

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeComplete);
    };
  }, [router]);

  // Mostrar Navbar solo en rutas protegidas bajo /app
  const showNavbar = token && router.pathname.startsWith("/app");
  const isLoading = isInitialLoad || loading || isRouteChanging;

  if (isLoading){
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Loader />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
  return (
    <>
      {
        showNavbar ? 
          <Navbar
            onMyRoutine={() => router.push("/app/routine")}
            onNewRoutine={() => router.push("/app/routine-form")}
            onProgress={() => router.push("/app/progress")}
            onLogout={() => {dispatch(logout());router.push("/")}}
            onGenerateRoutine={() => router.push("/app/routine-AI")}
            onEditRoutine={
              router.pathname === "/app/routine" && selectedRoutine !== null && routines[selectedRoutine]
                ? () => router.push(`/app/routine-edit/${routines[selectedRoutine]._id}`)
                : undefined
            }
          />
          :
          <Navbar
            onMyRoutine={() => router.push("/app/routine")}
            onNewRoutine={() => router.push("/app/routine-form")}
            onProgress={() => router.push("/app/progress")}
            onLogout={() => {dispatch(logout());router.push("/")}}
            onGenerateRoutine={() => router.push("/app/routine-AI")}
            onEditRoutine={
              router.pathname === "/app/routine" && selectedRoutine !== null && routines[selectedRoutine]
                ? () => router.push(`/app/routine-edit/${routines[selectedRoutine]._id}`)
                : undefined
            }
          />
      }
      {
        user ? 
        <Layout>
          {children}
        </Layout>
        :
        children
      }
    </>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <title>My Voice</title>
      </Head>
      <Provider store={store}>
        <AppInitializer>
        <Component {...pageProps} />
        </AppInitializer>
      </Provider>
    </>
  );
}

export default MyApp;