import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiBootConfig } from '../services/api';
import { setUser } from '../store/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store';

export const useAuthBootstrap = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const [checking, setChecking] = useState(!user.fullName);

  useEffect(() => {
    // If we already have a user in Redux, no need to boot again
    if (user.fullName) {
      setChecking(false);
      return;
    }

    const run = async () => {
      const storedCode = localStorage.getItem('accessCode');

      if (!storedCode) {
        setChecking(false);
        return;
      }

      try {
        const result = await apiBootConfig(storedCode);
        dispatch(setUser(result));
        sessionStorage.setItem('chief_user', JSON.stringify(result));

        // Only redirect to dashboard if we are on a landing/auth page
        const publicPaths = ['/', '/login', '/signup'];
        if (publicPaths.includes(window.location.pathname)) {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        // Invalid / expired — wipe stale state and send to login
        localStorage.removeItem('accessCode');
        sessionStorage.removeItem('chief_user');
        navigate('/login', { replace: true });
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [navigate, dispatch, user.fullName]);

  return { checking };
};
