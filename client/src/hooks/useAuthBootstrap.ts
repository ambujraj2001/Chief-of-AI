import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiBootConfig } from "../services/api";
import { setUser } from "../store/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { type RootState } from "../store";

export const useAuthBootstrap = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const [checking, setChecking] = useState(!user.fullName);

  const isBooting = useRef(false);

  useEffect(() => {
    // Already has data — skip
    if (user.fullName) {
      setChecking(false);
      return;
    }

    // Already in flight — skip
    if (isBooting.current) return;

    const run = async () => {
      const storedCode = localStorage.getItem("accessCode");
      const storedSessionToken = localStorage.getItem("2fa_session");

      if (!storedCode) {
        setChecking(false);
        return;
      }

      isBooting.current = true;
      try {
        const result = await apiBootConfig(storedCode, undefined, storedSessionToken || undefined);
        
        if (result.twoFactorRequired) {
          // Force login but don't clear storage yet, we just need the 2FA code
          navigate("/login", { replace: true });
          return;
        }

        // If a new session token was returned, save it
        if (result.sessionToken) {
          localStorage.setItem("2fa_session", result.sessionToken);
        }

        dispatch(setUser({ ...result, accessCode: storedCode }));
        sessionStorage.setItem("chief_user", JSON.stringify(result));

        const publicPaths = ["/", "/login", "/signup"];
        if (publicPaths.includes(window.location.pathname)) {
          navigate("/dashboard", { replace: true });
        }
      } catch {
        localStorage.removeItem("accessCode");
        localStorage.removeItem("2fa_session");
        sessionStorage.removeItem("chief_user");
        navigate("/login", { replace: true });
      } finally {
        setChecking(false);
        isBooting.current = false;
      }
    };

    run();
  }, [navigate, dispatch, user.fullName]);

  return { checking };
};
