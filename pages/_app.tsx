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
import Head from "next/head";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch:AppDispatch = useDispatch();
  const { routines } = useSelector((state: RootState) => state.routine);
  const router = useRouter();
  const selectedRoutine = useSelector((state: RootState) => state.routine.selectedRoutineIndex);
  useEffect(() => {
    dispatch(verifyUser());
  }, [dispatch]);
  return (
    <>
      {
        <Navbar
          onMyRoutine={() => router.push("/routine")}
          onNewRoutine={() => router.push("/routine-form")}
          onProgress={() => router.push("/progress")}
          onLogout={() => dispatch(logout())}
          onGenerateRoutine={() => router.push("/routine-AI")}
          
          onEditRoutine={
            router.asPath === "/routine" ? () => selectedRoutine !== null && router.push(`/routine-edit/${routines[selectedRoutine]._id}`) : undefined
          }
        />      
      }
      {children}
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
        <link rel="manifest" href="/site.webmanifest" /> {/* Opcional */}
        <title>My Voice</title> {/* Opcional: título global */}
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