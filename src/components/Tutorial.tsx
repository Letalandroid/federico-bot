import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

export const Tutorial = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_tutorial');
    if (!hasSeen) {
      setRun(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: '¡Bienvenido al nuevo Prototipo del Sistema de Inventario! Estamos muy contentos de tenerte aquí. Te daremos un rápido recorrido por las funcionalidades clave.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-dashboard',
      content: 'Aquí verás el resumen global: equipos disponibles, en uso, o con bajo stock.',
      placement: 'right',
    },
    {
      target: '#tour-inventory',
      content: 'En esta sección podrás registrar nuevos equipos y consultar todo tu catálogo.',
      placement: 'right',
    },
    {
      target: '#tour-movements',
      content: 'Revisa el historial de movimientos de todos los equipos del sistema.',
      placement: 'right',
    },
    {
      target: '#tour-equipment-loans',
      content: 'Registra los préstamos de equipos y las devoluciones diarios aquí.',
      placement: 'right',
    },
    {
      target: '#tour-reports',
      content: 'Genera reportes de stock y exporta los historiales de movimiento a Excel.',
      placement: 'right',
    },
    {
      target: 'body',
      content: '¡Eso es todo! Empieza a gestionar tu inventario ahora.',
      placement: 'center',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem('has_seen_tutorial', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          zIndex: 10000,
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
      }}
    />
  );
};
