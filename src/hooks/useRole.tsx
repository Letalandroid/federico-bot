import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type AppRole = 'administrador' | 'tecnico';

export const useRole = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!userProfile) {
      setRoles([]);
      setLoading(false);
      return;
    }

    // Role is now stored in userProfile from the backend
    setRoles([userProfile.role as AppRole]);
    setLoading(false);
  }, [userProfile, authLoading]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = hasRole('administrador');
  const isTechnician = hasRole('tecnico');

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isTechnician,
  };
};
