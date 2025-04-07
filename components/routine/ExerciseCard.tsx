import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { IExercise } from "../../models/Exercise";
import Card from "../Card";
import Input from "../Input";
import Textarea from "../Textarea";
import Button from "../Button";
import VideoPlayer from "./VideoPlayer";
import ModelWorkoutModal from "../ModelWorkoutModal";
import Loader, { SmallLoader } from "../Loader";
import { ArrowPathIcon, PlayCircleIcon, EyeIcon, StopCircleIcon } from "@heroicons/react/16/solid";
import useExerciseActions from "../../hooks/useExerciseActions";

export default function ExerciseCard({
  exercise,
  routineId,
  dayIndex,
  exerciseIndex,
  onGenerateExercise,
}: {
  exercise: IExercise;
  routineId: string;
  dayIndex: number;
  exerciseIndex: number;
  onGenerateExercise: (dayIndex: number, exerciseIndex: number) => void;
}) {
  const { selectedRoutineIndex } = useSelector((state: RootState) => state.routine);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editData, setEditData] = useState<Partial<IExercise>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [phase, setPhase] = useState<"sets" | "rest" | null>(null); // Cambiamos "reps" por "sets"
  const [remainingSets, setRemainingSets] = useState<number>(0); // Cambiamos "remainingReps" por "remainingSets"
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [openBodyModal, setOpenBodyModal] = useState(false);
  const [musclesToShow, setMusclesToShow] = useState<string[]>([]);
  const { loadingVideos, handleSave, handleToggleCompleted, handleFetchVideos } = useExerciseActions();

  useEffect(() => {
    if (isExpanded && selectedRoutineIndex !== null) {
      handleFetchVideos(exercise.name, selectedRoutineIndex, dayIndex, exerciseIndex);
    }
  }, [exercise]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && selectedRoutineIndex !== null) {
      handleFetchVideos(exercise.name, selectedRoutineIndex, dayIndex, exerciseIndex);
    }
  };

  const handleInputChange = (field: keyof IExercise, value: string | number) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      await handleSave(dayIndex, exerciseIndex, editData);
      setEditData({});
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const onToggleCompleted = async () => {
    setIsToggling(true);
    try {
      await handleToggleCompleted(routineId.toString(), dayIndex, exerciseIndex);
    } finally {
      setIsToggling(false);
    }
  };

  const handleStartExercise = () => {
    const sets = parseInt(String(currentExercise.sets || 0), 10); // Usamos "sets" en lugar de "reps"
    const restTime = parseInt(String(currentExercise.rest || 0), 10);

    if (isNaN(sets) || sets <= 0 || isNaN(restTime) || restTime <= 0) {
      return;
    }

    setIsInProgress(true);
    setRemainingSets(sets); // Inicializamos con el número de series
    startSetPhase(); // Cambiamos "startRepPhase" por "startSetPhase"
  };

  const startSetPhase = () => {
    setPhase("sets");
    setTimer(10); // Cada serie dura 60 segundos
    setTotalTime(10);

    const interval: NodeJS.Timeout = setInterval(() => {
      setTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setAlertMessage("¡Serie completada! Ahora descansa.");
          const audio = new Audio("/alarmas/alarma1.mp3");
          audio.play().catch((error) => console.error("Error al reproducir audio:", error));
          startRestPhase();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(interval);
  };

  const startRestPhase = () => {
    const restTime = parseInt(String(currentExercise.rest || 0), 10);
    setPhase("rest");
    setTimer(restTime);
    setTotalTime(restTime);

    const restInterval = setInterval(() => {
      setTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(restInterval);
          setAlertMessage("¡Descanso terminado! Siguiente serie.");
          const audio = new Audio("/alarmas/alarma1.mp3");
          audio.play().catch((error) => console.error("Error al reproducir audio:", error));
          setRemainingSets((prevSets) => {
            if (prevSets > 1) {
              startSetPhase();
              return prevSets - 1;
            } else {
              setIsInProgress(false);
              setTimer(null);
              setTotalTime(null);
              setIntervalId(null);
              setPhase(null);
              setAlertMessage(null);
              setShowCongrats(true);
              setTimeout(() => setShowCongrats(false), 3000);
              return 0;
            }
          });
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(restInterval);
  };

  const handleStopExercise = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIsInProgress(false);
      setTimer(null);
      setTotalTime(null);
      setIntervalId(null);
      setPhase(null);
      setRemainingSets(0);
      setAlertMessage(null);
      setShowCongrats(false);
    }
  };

  const currentExercise = { ...exercise, ...editData };

  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const progress = timer !== null && totalTime !== null ? (timer / totalTime) * circumference : circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={toggleExpand}
        className="w-full flex justify-between items-center p-2 text-left hover:bg-[#4A4A4A] transition-colors"
      >
        <div className="flex items-center">
          {isToggling ? (
            <Loader />
          ) : (
            <input
              type="checkbox"
              checked={currentExercise.completed || false}
              onChange={onToggleCompleted}
              onClick={(e) => e.stopPropagation()}
              className="mr-2 accent-[#34C759]"
            />
          )}
          <span className="text-sm font-semibold text-white truncate">{exercise.name}</span>
        </div>
        <span className="text-[#B0B0B0] text-xs">{isExpanded ? "▲" : "▼"}</span>
      </button>
      {isExpanded && (
        <div className="p-2 bg-[#4A4A4A] text-xs space-y-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleStartExercise}
              className="flex items-center bg-[#34C759] text-black rounded-full text-xs hover:bg-[#2ca44e] disabled:opacity-50"
              disabled={isInProgress}
            >
              <span className="ml-1">Iniciar ejercicio</span>
              <PlayCircleIcon className="w-4 h-4 mx-2" />
            </Button>
            {isInProgress && (
              <Button
                onClick={handleStopExercise}
                className="flex items-center bg-[#EF5350] text-white rounded-full text-xs hover:bg-[#D32F2F]"
              >
                <span className="ml-1">Detener</span>
                <StopCircleIcon className="w-4 h-4 mx-2" />
              </Button>
            )}
          </div>
          {isInProgress && timer !== null && totalTime !== null && (
            <div className="flex flex-col items-center">
              <svg width="60" height="60" className="relative">
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke="#2D2D2D"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke={phase === "sets" ? "#FFD700" : "#34C759"}
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 30 30)"
                  className="transition-all duration-1000 ease-linear"
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dy=".3em"
                  className="text-white font-semibold text-sm"
                >
                  {timer} s
                </text>
              </svg>
              <p className={`mt-2 text-sm font-bold ${phase === "sets" ? "text-[#FFD700]" : "text-[#34C759]"}`}>
                {phase === "sets"
                  ? `Serie ${currentExercise.sets - remainingSets + 1} de ${currentExercise.sets}`
                  : `Descanso (${remainingSets - 1} series restantes)`}
              </p>
            </div>
          )}
          {alertMessage && (
            <div className="text-center text-[#FFD700] bg-[#2D2D2D] p-2 rounded-md mt-2 animate-pulse">
              {alertMessage}
            </div>
          )}
          {showCongrats && (
            <div className="text-center text-[#34C759] bg-[#2D2D2D] p-4 rounded-md mt-2 animate-congrats">
              <p className="text-lg font-bold">🏆 ¡Felicidades, lo lograste!</p>
              <p className="text-sm">¡Gran trabajo completando las series!</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1">
            <div>
              <button
                onClick={() => {
                  setOpenBodyModal(true);
                  setMusclesToShow(exercise.muscleGroup);
                }}
                className="flex text-[#B0B0B0] font-semibold"
              >
                Músculo: <EyeIcon className="w-4 h-4 ml-2" />
              </button>
              <p className="text-[#FFFFFF]">{currentExercise.muscleGroup.join(", ")}</p>
              <Button
                onClick={() => onGenerateExercise(dayIndex, exerciseIndex)}
                className="my-4 flex items-center gap-1 bg-[#34C759] text-black px-2 py-1 rounded-full text-xs hover:bg-[#2ca44e]"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Regenerar</span>
              </Button>
            </div>
            {currentExercise.tips?.length > 0 && (
              <div>
                <span className="text-[#B0B0B0] font-semibold">Consejos:</span>
                <ul className="list-disc pl-3 text-[#FFFFFF] max-w-full">
                  {currentExercise.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {loadingVideos ? (
            <SmallLoader />
          ) : (
            <VideoPlayer exercise={exercise} routineId={routineId.toString()} dayIndex={dayIndex} exerciseIndex={exerciseIndex} />
          )}
          <div className="grid grid-cols-3 gap-1">
            <div>
              <label className="text-[#B0B0B0]">Series:</label>
              <Input
                name="sets"
                type="number"
                value={currentExercise.sets || ""}
                onChange={(e) => handleInputChange("sets", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[#B0B0B0]">Reps:</label>
              <Input
                name="reps"
                type="number"
                value={currentExercise.reps || ""}
                onChange={(e) => handleInputChange("reps", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[#B0B0B0]">Unidad Reps:</label>
              <select
                name="repsUnit"
                value={currentExercise.repsUnit || "count"}
                onChange={(e) => handleInputChange("repsUnit", e.target.value)}
                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
              >
                <option value="count">Unidades (U)</option>
                <option value="seconds">Segundos (S)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div>
              <label className="text-[#B0B0B0]">Descanso:</label>
              <Input
                name="rest"
                value={(currentExercise.rest || "") }
                onChange={(e) => handleInputChange("rest", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[#B0B0B0]">Peso:</label>
              <Input
                name="weight"
                value={currentExercise.weight || ""}
                onChange={(e) => handleInputChange("weight", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[#B0B0B0]">Unidad:</label>
              <select
                name="weightUnit"
                value={currentExercise.weightUnit || "kg"}
                onChange={(e) => handleInputChange("weightUnit", e.target.value)}
                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
              >
                <option value="kg">Kilos (kg)</option>
                <option value="lb">Libras (lb)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[#B0B0B0]">Notas:</label>
            <Textarea
              name="notes"
              value={currentExercise.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="h-8 resize-none"
            />
          </div>
          <Button
            onClick={onSave}
            className="w-full disabled:opacity-50"
            disabled={!Object.keys(editData).length || isSaving}
          >
            {isSaving ? (
              <>
                <Loader />
                Guardar
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      )}
      {openBodyModal && (
        <ModelWorkoutModal
          musclesToShow={musclesToShow}
          isOpen={openBodyModal}
          onClose={() => setOpenBodyModal(false)}
        />
      )}
    </Card>
  );
}
