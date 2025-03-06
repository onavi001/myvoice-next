import { AppProps } from "next/app";
import { Provider } from "react-redux";
import { AppDispatch, store } from "../store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { verifyUser } from "../store/userSlice";
import "../styles/globals.css";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch:AppDispatch = useDispatch();

  useEffect(() => {
    dispatch(verifyUser());
  }, [dispatch]);

  return <>{children}</>;
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