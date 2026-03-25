import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Transition,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBellOff,
  IconClock,
  IconDeviceFloppy,
  IconPencil,
  IconEye,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRotateClockwise2,
  IconTrash,
} from "@tabler/icons-react";

const STORAGE_KEY = "tempo-lab-timers-v2";
const PALETTE = ["#ff7a18", "#f84f7f", "#11a579", "#3c91ff", "#8f57ff", "#ffbf00"];
const DEFAULT_DRAFT = {
  name: "",
  minutes: 5,
  seconds: 0,
  style: "digital",
  color: PALETTE[0],
  sound: "bell",
};

const STYLE_OPTIONS = [
  { value: "digital", label: "Reloj digital" },
  { value: "hourglass", label: "Reloj de arena" },
  { value: "energy", label: "Barra de energia" },
  { value: "cards", label: "Panel numerico" },
];

const SOUND_OPTIONS = [
  { value: "none", label: "Sin sonido" },
  { value: "bell", label: "Campana" },
  { value: "beep", label: "Beep" },
  { value: "chime", label: "Chime" },
  { value: "alarm", label: "Alarma" },
];

const SAMPLE_TIMERS = [
  {
    id: crypto.randomUUID(),
    name: "Lectura silenciosa",
    minutes: 12,
    seconds: 0,
    style: "digital",
    color: "#3c91ff",
    sound: "bell",
  },
  {
    id: crypto.randomUUID(),
    name: "Recoger material",
    minutes: 2,
    seconds: 30,
    style: "hourglass",
    color: "#ff7a18",
    sound: "chime",
  },
  {
    id: crypto.randomUUID(),
    name: "Desafio relampago",
    minutes: 1,
    seconds: 0,
    style: "cards",
    color: "#f84f7f",
    sound: "alarm",
  },
];

function App() {
  const audioPlaybackRef = useRef({ context: null, timeoutId: null });
  const finishPlaybackRef = useRef("");
  const tickerRef = useRef(null);
  const [timers, setTimers] = useState([]);
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("idle");
  const [remainingMs, setRemainingMs] = useState(getDurationMs(DEFAULT_DRAFT));
  const [endAt, setEndAt] = useState(null);
  const [screen, setScreen] = useState("setup");
  const [finishAcknowledged, setFinishAcknowledged] = useState(false);

  const activeTimer = { id: selectedId ?? "draft", ...draft };
  const totalMs = getDurationMs(activeTimer);
  const safeRemainingMs = mode === "idle" ? totalMs : remainingMs;
  const progress = Math.max(0, Math.min(1, safeRemainingMs / Math.max(totalMs, 1000)));
  const finishState = getFinishState(mode, activeTimer.sound, finishAcknowledged);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setTimers(SAMPLE_TIMERS);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setTimers(Array.isArray(parsed) ? parsed.map(normalizeStoredTimer) : SAMPLE_TIMERS);
    } catch {
      setTimers(SAMPLE_TIMERS);
    }
  }, []);

  useEffect(() => {
    if (timers.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    if (mode === "idle") {
      setRemainingMs(totalMs);
      return;
    }

    if (mode !== "running" || !endAt) {
      return;
    }

    tickerRef.current = window.setInterval(() => {
      const nextRemaining = Math.max(0, endAt - Date.now());
      setRemainingMs(nextRemaining);

      if (nextRemaining === 0) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = null;
        setEndAt(null);
        setMode("finished");
        setRemainingMs(0);
        setFinishAcknowledged(activeTimer.sound === "none");

        const playbackKey = `${activeTimer.id}:${endAt}:${activeTimer.sound}`;
        if (activeTimer.sound !== "none" && finishPlaybackRef.current !== playbackKey) {
          finishPlaybackRef.current = playbackKey;
          playFinishSound(activeTimer.sound, audioPlaybackRef, { loop: true });
        }
      }
    }, 100);

    return () => {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    };
  }, [activeTimer.id, activeTimer.sound, endAt, mode, totalMs]);

  useEffect(() => {
    if (!selectedId || !timers.some((timer) => timer.id === selectedId)) {
      return;
    }

    const nextTimer = timers.find((timer) => timer.id === selectedId);
    setDraft(nextTimer);
  }, [timers, selectedId]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", activeTimer.color);
  }, [activeTimer.color]);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape" && screen === "display") {
        handleShowSetup();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [screen]);

  useEffect(() => {
    document.body.classList.toggle("display-mode", screen === "display");
    return () => document.body.classList.remove("display-mode");
  }, [screen]);

  useEffect(() => {
    return () => {
      window.clearInterval(tickerRef.current);
      stopSoundPlayback(audioPlaybackRef);
    };
  }, []);

  function updateDraft(field, value) {
    window.clearInterval(tickerRef.current);
    tickerRef.current = null;
    finishPlaybackRef.current = "";
    stopSoundPlayback(audioPlaybackRef);
    setMode("idle");
    setEndAt(null);
    setFinishAcknowledged(false);
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSave(event) {
    event.preventDefault();
    const normalized = normalizeTimer(draft);

    if (selectedId) {
      setTimers((current) =>
        current.map((timer) => (timer.id === selectedId ? { ...normalized, id: selectedId } : timer)),
      );
      setDraft(normalized);
      return;
    }

    const nextId = crypto.randomUUID();
    const nextTimer = { ...normalized, id: nextId };
    setTimers((current) => [nextTimer, ...current]);
    setSelectedId(nextId);
  }

  function handleDelete() {
    if (!selectedId) {
      return;
    }

    handleDeleteTimer(selectedId);
  }

  function handleDeleteTimer(timerId) {
    const nextTimers = timers.filter((timer) => timer.id !== timerId);
    setTimers(nextTimers);

    if (selectedId === timerId) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
      finishPlaybackRef.current = "";
      stopSoundPlayback(audioPlaybackRef);
      setSelectedId(null);
      setDraft({ ...DEFAULT_DRAFT });
      setMode("idle");
      setEndAt(null);
      setFinishAcknowledged(false);
      setRemainingMs(getDurationMs(DEFAULT_DRAFT));

      if (screen === "display") {
        setScreen("setup");
      }
    }
  }

  function handleNew() {
    window.clearInterval(tickerRef.current);
    tickerRef.current = null;
    finishPlaybackRef.current = "";
    stopSoundPlayback(audioPlaybackRef);
    setSelectedId(null);
    setDraft({ ...DEFAULT_DRAFT });
    setMode("idle");
    setEndAt(null);
    setFinishAcknowledged(false);
    setRemainingMs(getDurationMs(DEFAULT_DRAFT));
  }

  function handleSelect(timer) {
    window.clearInterval(tickerRef.current);
    tickerRef.current = null;
    finishPlaybackRef.current = "";
    stopSoundPlayback(audioPlaybackRef);
    setSelectedId(timer.id);
    setDraft(timer);
    setMode("idle");
    setEndAt(null);
    setFinishAcknowledged(false);
    setRemainingMs(getDurationMs(timer));
  }

  function handleLaunchTimer(timer) {
    handleSelect(timer);
    setScreen("display");
  }

  function handlePreviewSound() {
    playFinishSound(draft.sound, audioPlaybackRef);
  }

  function handleStart() {
    if (totalMs <= 0 || mode === "running") {
      return;
    }

    stopSoundPlayback(audioPlaybackRef);
    finishPlaybackRef.current = "";
    setFinishAcknowledged(false);
    const startFrom = mode === "paused" ? remainingMs : totalMs;
    setRemainingMs(startFrom);
    setEndAt(Date.now() + startFrom);
    setMode("running");
  }

  function handlePause() {
    if (mode !== "running") {
      return;
    }

    window.clearInterval(tickerRef.current);
    tickerRef.current = null;
    stopSoundPlayback(audioPlaybackRef);
    setRemainingMs(Math.max(0, (endAt ?? Date.now()) - Date.now()));
    setEndAt(null);
    setMode("paused");
  }

  function handleReset() {
    window.clearInterval(tickerRef.current);
    tickerRef.current = null;
    finishPlaybackRef.current = "";
    stopSoundPlayback(audioPlaybackRef);
    setMode("idle");
    setEndAt(null);
    setFinishAcknowledged(false);
    setRemainingMs(totalMs);
  }

  function handleToggleTimer() {
    if (mode === "running") {
      handlePause();
      return;
    }

    handleStart();
  }

  function handleShowSetup() {
    if (mode === "running") {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
      setRemainingMs(Math.max(0, (endAt ?? Date.now()) - Date.now()));
      setEndAt(null);
      setMode("paused");
    }

    stopSoundPlayback(audioPlaybackRef);
    setFinishAcknowledged(true);
    setScreen("setup");
  }

  function handleSilenceAlarm() {
    if (mode !== "finished") {
      return;
    }

    stopSoundPlayback(audioPlaybackRef);
    setFinishAcknowledged(true);
  }

  return (
    <>
      <div className="ambient ambient-a"></div>
      <div className="ambient ambient-b"></div>

      <Container size={1100} className="app-shell">
        <Transition mounted transition="fade-up" duration={220} timingFunction="ease">
          {(transitionStyles) =>
            screen === "setup" ? (
              <section className="screen-stack" style={transitionStyles}>
                <Paper radius="xl" p="lg" className="ui-panel hero-panel compact-header">
                  <Stack gap="sm" align="center" justify="center" className="panel-center-stack">
                    <Title order={1} className="screen-title">
                      Temporizador
                    </Title>
                  </Stack>
                </Paper>

                <Paper radius="xl" p="lg" className="ui-panel compact-setup-panel">
                  <form onSubmit={handleSave} className="setup-form">
                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" verticalSpacing="lg" className="setup-grid">
                      <Stack gap="md" align="center" className="setup-fields">
                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                          <TextInput
                            label="Nombre"
                            placeholder="Lectura silenciosa"
                            required
                            size="md"
                            value={draft.name}
                            onChange={(event) => updateDraft("name", event.currentTarget.value)}
                          />

                          <Select
                            data={STYLE_OPTIONS}
                            label="Estilo"
                            size="md"
                            value={draft.style}
                            onChange={(value) => updateDraft("style", value ?? "digital")}
                          />

                          <Group align="flex-end" gap="xs" wrap="nowrap">
                            <Select
                              data={SOUND_OPTIONS}
                              label="Sonido"
                              size="md"
                              style={{ flex: 1 }}
                              value={draft.sound}
                              onChange={(value) => updateDraft("sound", value ?? "bell")}
                            />
                            <ActionIcon
                              aria-label="Preescuchar sonido"
                              color="orange"
                              disabled={draft.sound === "none"}
                              radius="xl"
                              size={42}
                              variant="light"
                              onClick={handlePreviewSound}
                            >
                              <IconPlayerPlay size={18} />
                            </ActionIcon>
                          </Group>
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                          <NumberInput
                            allowDecimal={false}
                            allowNegative={false}
                            clampBehavior="strict"
                            label="Minutos"
                            max={180}
                            min={0}
                            size="md"
                            value={draft.minutes}
                            onChange={(value) => updateDraft("minutes", clampNumber(value, 0, 180))}
                          />

                          <NumberInput
                            allowDecimal={false}
                            allowNegative={false}
                            clampBehavior="strict"
                            label="Segundos"
                            max={59}
                            min={0}
                            size="md"
                            value={draft.seconds}
                            onChange={(value) => updateDraft("seconds", clampNumber(value, 0, 59))}
                          />
                        </SimpleGrid>

                        <Stack gap="xs" align="center" className="setup-color-block">
                          <Text fw={600} size="sm">
                            Color
                          </Text>
                          <Group gap="xs" justify="center">
                            {PALETTE.map((color) => (
                              <ActionIcon
                                key={color}
                                aria-label={`Color ${color}`}
                                className="color-action"
                                radius="xl"
                                size={42}
                                variant={draft.color === color ? "filled" : "light"}
                                style={{
                                  background: draft.color === color ? color : "rgba(255,255,255,0.72)",
                                  border: draft.color === color ? `2px solid ${color}` : "1px solid rgba(31,41,64,0.08)",
                                }}
                                onClick={() => updateDraft("color", color)}
                              >
                                <Box className="color-dot" style={{ background: color }} />
                              </ActionIcon>
                            ))}
                          </Group>
                        </Stack>

                      </Stack>

                      <Card radius="xl" padding="lg" className="mini-preview-card compact-preview-card">
                        <Stack justify="space-between" h="100%" align="center" className="preview-card-stack">
                          <Group justify="space-between" align="flex-start" className="preview-card-head">
                            <Stack gap={4} align="center">
                              <Text fw={800}>Vista rápida</Text>
                              <Text c="dimmed" size="sm">
                                {formatDuration(totalMs)}
                              </Text>
                            </Stack>
                            <Badge radius="xl" variant="light" color="orange">
                              {getStyleLabel(activeTimer.style)}
                            </Badge>
                          </Group>

                          <div className="compact-stage-shell">
                            <TimerStage
                              compact
                              timer={activeTimer}
                              mode={mode}
                              progress={progress}
                              remainingMs={safeRemainingMs}
                              totalMs={totalMs}
                            />
                          </div>

                          <Group justify="center" className="setup-actions">
                            <Button
                              leftSection={<IconDeviceFloppy size={18} />}
                              radius="xl"
                              size="md"
                              type="submit"
                            >
                              {selectedId ? "Guardar cambios" : "Guardar"}
                            </Button>

                            <Button
                              leftSection={<IconEye size={18} />}
                              radius="xl"
                              size="md"
                              type="button"
                              variant="light"
                              onClick={() => setScreen("display")}
                            >
                              Ver
                            </Button>

                            {selectedId ? (
                              <Button
                                color="red"
                                leftSection={<IconTrash size={18} />}
                                radius="xl"
                                size="md"
                                type="button"
                                variant="light"
                                onClick={handleDelete}
                              >
                                Eliminar
                              </Button>
                            ) : null}
                          </Group>
                        </Stack>
                      </Card>
                    </SimpleGrid>
                  </form>
                </Paper>

                <Paper radius="xl" p="lg" className="ui-panel compact-library-panel">
                  <Group justify="space-between" mb="md" className="library-head">
                    <Title order={3}>Guardados</Title>
                    <Group gap="sm" justify="center">
                      <Badge radius="xl" variant="light" color="gray">
                        {timers.length}
                      </Badge>
                      <ActionIcon radius="xl" size={42} variant="light" color="orange" onClick={handleNew}>
                        <IconPlus size={22} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                    {timers.length === 0 ? (
                      <Card radius="xl" padding="xl" className="saved-card empty-card">
                        <Stack align="center" gap="xs">
                          <ThemeIcon radius="xl" size={42} variant="light" color="gray">
                            <IconClock size={20} />
                          </ThemeIcon>
                          <Text fw={700}>Sin temporizadores</Text>
                        </Stack>
                      </Card>
                    ) : (
                      timers.map((timer) => (
                        <Card
                          key={timer.id}
                          padding="lg"
                          radius="xl"
                          className={`saved-card${selectedId === timer.id ? " active" : ""}`}
                          style={{ "--accent-current": timer.color }}
                        >
                          <Stack gap="md" align="center" className="saved-card-stack">
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={2} className="saved-copy">
                                <Text fw={800}>{timer.name}</Text>
                                <Text c="dimmed" size="sm">
                                  {getStyleLabel(timer.style)}
                                </Text>
                              </Stack>
                              <Group gap={6} align="center" className="saved-icon-actions">
                                <ActionIcon
                                  aria-label={`Editar ${timer.name}`}
                                  radius="xl"
                                  variant="light"
                                  onClick={() => handleSelect(timer)}
                                >
                                  <IconPencil size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  aria-label={`Ver ${timer.name}`}
                                  radius="xl"
                                  variant="light"
                                  color="orange"
                                  onClick={() => handleLaunchTimer(timer)}
                                >
                                  <IconEye size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  aria-label={`Borrar ${timer.name}`}
                                  color="red"
                                  radius="xl"
                                  variant="light"
                                  onClick={() => handleDeleteTimer(timer.id)}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Group>

                            <div className="saved-preview">
                              <TimerStage
                                compact
                                timer={timer}
                                mode="idle"
                                progress={1}
                                remainingMs={getDurationMs(timer)}
                                totalMs={getDurationMs(timer)}
                              />
                            </div>
                          </Stack>
                        </Card>
                      ))
                    )}
                  </SimpleGrid>
                </Paper>
              </section>
            ) : (
              <section className="screen-stack display-screen" style={transitionStyles}>
                <Paper radius="xl" p="lg" className="ui-panel">
                  <Group justify="space-between" align="center" className="display-head display-toolbar">
                    <Button
                      leftSection={<IconArrowLeft size={18} />}
                      radius="xl"
                      variant="light"
                      onClick={handleShowSetup}
                    >
                      Configurar
                    </Button>

                    <Group justify="center" wrap="wrap" className="controls-row display-top-controls">
                      <Button
                        leftSection={mode === "running" ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
                        radius="xl"
                        size="md"
                        onClick={handleToggleTimer}
                      >
                        {mode === "running" ? "Pausar" : mode === "paused" ? "Reanudar" : mode === "finished" ? "Repetir" : "Iniciar"}
                      </Button>
                      <Button
                        leftSection={<IconRotateClockwise2 size={18} />}
                        radius="xl"
                        size="md"
                        variant="light"
                        onClick={handleReset}
                      >
                        Reiniciar
                      </Button>
                      {finishState === "ringing" ? (
                        <Button
                          color="red"
                          leftSection={<IconBellOff size={18} />}
                          radius="xl"
                          size="md"
                          variant="filled"
                          onClick={handleSilenceAlarm}
                        >
                          Silenciar
                        </Button>
                      ) : null}
                    </Group>

                    <Badge radius="xl" size="lg" variant="light" color="orange">
                      {getStyleLabel(activeTimer.style)}
                    </Badge>
                  </Group>
                </Paper>

                <Paper radius="xl" p="lg" className="ui-panel preview-panel display-preview-panel">
                  <TimerStage
                    finishState={finishState}
                    hideStatus
                    interactive={finishState === "ringing"}
                    onClick={handleSilenceAlarm}
                    timer={activeTimer}
                    mode={mode}
                    progress={progress}
                    remainingMs={safeRemainingMs}
                    totalMs={totalMs}
                  />
                </Paper>
              </section>
            )
          }
        </Transition>
      </Container>
    </>
  );
}

function TimerStage({
  timer,
  mode,
  progress,
  remainingMs,
  totalMs,
  compact = false,
  finishState = "inactive",
  hideName = false,
  hideStatus = false,
  interactive = false,
  onClick,
}) {
  const finished = mode === "finished" && remainingMs === 0;
  const showHeader = !compact && (!hideName || !hideStatus);
  const [minutesLeft, secondsLeft] = splitClock(remainingMs);
  const canSilence = interactive && finishState === "ringing" && finished && typeof onClick === "function";
  const showFinishPanel = finished && !compact;

  return (
    <section
      aria-label={canSilence ? "Temporizador terminado. Pulsa para silenciar el sonido." : undefined}
      className={[
        "timer-stage",
        compact ? "compact-stage" : "",
        `${timer.style}-stage`,
        finished ? "is-finished" : "",
        finishState === "ringing" ? "is-ringing" : "",
        finishState === "silenced" ? "is-silenced" : "",
        canSilence ? "is-clickable" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={canSilence ? onClick : undefined}
      onKeyDown={
        canSilence
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={canSilence ? "button" : undefined}
      style={{
        "--accent-current": timer.color,
        "--progress": progress,
      }}
      tabIndex={canSilence ? 0 : undefined}
    >
      {showFinishPanel ? (
        <div className="alarm-rings" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
      ) : null}

      {showHeader ? (
        <header className="timer-header">
          <div>
            {!hideName ? <h3 className="timer-name">{timer.name || "Temporizador sin nombre"}</h3> : null}
          </div>
          {!hideStatus ? <span className="timer-badge">{getStatusLabel(mode)}</span> : null}
        </header>
      ) : null}

      {timer.style === "hourglass" ? (
        <>
          <div className="hourglass-cluster">
            <div className="hourglass-shell">
              <div className="hourglass-frame"></div>
              <div className="hourglass-glass">
                <div className="glass-top">
                  <div className="sand-top"></div>
                </div>
                <div className="sand-stream"></div>
                <div className="glass-bottom">
                  <div className="sand-bottom"></div>
                </div>
              </div>
              <div className="hourglass-stand"></div>
            </div>
            <div className="hourglass-info">
              <div className="hourglass-time">{formatClock(remainingMs)}</div>
            </div>
          </div>
        </>
      ) : null}

      {timer.style === "energy" ? (
        <>
          <div className="energy-shell">
            <div className="energy-battery">
              <div className="energy-fill"></div>
              <div className="energy-grid"></div>
              <div className="energy-center">
                <div className="time-label">{formatClock(remainingMs)}</div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {timer.style === "cards" ? (
        <div className="cards-stage">
          <div className="cards-shell">
            <div className="time-card">{minutesLeft}</div>
            <div className="time-separator">:</div>
            <div className="time-card">{secondsLeft}</div>
          </div>
        </div>
      ) : null}

      {timer.style === "digital" ? (
        <div className="digital-stage">
          <div className="digital-readout">
            <div className="time-label">{formatClock(remainingMs)}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function normalizeTimer(timer) {
  return {
    name: normalizeName(timer.name),
    minutes: clampNumber(timer.minutes, 0, 180),
    seconds: clampNumber(timer.seconds, 0, 59),
    style: normalizeStyle(timer.style),
    color: normalizeColor(timer.color),
    sound: normalizeSound(timer.sound),
  };
}

function normalizeStoredTimer(timer) {
  return {
    ...normalizeTimer(timer),
    id: normalizeTimerId(timer?.id),
  };
}

function normalizeName(name) {
  return typeof name === "string" && name.trim() ? name.trim() : "Temporizador sin nombre";
}

function normalizeTimerId(timerId) {
  return typeof timerId === "string" && timerId.trim() ? timerId : crypto.randomUUID();
}

function normalizeStyle(style) {
  if (style === "orbit" || style === "pulse") {
    return "cards";
  }

  return STYLE_OPTIONS.some((option) => option.value === style) ? style : "digital";
}

function normalizeSound(sound) {
  return SOUND_OPTIONS.some((option) => option.value === sound) ? sound : "bell";
}

function normalizeColor(color) {
  return PALETTE.includes(color) ? color : PALETTE[0];
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return min;
  }
  return Math.max(min, Math.min(max, numeric));
}

function getDurationMs(timer) {
  return (Number(timer.minutes) * 60 + Number(timer.seconds)) * 1000;
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function splitClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return [String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")];
}

function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes && seconds) {
    return `${minutes} min ${seconds} s`;
  }

  if (minutes) {
    return `${minutes} min`;
  }

  return `${seconds} s`;
}

function getStyleLabel(style) {
  return STYLE_OPTIONS.find((option) => option.value === style)?.label ?? style;
}

function getStatusLabel(mode) {
  if (mode === "running") return "En marcha";
  if (mode === "paused") return "En pausa";
  if (mode === "finished") return "Terminado";
  return "Listo";
}

function getFinishState(mode, sound, finishAcknowledged) {
  if (mode !== "finished") {
    return "inactive";
  }

  if (sound === "none") {
    return "done";
  }

  return finishAcknowledged ? "silenced" : "ringing";
}

async function playFinishSound(sound, audioPlaybackRef, options = {}) {
  const { loop = false } = options;

  if (sound === "none" || typeof window === "undefined") {
    return;
  }

  const pattern = getSoundPattern(sound);
  if (!pattern) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  stopSoundPlayback(audioPlaybackRef);

  const context = new AudioContextClass();
  audioPlaybackRef.current.context = context;

  if (context.state === "suspended") {
    await context.resume();
  }

  if (audioPlaybackRef.current.context !== context) {
    context.close().catch(() => {});
    return;
  }

  const master = context.createGain();
  master.connect(context.destination);
  master.gain.setValueAtTime(0.7, context.currentTime);

  const schedulePlayback = () => {
    if (audioPlaybackRef.current.context !== context) {
      return;
    }

    scheduleSoundPattern(context, master, context.currentTime + 0.02, pattern.tones);
    audioPlaybackRef.current.timeoutId = window.setTimeout(() => {
      if (loop) {
        schedulePlayback();
        return;
      }

      stopSoundPlayback(audioPlaybackRef);
    }, pattern.cycleMs);
  };

  schedulePlayback();
}

function getSoundPattern(sound) {
  const patterns = {
    bell: {
      cycleMs: 1500,
      tones: [
        [880, 0, 0.45, "sine", 0.18],
        [1320, 0.12, 0.32, "triangle", 0.12],
      ],
    },
    beep: {
      cycleMs: 1500,
      tones: [
        [740, 0, 0.18, "square", 0.14],
        [740, 0.25, 0.18, "square", 0.14],
      ],
    },
    chime: {
      cycleMs: 1600,
      tones: [
        [523.25, 0, 0.3, "sine", 0.14],
        [659.25, 0.18, 0.4, "sine", 0.12],
        [783.99, 0.36, 0.55, "triangle", 0.1],
      ],
    },
    alarm: {
      cycleMs: 1500,
      tones: [
        [660, 0, 0.16, "sawtooth", 0.09],
        [830, 0.2, 0.16, "sawtooth", 0.09],
        [660, 0.4, 0.16, "sawtooth", 0.09],
        [830, 0.6, 0.2, "sawtooth", 0.09],
      ],
    },
  };

  return patterns[sound] ?? null;
}

function scheduleSoundPattern(context, destination, startAt, tones) {
  tones.forEach(([frequency, offset, duration, type, gainValue]) => {
    scheduleTone(context, destination, startAt + offset, frequency, duration, type, gainValue);
  });
}

function scheduleTone(context, destination, startAt, frequency, duration, type, gainValue) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.04);
}

function stopSoundPlayback(audioPlaybackRef) {
  if (audioPlaybackRef.current.timeoutId) {
    window.clearTimeout(audioPlaybackRef.current.timeoutId);
  }

  if (audioPlaybackRef.current.context) {
    audioPlaybackRef.current.context.close().catch(() => {});
  }

  audioPlaybackRef.current = {
    context: null,
    timeoutId: null,
  };
}

export default App;
