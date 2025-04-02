// Timer.tsx
import React, { useState, useEffect } from 'react';

const Timer: React.FC = () => {
  // Definimos los tipos para nuestro estado
  const [time, setTime] = useState<number>(10); // Tiempo en segundos
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [inputTime, setInputTime] = useState<string>(''); // Para el input del usuario

  // Efecto para manejar el temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            playAlarm();
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    // Limpieza del intervalo
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time]);

  // Función para reproducir sonido de alarma
  const playAlarm = () => {
    const audio = new Audio('URL_DEL_SONIDO_DE_ALARMA.mp3');
    audio.play().catch(error => console.error('Error al reproducir audio:', error));
  };

  // Manejar el inicio del temporizador
  const startTimer = () => {
    console.log('Iniciando temporizador con tiempo:', time);
    const seconds = parseInt(inputTime);
    if (!isNaN(seconds) && seconds > 0) {
      setTime(seconds);
      setIsRunning(true);
      setInputTime('');
    }
  };

  // Detener el temporizador
  const stopTimer = () => {
    setIsRunning(false);
  };

  // Resetear el temporizador
  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
  };

  // Formatear el tiempo a MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer">
      <h1>Temporizador</h1>
      
      <div>
        <input
          type="number"
          value={inputTime}
          onChange={(e) => setInputTime(e.target.value)}
          placeholder="Segundos"
          disabled={isRunning}
        />
        <button onClick={startTimer} disabled={isRunning}>
          Iniciar
        </button>
        <button onClick={stopTimer} disabled={!isRunning}>
          Pausar
        </button>
        <button onClick={resetTimer}>
          Reiniciar
        </button>
      </div>

      <div>
        <h2>Tiempo restante: {formatTime(time)}</h2>
      </div>
    </div>
  );
};

export default Timer;