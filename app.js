const STORAGE_KEY = "pulseboard.webapp.state.v1";
const LEGACY_STORAGE_KEY = "pulseboard-training-log";

const sessionKinds = {
  strength: { label: "Strength", emphasis: "strength", color: "#b44e27", description: "Heavy or controlled resistance work" },
  explosive: { label: "Explosive", emphasis: "power", color: "#d8a52f", description: "Short neural work and fast output" },
  run: { label: "Run", emphasis: "endurance", color: "#d6672d", description: "Aerobic or speed running work" },
  bike: { label: "Bike", emphasis: "endurance", color: "#216e73", description: "Engine work with low skill friction" },
  swim: { label: "Swim", emphasis: "endurance", color: "#3b87a1", description: "Aerobic work with upper-body demand" },
  surf: { label: "Surf", emphasis: "mixed", color: "#2e84a2", description: "Skill, trunk, and upper-body load" },
  functional: { label: "Functional", emphasis: "mixed", color: "#7b624f", description: "Athletic mixed sessions" },
  mobility: { label: "Mobility", emphasis: "recovery", color: "#648960", description: "Low-cost movement and reset" },
  hike: { label: "Hike", emphasis: "endurance", color: "#5e8b54", description: "Steady aerobic work outdoors" },
  recovery: { label: "Recovery", emphasis: "recovery", color: "#6a759f", description: "Easy movement that helps you bounce back" }
};

const routineKinds = {
  strength: "Strength",
  conditioning: "Conditioning",
  mixed: "Mixed",
  recovery: "Recovery"
};

const STARTER_LEG_DAY_NAME = "Leg Day Strength";
const liftSessionKinds = new Set(["strength", "functional", "explosive"]);
const exerciseRestOptions = Array.from({ length: 19 }, (_, index) => 30 + (index * 15));
const exerciseSetTimeOptions = Array.from({ length: 22 }, (_, index) => 15 + (index * 5));
const effortPercentOptions = [40, 50, 60, 70, 75, 80, 85, 90, 95, 100];
const setWeightModeOptions = {
  same: "Main weight",
  percent: "% of main",
  bodyweight: "No weight",
  fixed: "Fixed kg"
};
const weekdayDefinitions = [
  { index: 0, short: "Mon", long: "Monday", aliases: ["mon", "monday", "man", "mandag", "lun", "lunes"] },
  { index: 1, short: "Tue", long: "Tuesday", aliases: ["tue", "tues", "tuesday", "tir", "tirsdag", "mar", "martes"] },
  { index: 2, short: "Wed", long: "Wednesday", aliases: ["wed", "wednesday", "ons", "onsdag", "mie", "miercoles", "miercoles"] },
  { index: 3, short: "Thu", long: "Thursday", aliases: ["thu", "thur", "thurs", "thursday", "tor", "torsdag", "jue", "jueves"] },
  { index: 4, short: "Fri", long: "Friday", aliases: ["fri", "friday", "fre", "fredag", "vie", "viernes"] },
  { index: 5, short: "Sat", long: "Saturday", aliases: ["sat", "saturday", "lor", "lordag", "lordag", "sab", "sabado"] },
  { index: 6, short: "Sun", long: "Sunday", aliases: ["sun", "sunday", "son", "sondag", "dom", "domingo"] }
];
const weekdayAliasLookup = new Map(
  weekdayDefinitions.flatMap((day) => day.aliases.map((alias) => [alias, day.index]))
);

const bodyAreas = [
  { key: "legs", label: "Legs" },
  { key: "glutes", label: "Glutes" },
  { key: "back", label: "Back" },
  { key: "shoulders", label: "Shoulders" },
  { key: "chest", label: "Chest" },
  { key: "arms", label: "Arms" },
  { key: "core", label: "Core" }
];

const workoutImportKeywords = {
  strength: ["strength", "gym", "squat", "bench", "deadlift", "rdl", "press", "row", "pull up", "chin up", "pull down", "lat pd", "dips", "lunges", "leg ex", "ham curl", "kg", "kgs", "lb", "lbs", "reps", "sets"],
  explosive: ["explosive", "power", "sprint", "jump", "jumps", "bound", "bounds", "plyo", "throw", "slam", "med ball"],
  run: ["run", "running", "jog", "tempo", "track", "interval", "fartlek", "pace", "km", "mile", "miles"],
  bike: ["bike", "cycling", "ride", "trainer", "watts", "rpm", "cadence"],
  swim: ["swim", "swimming", "pool", "freestyle", "laps", "stroke"],
  surf: ["surf", "waves", "paddle out", "paddling"],
  functional: ["functional", "circuit", "wod", "amrap", "emom", "metcon", "cali", "calisthenics", "human flag", "handstand", "dead hang"],
  mobility: ["mobility", "stretch", "yoga", "flow", "warm up", "cool down"],
  hike: ["hike", "trail", "elevation", "climb", "ascent"],
  recovery: ["recovery", "walk", "easy", "restorative"]
};

const importedExerciseAliases = [
  { pattern: /\bfront\s*squat\b/i, name: "Front Squat", areas: ["legs", "glutes", "core"] },
  { pattern: /\bhack\s*squat\b/i, name: "Hack Squat", areas: ["legs", "glutes"] },
  { pattern: /\bgoblet\s*squat\b/i, name: "Goblet Squat", areas: ["legs", "glutes", "core"] },
  { pattern: /\b(?:bgss|bss|bulgarian)\b/i, name: "Bulgarian Split Squat", areas: ["legs", "glutes", "core"] },
  { pattern: /\b(?:back\s*squat|bb\s*squat|squat)\b/i, name: "Back Squat", areas: ["legs", "glutes", "core"] },
  { pattern: /\bromanian\s*deadlift\b|\brdl\b/i, name: "Romanian Deadlift", areas: ["legs", "glutes", "back"] },
  { pattern: /\bdeadlift\b/i, name: "Deadlift", areas: ["legs", "glutes", "back", "core"] },
  { pattern: /\bhip\s*(?:thrust|trust)s?\b/i, name: "Hip Thrust", areas: ["glutes", "legs", "core"] },
  { pattern: /\bleg\s*press\b/i, name: "Leg Press", areas: ["legs", "glutes"] },
  { pattern: /\b(?:step[\s-]*ups?)\b/i, name: "Step-Up", areas: ["legs", "glutes", "core"] },
  { pattern: /\b(?:leg|ham)\s*curl\b/i, name: "Leg Curl", areas: ["legs"] },
  { pattern: /\bleg(?:\s*ex|\s*extension)\b|\bquad\s*raise\b/i, name: "Leg Extension", areas: ["legs"] },
  { pattern: /\bcalf\s*raise\b/i, name: "Calf Raise", areas: ["legs"] },
  { pattern: /\b(?:walking\s*)?l(?:ou)?nges?\b/i, name: "Walking Lunge", areas: ["legs", "glutes", "core"] },
  { pattern: /\bkick\s*backs?\b|\bpush\s*backs?\b/i, name: "Cable Kickback", areas: ["glutes", "legs"] },
  { pattern: /\b(?:back|bootie|lower\s*back)\s*(?:ex|extension)s?\b/i, name: "Back Extension", areas: ["glutes", "back", "core"] },
  { pattern: /\bincline\b/i, name: "Incline Bench Press", areas: ["chest", "shoulders", "arms"] },
  { pattern: /\b(?:db|pb)\s*bench\b/i, name: "Dumbbell Bench Press", areas: ["chest", "shoulders", "arms"] },
  { pattern: /\bbench\b/i, name: "Bench Press", areas: ["chest", "shoulders", "arms"] },
  { pattern: /\bmil(?:itary)?\s*press\b/i, name: "Military Press", areas: ["shoulders", "arms", "core"] },
  { pattern: /\boverhead\s*press\b|\bohp\b|\bshoulder\s*press\b/i, name: "Shoulder Press", areas: ["shoulders", "arms", "core"] },
  { pattern: /\bpush\s*press\b/i, name: "Push Press", areas: ["shoulders", "arms", "core"] },
  { pattern: /\blandmine\b/i, name: "Landmine Press", areas: ["shoulders", "chest", "arms", "core"] },
  { pattern: /\bchest\s*supported\s*row\b/i, name: "Chest-Supported Row", areas: ["back", "arms"] },
  { pattern: /\b(?:single[\s-]*arm|one[\s-]*arm)\s*row\b/i, name: "Single-Arm Row", areas: ["back", "arms", "core"] },
  { pattern: /\bassisted\s*row\b/i, name: "Assisted Row", areas: ["back", "arms"] },
  { pattern: /\bcable\s*row\b|\bseated\s*row\b/i, name: "Seated Row", areas: ["back", "arms"] },
  { pattern: /\bbent\s*over\s*row\b|\bbb\s*row\b/i, name: "Bent-Over Row", areas: ["back", "arms", "core"] },
  { pattern: /\brow\b/i, name: "Row", areas: ["back", "arms"] },
  { pattern: /\bpull[\s-]*ups?\b|\bchin[\s-]*ups?\b/i, name: "Pull-Up", areas: ["back", "arms", "core"] },
  { pattern: /\bdead\s*hangs?\b|\bhang(?:ing)?\b(?!\s*leg)/i, name: "Dead Hang", areas: ["back", "arms", "core"] },
  { pattern: /\bstraight\s*arm\s*lat\s*(?:pd|pull)/i, name: "Straight-Arm Lat Pulldown", areas: ["back", "arms"] },
  { pattern: /\blat\s*(?:pull[\s-]*down|pull\s*down|pd)\b|\bpull\s*down\b|\bchin\s*machine\b/i, name: "Lat Pulldown", areas: ["back", "arms"] },
  { pattern: /\bface\s*pull\b|\brear\s*delt\s*fly\b|\breverse\s*pec\s*deck\b/i, name: "Face Pull", areas: ["back", "shoulders", "arms"] },
  { pattern: /\blat(?:eral)?\s*raise\b|\bfront\s*raise\b|\bcable\s*lateral\s*raise\b/i, name: "Lateral Raise", areas: ["shoulders", "arms"] },
  { pattern: /\bcurl\b/i, name: "Curl", areas: ["arms"] },
  { pattern: /\btriceps?\s*extension\b/i, name: "Triceps Extension", areas: ["arms"] },
  { pattern: /\btriceps?\b|\bpushdown\b/i, name: "Triceps Pushdown", areas: ["arms"] },
  { pattern: /\bdips?\b/i, name: "Dips", areas: ["chest", "shoulders", "arms"] },
  { pattern: /\bweighted\s*plank\b/i, name: "Weighted Plank", areas: ["core"] },
  { pattern: /\bplank\b/i, name: "Plank", areas: ["core"] },
  { pattern: /\bleg\s*raises?\b|\bhanging\s*leg\s*raises?\b|\bdragon\s*flag\b/i, name: "Leg Raise", areas: ["core"] },
  { pattern: /\bhandstand\b|\bhspu\b|\bhuman\s*flag\b/i, name: "Upper Skill Work", areas: ["shoulders", "arms", "core"] },
  { pattern: /\bbox\s*jump\b/i, name: "Box Jump", areas: ["legs", "core"] },
  { pattern: /\bbounds?\b/i, name: "Bounds", areas: ["legs", "core"] },
  { pattern: /\bhill\s*sprint\b|\bsprint\b/i, name: "Sprint", areas: ["legs", "core"] },
  { pattern: /\bmed(?:icine)?\s*ball\b|\bslam\b|\bthrow\b/i, name: "Med Ball Slam", areas: ["core", "shoulders", "arms"] }
];

const SURF_FIRST_BLOCK_KEY = "surf-first-cafe-season-v1";
const SURF_FIRST_CALENDAR_SOURCE = "pulseboard-surf-first-v1";
const SURF_FIRST_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
const CAFE_SEASON_START = "2026-04-27";
const PERSONAL_PLAN_LOOKBACK_DAYS = 112;
const PERSONAL_PLAN_MIN_HISTORY_WORKOUTS = 12;
const PERSONAL_HISTORY_BASELINE = {
  minimumLowerSessions: 2,
  minimumUpperSessions: 2,
  minimumQualityRuns: 1,
  supportsOptionalLongRun: true,
  preferredLowerSplit: ["quad-biased squat", "posterior-chain"],
  preferredUpperSplit: ["calisthenics pull + dips", "gym upper balance"],
  timeCapMinutes: 75,
  fallbackExercises: {
    lowerSquat: "Back Squat",
    lowerQuadPress: "Hack Squat",
    lowerPosteriorMain: "Romanian Deadlift",
    lowerPosteriorSupport: "Hip Thrust",
    lowerSingle: "Bulgarian Split Squat",
    lowerQuadAccessory: "Leg Extension",
    lowerHamAccessory: "Hamstring Curl",
    lowerCalves: "Calf Raise",
    upperPullMain: "Pull-Up",
    upperGymPull: "Lat Pulldown",
    upperRow: "Row",
    upperPressMain: "Bench Press",
    upperDip: "Dips",
    upperVerticalPress: "Shoulder Press",
    upperAccessory: "Lateral Raise",
    upperScap: "Face Pull",
    core: "Weighted Plank"
  }
};

const refs = {
  todayDate: document.querySelector("#today-date"),
  hostingNote: document.querySelector("#hosting-note"),
  screens: [...document.querySelectorAll(".screen")],
  tabButtons: [...document.querySelectorAll("[data-screen-target]")],
  goButtons: [...document.querySelectorAll("[data-go]")],
  toast: document.querySelector("#toast"),
  todayHeadline: document.querySelector("#today-headline"),
  readinessScore: document.querySelector("#readiness-score"),
  readinessLabel: document.querySelector("#readiness-label"),
  todaySummary: document.querySelector("#today-summary"),
  metricGrid: document.querySelector("#metric-grid"),
  guidanceList: document.querySelector("#guidance-list"),
  activeBlockCard: document.querySelector("#active-block-card"),
  recentWorkouts: document.querySelector("#recent-workouts"),
  todayAdvanceWeek: document.querySelector("#today-advance-week"),
  routineLogForm: document.querySelector("#routine-log-form"),
  routineLogEditNote: document.querySelector("#routine-log-edit-note"),
  routineLogTemplateNote: document.querySelector("#routine-log-template-note"),
  photoImportInput: document.querySelector("#photo-import-input"),
  photoImportClear: document.querySelector("#photo-import-clear"),
  photoImportStatus: document.querySelector("#photo-import-status"),
  photoImportResult: document.querySelector("#photo-import-result"),
  photoImportPreview: document.querySelector("#photo-import-preview"),
  photoImportSummary: document.querySelector("#photo-import-summary"),
  photoImportText: document.querySelector("#photo-import-text"),
  photoImportApply: document.querySelector("#photo-import-apply"),
  routineLogSelect: document.querySelector("#routine-log-select"),
  routineLogDate: document.querySelector("#routine-log-date"),
  routineLogDuration: document.querySelector("#routine-log-duration"),
  routineLogIntensity: document.querySelector("#routine-log-intensity"),
  routineLogNote: document.querySelector("#routine-log-note"),
  startGuidedWorkout: document.querySelector("#start-guided-workout"),
  addRoutineExercise: document.querySelector("#add-routine-exercise"),
  routineWorkoutTimer: document.querySelector("#routine-workout-timer"),
  routineWorkoutTimerNote: document.querySelector("#routine-workout-timer-note"),
  toggleRoutineWorkoutTimer: document.querySelector("#toggle-routine-workout-timer"),
  resetRoutineWorkoutTimer: document.querySelector("#reset-routine-workout-timer"),
  routineRestTimer: document.querySelector("#routine-rest-timer"),
  routineRestTotal: document.querySelector("#routine-rest-total"),
  routineRestPresets: [...document.querySelectorAll("[data-rest-preset]")],
  startRoutineRestTimer: document.querySelector("#start-routine-rest-timer"),
  addRoutineRestTime: document.querySelector("#add-routine-rest-time"),
  stopRoutineRestTimer: document.querySelector("#stop-routine-rest-timer"),
  routineExerciseFields: document.querySelector("#routine-exercise-fields"),
  routineLogNotes: document.querySelector("#routine-log-notes"),
  routineLogSubmit: document.querySelector("#routine-log-submit"),
  cancelRoutineWorkoutEdit: document.querySelector("#cancel-routine-workout-edit"),
  quickLogForm: document.querySelector("#quick-log-form"),
  quickLogEditNote: document.querySelector("#quick-log-edit-note"),
  quickKind: document.querySelector("#quick-kind"),
  quickDate: document.querySelector("#quick-date"),
  quickDuration: document.querySelector("#quick-duration"),
  quickIntensity: document.querySelector("#quick-intensity"),
  quickTitle: document.querySelector("#quick-title"),
  quickMetric: document.querySelector("#quick-metric"),
  quickNotes: document.querySelector("#quick-notes"),
  quickLogSubmit: document.querySelector("#quick-log-submit"),
  cancelQuickWorkoutEdit: document.querySelector("#cancel-quick-workout-edit"),
  quickAreas: document.querySelector("#quick-areas"),
  routineAreas: document.querySelector("#routine-areas"),
  bodyAreas: document.querySelector("#body-areas"),
  logModeButtons: [...document.querySelectorAll("[data-log-mode]")],
  toggleRoutineBuilder: document.querySelector("#toggle-routine-builder"),
  toggleBlockBuilder: document.querySelector("#toggle-block-builder"),
  surfPlanSummary: document.querySelector("#surf-plan-summary"),
  installSurfPlan: document.querySelector("#install-surf-plan"),
  surfPlanStatus: document.querySelector("#surf-plan-status"),
  googleCalendarClientId: document.querySelector("#google-calendar-client-id"),
  googleCalendarName: document.querySelector("#google-calendar-name"),
  googleCalendarStartDate: document.querySelector("#google-calendar-start-date"),
  googleCalendarWeeks: document.querySelector("#google-calendar-weeks"),
  googleCalendarCafeShifts: document.querySelector("#google-calendar-cafe-shifts"),
  googleCalendarAuthorize: document.querySelector("#google-calendar-authorize"),
  googleCalendarSync: document.querySelector("#google-calendar-sync"),
  googleCalendarClear: document.querySelector("#google-calendar-clear"),
  googleCalendarStatus: document.querySelector("#google-calendar-status"),
  routineBuilder: document.querySelector("#routine-builder"),
  blockBuilder: document.querySelector("#block-builder"),
  routineBuilderForm: document.querySelector("#routine-builder"),
  blockBuilderForm: document.querySelector("#block-builder"),
  builderRoutineName: document.querySelector("#builder-routine-name"),
  builderRoutineKind: document.querySelector("#builder-routine-kind"),
  builderSessionKind: document.querySelector("#builder-session-kind"),
  builderRoutineMinutes: document.querySelector("#builder-routine-minutes"),
  builderRoutineNotes: document.querySelector("#builder-routine-notes"),
  routineBuilderEyebrow: document.querySelector("#routine-builder-eyebrow"),
  routineBuilderHeading: document.querySelector("#routine-builder-heading"),
  routineBuilderModeNote: document.querySelector("#routine-builder-mode-note"),
  routineBuilderSubmit: document.querySelector("#routine-builder-submit"),
  cancelRoutineEdit: document.querySelector("#cancel-routine-edit"),
  routineExerciseBuilder: document.querySelector("#routine-exercise-builder"),
  addBuilderExercise: document.querySelector("#add-builder-exercise"),
  builderBlockName: document.querySelector("#builder-block-name"),
  builderBlockLooping: document.querySelector("#builder-block-looping"),
  builderBlockFocus: document.querySelector("#builder-block-focus"),
  blockBuilderEyebrow: document.querySelector("#block-builder-eyebrow"),
  blockBuilderHeading: document.querySelector("#block-builder-heading"),
  blockBuilderModeNote: document.querySelector("#block-builder-mode-note"),
  blockBuilderSubmit: document.querySelector("#block-builder-submit"),
  cancelBlockEdit: document.querySelector("#cancel-block-edit"),
  blockWeeksBuilder: document.querySelector("#block-weeks-builder"),
  addBlockWeek: document.querySelector("#add-block-week"),
  blockList: document.querySelector("#block-list"),
  routineList: document.querySelector("#routine-list"),
  progressMetrics: document.querySelector("#progress-metrics"),
  progressBreakdown: document.querySelector("#progress-breakdown"),
  exerciseTrends: document.querySelector("#exercise-trends"),
  logSchedulePanel: document.querySelector("#log-schedule-panel"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  bodyForm: document.querySelector("#body-form"),
  bodyDate: document.querySelector("#body-date"),
  bodySleep: document.querySelector("#body-sleep"),
  bodyEnergy: document.querySelector("#body-energy"),
  bodySoreness: document.querySelector("#body-soreness"),
  bodyStress: document.querySelector("#body-stress"),
  bodyNotes: document.querySelector("#body-notes"),
  bodyHistory: document.querySelector("#body-history"),
  coachChatGoal: document.querySelector("#coach-chat-goal"),
  coachChatSummary: document.querySelector("#coach-chat-summary"),
  coachChatPrompts: document.querySelector("#coach-chat-prompts"),
  coachChatThread: document.querySelector("#coach-chat-thread"),
  coachChatInput: document.querySelector("#coach-chat-input"),
  coachChatSend: document.querySelector("#coach-chat-send"),
  coachChatClear: document.querySelector("#coach-chat-clear"),
  guidedWorkoutPanel: document.querySelector("#guided-workout-panel"),
  guidedOverviewPanel: document.querySelector("#guided-overview-panel"),
  guidedOverviewTitle: document.querySelector("#guided-overview-title"),
  guidedOverviewKind: document.querySelector("#guided-overview-kind"),
  guidedOverviewEquipment: document.querySelector("#guided-overview-equipment"),
  guidedOverviewSource: document.querySelector("#guided-overview-source"),
  guidedOverviewList: document.querySelector("#guided-overview-list"),
  guidedDismissOverview: document.querySelector("#guided-dismiss-overview"),
  guidedWorkoutClose: document.querySelector("#guided-workout-close"),
  guidedWorkoutPause: document.querySelector("#guided-workout-pause"),
  guidedWorkoutTitle: document.querySelector("#guided-workout-title"),
  guidedWorkoutKicker: document.querySelector("#guided-workout-kicker"),
  guidedExerciseProgress: document.querySelector("#guided-exercise-progress"),
  guidedSessionTimer: document.querySelector("#guided-session-timer"),
  guidedSessionEffort: document.querySelector("#guided-session-effort"),
  guidedExerciseTimer: document.querySelector("#guided-exercise-timer"),
  guidedStageMeterRing: document.querySelector("#guided-stage-meter-ring"),
  guidedStageMeterLabel: document.querySelector("#guided-stage-meter-label"),
  guidedExerciseName: document.querySelector("#guided-exercise-name"),
  guidedExerciseTarget: document.querySelector("#guided-exercise-target"),
  guidedExerciseKind: document.querySelector("#guided-exercise-kind"),
  guidedExerciseStatus: document.querySelector("#guided-exercise-status"),
  guidedHeroReps: document.querySelector("#guided-hero-reps"),
  guidedHeroSecondaryLabel: document.querySelector("#guided-hero-secondary-label"),
  guidedHeroSecondaryValue: document.querySelector("#guided-hero-secondary-value"),
  guidedExerciseEquipment: document.querySelector("#guided-exercise-equipment"),
  guidedSkipBreak: document.querySelector("#guided-skip-break"),
  guidedTrackingSheet: document.querySelector("#guided-tracking-sheet"),
  guidedOpenTracking: document.querySelector("#guided-open-tracking"),
  guidedExerciseTemplateNote: document.querySelector("#guided-exercise-template-note"),
  guidedWorkoutFields: document.querySelector("#guided-workout-fields"),
  guidedHistoryPanel: document.querySelector("#guided-history-panel"),
  guidedNoteInput: document.querySelector("#guided-note-input"),
  guidedSetList: document.querySelector("#guided-set-list"),
  guidedChatPanel: document.querySelector("#guided-chat-panel"),
  guidedChatContext: document.querySelector("#guided-chat-context"),
  guidedChatSuggestions: document.querySelector("#guided-chat-suggestions"),
  guidedChatThread: document.querySelector("#guided-chat-thread"),
  guidedChatInput: document.querySelector("#guided-chat-input"),
  guidedChatSend: document.querySelector("#guided-chat-send"),
  guidedAddSet: document.querySelector("#guided-add-set"),
  guidedAddExercise: document.querySelector("#guided-add-exercise"),
  guidedSkipPhase: document.querySelector("#guided-skip-phase"),
  guidedPrevExercise: document.querySelector("#guided-prev-exercise"),
  guidedNextExercise: document.querySelector("#guided-next-exercise"),
  guidedSaveWorkout: document.querySelector("#guided-save-workout"),
  guidedPanelButtons: [...document.querySelectorAll("[data-guided-panel]")],
  workoutSummaryPanel: document.querySelector("#workout-summary-panel"),
  workoutSummaryTitle: document.querySelector("#workout-summary-title"),
  workoutSummarySubtitle: document.querySelector("#workout-summary-subtitle"),
  workoutSummaryCompletion: document.querySelector("#workout-summary-completion"),
  workoutSummaryProgress: document.querySelector("#workout-summary-progress"),
  workoutSummaryPrs: document.querySelector("#workout-summary-prs"),
  workoutSummaryList: document.querySelector("#workout-summary-list"),
  workoutSummaryClose: document.querySelector("#workout-summary-close"),
  exerciseProgressPanel: document.querySelector("#exercise-progress-panel"),
  exerciseProgressBack: document.querySelector("#exercise-progress-back"),
  exerciseProgressClose: document.querySelector("#exercise-progress-close"),
  exerciseProgressTitle: document.querySelector("#exercise-progress-title"),
  exerciseProgressFilters: document.querySelector("#exercise-progress-filters"),
  exerciseProgressHeroValue: document.querySelector("#exercise-progress-hero-value"),
  exerciseProgressHeroLabel: document.querySelector("#exercise-progress-hero-label"),
  exerciseProgressHeroChange: document.querySelector("#exercise-progress-hero-change"),
  exerciseProgressHeroSubtitle: document.querySelector("#exercise-progress-hero-subtitle"),
  exerciseProgressChart: document.querySelector("#exercise-progress-chart"),
  exerciseProgressMetrics: document.querySelector("#exercise-progress-metrics"),
  exerciseProgressHistoryList: document.querySelector("#exercise-progress-history-list")
};

const ui = {
  screen: "today",
  logMode: "routine",
  quickAreas: new Set(),
  routineAreas: new Set(),
  bodyAreas: new Set(),
  editingWorkoutId: null,
  editingRoutineId: null,
  editingBlockId: null,
  activeRoutineLogTemplate: null,
  photoImport: createPhotoImportState(),
  surfPlanStatus: createInlineStatusState(),
  calendarSync: createCalendarSyncState(),
  routineTimer: createRoutineTimerState(),
  guidedWorkout: createGuidedWorkoutState(),
  workoutSummary: createWorkoutSummaryState(),
  exerciseProgress: createExerciseProgressState()
};

let state = loadState();
let toastTimer;
let routineTimerInterval;

bootstrap();

function bootstrap() {
  const today = todayISO();

  refs.todayDate.textContent = formatDate(today, { weekday: "short", day: "numeric", month: "short" });
  refs.hostingNote.classList.toggle("hidden", location.protocol !== "file:");

  refs.quickDate.value = today;
  refs.routineLogDate.value = today;
  refs.bodyDate.value = today;

  populateSelect(refs.quickKind, sessionKinds);
  populateSelect(refs.builderSessionKind, sessionKinds);
  populateRoutineKindSelect();

  wireEvents();

  ensureBuilderRows();
  ensureAtLeastOneWeek();
  syncBodyFormFromLatest();
  refreshRoutineLogOptions();
  resetQuickLogForm();
  resetRoutineLogForm();
  resetRoutineBuilderForm();
  resetBlockBuilderForm();
  setQuickAreasFromKind(refs.quickKind.value);
  renderChipGroup(refs.quickAreas, ui.quickAreas, "quick");
  renderChipGroup(refs.routineAreas, ui.routineAreas, "routine");
  renderChipGroup(refs.bodyAreas, ui.bodyAreas, "body");
  if (state.blocks.some((block) => block.systemKey === SURF_FIRST_BLOCK_KEY) || state.planner?.surfFirstBlockId) {
    installSurfFirstBasePlan({ silent: true });
  }
  renderDataViews();
  renderLogMode();
  updateWorkoutEditUI();
  renderPhotoImportUI();
  renderPlannerPanels();
  renderWorkoutSummary();
  renderExerciseProgress();
  registerServiceWorker();
}

function wireEvents() {
  refs.tabButtons.forEach((button) => {
    button.addEventListener("click", () => openScreen(button.dataset.screenTarget));
  });

  refs.goButtons.forEach((button) => {
    button.addEventListener("click", () => openScreen(button.dataset.go));
  });

  refs.todayAdvanceWeek.addEventListener("click", () => {
    advanceActiveBlockWeek();
  });

  refs.activeBlockCard.addEventListener("click", (event) => {
    const logButton = event.target.closest("[data-log-planned-session]");
    if (logButton) {
      startPlannedSessionLog(logButton.dataset.logPlannedSession);
      return;
    }

    if (event.target.closest("[data-today-advance]")) {
      advanceActiveBlockWeek();
    }
  });

  refs.logModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (ui.editingWorkoutId && button.dataset.logMode !== ui.logMode) {
        cancelWorkoutEdit();
      }
      ui.logMode = button.dataset.logMode;
      renderLogMode();
      if (
        ui.logMode === "quick"
        && !ui.editingWorkoutId
        && !ui.routineTimer.workoutRunning
        && !ui.routineTimer.hasMeasuredWorkoutTime
      ) {
        startRoutineWorkoutTimer();
      }
    });
  });

  refs.quickKind.addEventListener("change", () => {
    setQuickAreasFromKind(refs.quickKind.value);
    renderChipGroup(refs.quickAreas, ui.quickAreas, "quick");
  });

  refs.routineLogSelect.addEventListener("change", () => {
    if (ui.guidedWorkout.active) {
      clearGuidedWorkout();
    }
    if (ui.activeRoutineLogTemplate?.sourceType === "routine") {
      clearRoutineLogTemplate();
    }
    syncRoutineLogForm({ fromSelection: true });
  });

  refs.quickAreas.addEventListener("click", (event) => {
    handleChipClick(event, ui.quickAreas, refs.quickAreas, "quick");
  });

  refs.routineAreas.addEventListener("click", (event) => {
    handleChipClick(event, ui.routineAreas, refs.routineAreas, "routine");
  });

  refs.logSchedulePanel.addEventListener("click", (event) => {
    const logButton = event.target.closest("[data-log-planned-session]");
    if (logButton) {
      startPlannedSessionLog(logButton.dataset.logPlannedSession);
    }
  });

  refs.bodyAreas.addEventListener("click", (event) => {
    handleChipClick(event, ui.bodyAreas, refs.bodyAreas, "body");
  });

  refs.routineExerciseFields.addEventListener("click", (event) => {
    const addSetButton = event.target.closest("[data-add-set]");
    const addFollowupButton = event.target.closest("[data-add-followup-set]");
    const removeSetButton = event.target.closest("[data-remove-set]");
    const togglePanelButton = event.target.closest("[data-toggle-exercise-panel]");

    if (togglePanelButton) {
      const card = togglePanelButton.closest("[data-exercise-name]");
      if (card) {
        toggleExercisePanel(card, togglePanelButton.dataset.toggleExercisePanel);
      }
      return;
    }

    if (addSetButton) {
      const card = addSetButton.closest("[data-exercise-name]");
      const setList = card?.querySelector("[data-set-list]");
      if (card && setList) {
        appendExerciseSetRow(setList, {
          targetReps: card.dataset.targetReps || "",
          defaultWeight: currentExerciseCardSetWeight(card),
          defaultSetSeconds: currentExerciseCardSetSeconds(card),
          defaultRestSeconds: currentExerciseCardRestSeconds(card),
          defaultEffortPercent: currentExerciseCardEffortPercent(card)
        });
      }
      return;
    }

    if (addFollowupButton) {
      const row = addFollowupButton.closest("[data-set-row]");
      const card = addFollowupButton.closest("[data-exercise-name]");
      appendExerciseFollowupRow(row, {
        defaultWeight: currentExerciseCardSetWeight(card),
        defaultSetSeconds: currentExerciseCardSetSeconds(card),
        defaultRestSeconds: currentExerciseCardRestSeconds(card),
        defaultEffortPercent: currentExerciseCardEffortPercent(card)
      });
      return;
    }

    if (removeSetButton) {
      const row = removeSetButton.closest("[data-set-row]");
      const setList = row?.closest("[data-set-list]");
      removeExerciseSetRow(row);
      if (setList) {
        if (!setList.children.length) {
          const card = setList.closest("[data-exercise-name]");
          appendExerciseSetRow(setList, {
            targetReps: card?.dataset.targetReps || "",
            defaultWeight: currentExerciseCardSetWeight(card),
            defaultSetSeconds: currentExerciseCardSetSeconds(card),
            defaultRestSeconds: currentExerciseCardRestSeconds(card),
            defaultEffortPercent: currentExerciseCardEffortPercent(card)
          });
        }
        renumberExerciseSetRows(setList);
      }
    }
  });
  refs.routineExerciseFields.addEventListener("change", handleRoutineExerciseFieldChange);

  refs.quickLogForm.addEventListener("submit", handleQuickLogSubmit);
  refs.routineLogForm.addEventListener("submit", handleRoutineLogSubmit);
  refs.bodyForm.addEventListener("submit", handleBodySubmit);
  refs.photoImportInput.addEventListener("change", handlePhotoImportSelection);
  refs.photoImportClear.addEventListener("click", clearPhotoImport);
  refs.photoImportText.addEventListener("input", handlePhotoImportTextInput);
  refs.photoImportApply.addEventListener("click", applyPhotoImportDraft);
  refs.startGuidedWorkout.addEventListener("click", openGuidedWorkout);
  refs.addRoutineExercise.addEventListener("click", () => addExerciseToCurrentSession());
  refs.cancelQuickWorkoutEdit.addEventListener("click", cancelWorkoutEdit);
  refs.cancelRoutineWorkoutEdit.addEventListener("click", cancelWorkoutEdit);
  refs.toggleRoutineWorkoutTimer.addEventListener("click", toggleRoutineWorkoutTimer);
  refs.resetRoutineWorkoutTimer.addEventListener("click", () => {
    resetRoutineTimerState();
    refs.routineLogDuration.value = 60;
  });
  refs.startRoutineRestTimer.addEventListener("click", startRoutineRestTimer);
  refs.addRoutineRestTime.addEventListener("click", () => addRoutineRestTime(30));
  refs.stopRoutineRestTimer.addEventListener("click", () => resetRoutineRestTimer({ recordElapsed: true }));
  refs.routineRestPresets.forEach((button) => {
    button.addEventListener("click", () => {
      selectRoutineRestPreset(Number(button.dataset.restPreset));
    });
  });

  refs.toggleRoutineBuilder.addEventListener("click", () => {
    if (refs.routineBuilder.classList.contains("hidden") || ui.editingRoutineId) {
      startRoutineCreate();
    } else {
      refs.routineBuilder.classList.add("hidden");
    }
  });

  refs.toggleBlockBuilder.addEventListener("click", () => {
    if (refs.blockBuilder.classList.contains("hidden") || ui.editingBlockId) {
      startBlockCreate();
    } else {
      refs.blockBuilder.classList.add("hidden");
    }
  });

  refs.cancelRoutineEdit.addEventListener("click", () => {
    resetRoutineBuilderForm();
    refs.routineBuilder.classList.add("hidden");
  });

  refs.cancelBlockEdit.addEventListener("click", () => {
    resetBlockBuilderForm();
    refs.blockBuilder.classList.add("hidden");
  });

  refs.addBuilderExercise.addEventListener("click", () => {
    appendRoutineBuilderExerciseRow();
  });

  refs.addBlockWeek.addEventListener("click", () => {
    appendBlockWeek();
  });

  refs.routineExerciseBuilder.addEventListener("click", (event) => {
    if (event.target.matches("[data-toggle-builder-panel]")) {
      toggleBuilderPanel(event.target.closest("[data-builder-exercise-row]"), event.target.dataset.toggleBuilderPanel);
      return;
    }

    if (event.target.matches("[data-add-builder-after-set]")) {
      const row = event.target.closest("[data-builder-exercise-row]");
      appendBuilderSetTemplateRow(row?.querySelector("[data-builder-after-set-list]"), "after-each");
      setBuilderPanelOpen(row, "supersets", true);
      return;
    }

    if (event.target.matches("[data-add-builder-extra-set]")) {
      const row = event.target.closest("[data-builder-exercise-row]");
      appendBuilderSetTemplateRow(row?.querySelector("[data-builder-extra-set-list]"), "extra");
      setBuilderPanelOpen(row, "supersets", true);
      return;
    }

    if (event.target.matches("[data-remove-builder-set-template]")) {
      const templateRow = event.target.closest("[data-builder-set-template-row]");
      const list = templateRow?.parentElement;
      const kind = templateRow?.dataset.builderSetKind || "after-each";
      templateRow?.remove();
      syncBuilderSetTemplateList(list, kind);
      return;
    }

    if (event.target.matches("[data-remove-builder-exercise]")) {
      event.target.closest(".builder-row")?.remove();
      ensureBuilderRows();
    }
  });

  refs.routineExerciseBuilder.addEventListener("input", (event) => {
    if (!event.target.matches("[data-builder-exercise-reps]")) {
      return;
    }

    syncBuilderExerciseSetTime(event.target.closest("[data-builder-exercise-row]"));
  });

  refs.routineExerciseBuilder.addEventListener("change", (event) => {
    if (!event.target.matches("[data-builder-exercise-log-reps]")) {
      return;
    }

    syncBuilderExerciseSetTime(event.target.closest("[data-builder-exercise-row]"));
  });

  refs.blockWeeksBuilder.addEventListener("click", (event) => {
    if (event.target.matches("[data-toggle-builder-panel]")) {
      toggleBuilderPanel(event.target.closest("[data-builder-exercise-row]"), event.target.dataset.toggleBuilderPanel);
      return;
    }

    if (event.target.matches("[data-add-builder-after-set]")) {
      const row = event.target.closest("[data-builder-exercise-row]");
      const exerciseList = row?.closest("[data-session-exercise-list]");
      appendBuilderSetTemplateRow(row?.querySelector("[data-builder-after-set-list]"), "after-each");
      setBuilderPanelOpen(row, "supersets", true);
      if (exerciseList) {
        exerciseList.dataset.exerciseSourceRoutine = "";
      }
      return;
    }

    if (event.target.matches("[data-add-builder-extra-set]")) {
      const row = event.target.closest("[data-builder-exercise-row]");
      const exerciseList = row?.closest("[data-session-exercise-list]");
      appendBuilderSetTemplateRow(row?.querySelector("[data-builder-extra-set-list]"), "extra");
      setBuilderPanelOpen(row, "supersets", true);
      if (exerciseList) {
        exerciseList.dataset.exerciseSourceRoutine = "";
      }
      return;
    }

    if (event.target.matches("[data-remove-builder-set-template]")) {
      const templateRow = event.target.closest("[data-builder-set-template-row]");
      const list = templateRow?.parentElement;
      const kind = templateRow?.dataset.builderSetKind || "after-each";
      const exerciseList = templateRow?.closest("[data-session-exercise-list]");
      templateRow?.remove();
      syncBuilderSetTemplateList(list, kind);
      if (exerciseList) {
        exerciseList.dataset.exerciseSourceRoutine = "";
      }
      return;
    }

    if (event.target.matches("[data-remove-week]")) {
      event.target.closest(".week-builder")?.remove();
      ensureAtLeastOneWeek();
    }

    if (event.target.matches("[data-add-session]")) {
      appendPlannedSessionRow(event.target.closest(".week-builder")?.querySelector(".session-list"));
    }

    if (event.target.matches("[data-remove-session]")) {
      event.target.closest(".session-builder")?.remove();
      const sessionList = event.target.closest(".session-list");
      if (sessionList && !sessionList.children.length) {
        appendPlannedSessionRow(sessionList);
      }
    }

    if (event.target.matches("[data-add-session-exercise]")) {
      const sessionRow = event.target.closest(".session-builder");
      const exerciseList = sessionRow?.querySelector("[data-session-exercise-list]");
      appendSessionExerciseRow(exerciseList);
      syncSessionExerciseListUI(exerciseList);
    }

    if (event.target.matches("[data-remove-builder-exercise]")) {
      const row = event.target.closest("[data-builder-exercise-row]");
      const exerciseList = row?.closest("[data-session-exercise-list]");
      if (exerciseList) {
        exerciseList.dataset.exerciseSourceRoutine = "";
      }
      row?.remove();
      syncSessionExerciseListUI(exerciseList);
    }
  });

  refs.blockWeeksBuilder.addEventListener("change", (event) => {
    if (!event.target.matches("[data-planned-routine]")) {
      return;
    }

    const row = event.target.closest(".session-builder");
    const routine = state.routines.find((item) => item.id === event.target.value);
    if (!row) {
      return;
    }

    if (!routine) {
      return;
    }

    row.querySelector("[data-planned-title]").value = routine.name;
    row.querySelector("[data-planned-kind]").value = routine.sessionKind;
    const detailsField = row.querySelector("[data-planned-details]");
    if (detailsField && !detailsField.value.trim() && routine.notes) {
      detailsField.value = routine.notes;
    }
    prefillSessionBuilderFromRoutine(row, routine);
  });

  refs.blockWeeksBuilder.addEventListener("input", (event) => {
    if (!event.target.matches("[data-builder-exercise-name], [data-builder-exercise-sets], [data-builder-exercise-reps], [data-builder-exercise-notes], [data-builder-set-template-label], [data-builder-set-template-reps], [data-builder-set-template-weight-value]")) {
      return;
    }

    if (event.target.matches("[data-builder-exercise-reps]")) {
      syncBuilderExerciseSetTime(event.target.closest("[data-builder-exercise-row]"));
    }

    const exerciseList = event.target.closest("[data-session-exercise-list]");
    if (exerciseList) {
      exerciseList.dataset.exerciseSourceRoutine = "";
    }
  });

  refs.blockWeeksBuilder.addEventListener("change", (event) => {
    if (!event.target.matches("[data-builder-exercise-log-reps], [data-builder-exercise-effort], [data-builder-exercise-weight], [data-builder-exercise-set-time], [data-builder-exercise-rest], [data-builder-set-template-weight-mode]")) {
      return;
    }

    if (event.target.matches("[data-builder-exercise-log-reps]")) {
      syncBuilderExerciseSetTime(event.target.closest("[data-builder-exercise-row]"));
    }

    const exerciseList = event.target.closest("[data-session-exercise-list]");
    if (exerciseList) {
      exerciseList.dataset.exerciseSourceRoutine = "";
    }
  });

  refs.routineBuilderForm.addEventListener("submit", handleRoutineBuilderSubmit);
  refs.blockBuilderForm.addEventListener("submit", handleBlockBuilderSubmit);

  refs.blockList.addEventListener("click", (event) => {
    const logButton = event.target.closest("[data-log-planned-session]");
    const setButton = event.target.closest("[data-set-active-block]");
    const advanceButton = event.target.closest("[data-advance-block]");
    const editButton = event.target.closest("[data-edit-block]");
    const deleteButton = event.target.closest("[data-delete-block]");
    if (logButton) {
      startPlannedSessionLog(logButton.dataset.logPlannedSession);
      return;
    }
    if (setButton) {
      state.activeBlockId = setButton.dataset.setActiveBlock;
      persistState();
      renderDataViews();
      showToast("Active block updated");
      return;
    }
    if (advanceButton) {
      advanceBlockWeek(advanceButton.dataset.advanceBlock);
      return;
    }
    if (editButton) {
      startBlockEdit(editButton.dataset.editBlock);
      return;
    }
    if (deleteButton) {
      deleteBlock(deleteButton.dataset.deleteBlock);
    }
  });

  refs.recentWorkouts.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-workout]");
    const deleteButton = event.target.closest("[data-delete-workout]");
    if (editButton) {
      startWorkoutEdit(editButton.dataset.editWorkout);
      return;
    }
    if (deleteButton) {
      deleteWorkout(deleteButton.dataset.deleteWorkout);
    }
  });

  refs.bodyHistory.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-body-check-in]");
    if (deleteButton) {
      deleteBodyCheckIn(deleteButton.dataset.deleteBodyCheckIn);
    }
  });

  refs.coachChatGoal.addEventListener("input", () => {
    coachChatState().goal = refs.coachChatGoal.value;
    persistState();
    renderCoachChatSummary();
    renderCoachChatPrompts();
  });
  refs.coachChatSend.addEventListener("click", () => submitCoachChatMessage());
  refs.coachChatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submitCoachChatMessage();
    }
  });
  refs.coachChatPrompts.addEventListener("click", (event) => {
    const button = event.target.closest("[data-coach-chat-prompt]");
    if (!button) {
      return;
    }

    submitCoachChatMessage(button.dataset.coachChatPrompt || "");
  });
  refs.coachChatClear.addEventListener("click", clearCoachChatConversation);

  refs.routineList.addEventListener("click", (event) => {
    const logButton = event.target.closest("[data-log-routine]");
    const editButton = event.target.closest("[data-edit-routine]");
    const deleteButton = event.target.closest("[data-delete-routine]");
    if (logButton) {
      startRoutineLog(logButton.dataset.logRoutine);
      return;
    }
    if (editButton) {
      startRoutineEdit(editButton.dataset.editRoutine);
      return;
    }
    if (deleteButton) {
      deleteRoutine(deleteButton.dataset.deleteRoutine);
    }
  });

  refs.exportData.addEventListener("click", exportBackup);
  refs.importData.addEventListener("change", importBackup);
  refs.installSurfPlan.addEventListener("click", () => {
    installSurfFirstBasePlan();
  });
  refs.googleCalendarAuthorize.addEventListener("click", handleGoogleCalendarAuthorize);
  refs.googleCalendarSync.addEventListener("click", handleGoogleCalendarSync);
  refs.googleCalendarClear.addEventListener("click", clearGoogleCalendarLink);
  refs.googleCalendarClientId.addEventListener("change", persistPlannerSettingsFromInputs);
  refs.googleCalendarName.addEventListener("change", persistPlannerSettingsFromInputs);
  refs.googleCalendarStartDate.addEventListener("change", persistPlannerSettingsFromInputs);
  refs.googleCalendarWeeks.addEventListener("change", persistPlannerSettingsFromInputs);
  refs.googleCalendarCafeShifts.addEventListener("change", persistPlannerSettingsFromInputs);

  refs.guidedWorkoutClose.addEventListener("click", closeGuidedWorkout);
  refs.guidedWorkoutPause.addEventListener("click", toggleGuidedWorkoutPause);
  refs.guidedPrevExercise.addEventListener("click", () => goToGuidedExercise(ui.guidedWorkout.exerciseIndex - 1));
  refs.guidedNextExercise.addEventListener("click", advanceGuidedWorkout);
  refs.guidedSaveWorkout.addEventListener("click", saveGuidedWorkout);
  refs.guidedAddSet.addEventListener("click", appendGuidedSetRow);
  refs.guidedAddExercise.addEventListener("click", () => addExerciseToCurrentSession({ jumpToGuidedExercise: true }));
  refs.guidedDismissOverview.addEventListener("click", dismissGuidedOverview);
  refs.guidedSkipBreak.addEventListener("click", skipGuidedBreakEarly);
  refs.guidedSkipPhase.addEventListener("click", skipGuidedCurrentPhase);
  refs.guidedOpenTracking.addEventListener("click", scrollGuidedTrackingIntoView);
  refs.guidedChatSend.addEventListener("click", () => submitGuidedWorkoutChat());
  refs.guidedChatInput.addEventListener("input", () => {
    ui.guidedWorkout.chatInputValue = refs.guidedChatInput.value;
  });
  refs.guidedChatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submitGuidedWorkoutChat();
    }
  });
  refs.guidedChatSuggestions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-guided-chat-prompt]");
    if (!button) {
      return;
    }

    submitGuidedWorkoutChat(button.dataset.guidedChatPrompt || "");
  });
  refs.guidedWorkoutPanel.addEventListener("click", handleGuidedWorkoutClick);
  refs.guidedWorkoutPanel.addEventListener("change", handleGuidedWorkoutChange);
  refs.guidedWorkoutPanel.addEventListener("input", handleGuidedWorkoutInput);
  refs.workoutSummaryClose.addEventListener("click", closeWorkoutSummary);
  refs.workoutSummaryList.addEventListener("click", handleWorkoutSummaryClick);
  refs.exerciseProgressBack.addEventListener("click", closeExerciseProgress);
  refs.exerciseProgressClose.addEventListener("click", closeExerciseProgressAndSummary);
  refs.exerciseProgressFilters.addEventListener("click", handleExerciseProgressFilterClick);
}

function populateSelect(select, source) {
  select.innerHTML = Object.entries(source)
    .map(([value, meta]) => `<option value="${value}">${meta.label}</option>`)
    .join("");
}

function populateRoutineKindSelect() {
  refs.builderRoutineKind.innerHTML = Object.entries(routineKinds)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
}

function createRoutineTimerState() {
  return {
    workoutElapsedSeconds: 0,
    workoutRunning: false,
    workoutStartedAt: null,
    restPresetSeconds: 120,
    restDurationSeconds: 120,
    restRemainingSeconds: 120,
    restRunning: false,
    restStartedAt: null,
    restAccumulatedElapsedSeconds: 0,
    restTargetReachedNotified: false,
    totalRestSeconds: 0,
    hasMeasuredWorkoutTime: false
  };
}

function createPhotoImportState() {
  return {
    imageUrl: "",
    processing: false,
    status: "",
    statusTone: "",
    recognizedText: "",
    draft: null
  };
}

function createInlineStatusState() {
  return {
    message: "",
    tone: ""
  };
}

function createCalendarSyncState() {
  return {
    tokenClient: null,
    accessToken: "",
    expiresAt: 0,
    processing: false,
    status: "",
    tone: ""
  };
}

function createGuidedWorkoutState() {
  return {
    active: false,
    visible: false,
    introVisible: false,
    introDismissAt: null,
    paused: false,
    exerciseIndex: 0,
    renderedExerciseIndex: -1,
    enteredExerciseAt: null,
    frozenExerciseElapsedSeconds: null,
    templateTitle: "",
    templateSourceLabel: "",
    templateKind: "strength",
    exerciseDrafts: [],
    chatMessages: [],
    chatInputValue: ""
  };
}

function createWorkoutSummaryState() {
  return {
    visible: false,
    data: null
  };
}

function createExerciseProgressState() {
  return {
    visible: false,
    exerciseName: "",
    equipmentFilter: "all"
  };
}

function createCoachChatState() {
  return {
    goal: "",
    messages: []
  };
}

function currentWorkoutElapsedSeconds() {
  if (!ui.routineTimer.workoutRunning || !ui.routineTimer.workoutStartedAt) {
    return ui.routineTimer.workoutElapsedSeconds;
  }

  return Math.max(0, Math.floor((Date.now() - ui.routineTimer.workoutStartedAt) / 1000));
}

function currentRestRemainingSeconds() {
  if (!ui.routineTimer.restRunning || !ui.routineTimer.restStartedAt) {
    return ui.routineTimer.restRemainingSeconds;
  }

  return Math.max(0, ui.routineTimer.restDurationSeconds - currentRestElapsedSeconds());
}

function currentRestElapsedSeconds() {
  if (!ui.routineTimer.restRunning || !ui.routineTimer.restStartedAt) {
    return ui.routineTimer.restAccumulatedElapsedSeconds;
  }

  return ui.routineTimer.restAccumulatedElapsedSeconds
    + Math.max(0, Math.floor((Date.now() - ui.routineTimer.restStartedAt) / 1000));
}

function formatTimerClock(totalSeconds, { showHours = true } = {}) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (showHours || hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatDurationCompact(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const parts = [];

  if (hours) {
    parts.push(`${hours}h`);
  }
  if (minutes || hours) {
    parts.push(`${minutes}m`);
  }
  if (!hours && !minutes) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
}

function syncRoutineDurationFromTimer() {
  const elapsedSeconds = currentWorkoutElapsedSeconds();
  if (!elapsedSeconds && !ui.routineTimer.hasMeasuredWorkoutTime) {
    return;
  }

  refs.routineLogDuration.value = Math.max(1, Math.round(elapsedSeconds / 60));
}

function stopRoutineTimerIntervalIfIdle() {
  if (ui.routineTimer.workoutRunning || ui.routineTimer.restRunning || !routineTimerInterval) {
    return;
  }

  window.clearInterval(routineTimerInterval);
  routineTimerInterval = null;
}

function completeRoutineRestTimer({ notify = true } = {}) {
  ui.routineTimer.totalRestSeconds += currentRestElapsedSeconds();
  ui.routineTimer.restRunning = false;
  ui.routineTimer.restStartedAt = null;
  ui.routineTimer.restRemainingSeconds = ui.routineTimer.restPresetSeconds;
  ui.routineTimer.restDurationSeconds = ui.routineTimer.restPresetSeconds;
  ui.routineTimer.restAccumulatedElapsedSeconds = 0;

  if (notify) {
    navigator.vibrate?.(120);
    showToast("Break done");
  }
}

function renderRoutineTimerUI() {
  const workoutElapsed = currentWorkoutElapsedSeconds();
  const restElapsed = currentRestElapsedSeconds();
  const restRemaining = currentRestRemainingSeconds();
  const restOverrun = Math.max(0, restElapsed - ui.routineTimer.restDurationSeconds);
  const loggedRestSeconds = ui.routineTimer.totalRestSeconds + currentRestElapsedSeconds();
  const routineTimingBudget = collectRoutineTimingBudget();
  const idleNote = ui.logMode === "quick"
    ? "Use the timer while you log any workout. Total time and break time will be saved with the session."
    : routineTimingBudget
      ? `Start the workout timer when you begin. Planned today: ${formatDurationCompact(routineTimingBudget.workSeconds)} set work + ${formatDurationCompact(routineTimingBudget.restSeconds)} break budget.`
      : "Start the workout timer when you begin training. It will keep your total time updated automatically.";

  refs.routineWorkoutTimer.textContent = formatTimerClock(workoutElapsed, { showHours: true });
  refs.routineRestTimer.textContent = restOverrun
    ? `+${formatTimerClock(restOverrun, { showHours: false })}`
    : formatTimerClock(restRemaining, { showHours: false });
  refs.routineWorkoutTimerNote.textContent = ui.routineTimer.workoutRunning
    ? "Workout timer is running. Pause anytime if you need to. Total duration will still be logged."
    : ui.routineTimer.hasMeasuredWorkoutTime
      ? "Workout timer paused. You can resume it or save the session with this measured total."
      : idleNote;
  refs.routineRestTotal.textContent = restOverrun
    ? `Rest logged: ${formatDurationCompact(loggedRestSeconds)} • +${formatDurationCompact(restOverrun)} extra`
    : `Rest logged: ${formatDurationCompact(loggedRestSeconds)}`;
  refs.toggleRoutineWorkoutTimer.textContent = ui.routineTimer.workoutRunning
    ? "Pause workout"
    : (ui.routineTimer.hasMeasuredWorkoutTime ? "Resume workout" : "Start workout");
  refs.resetRoutineWorkoutTimer.disabled = !ui.routineTimer.hasMeasuredWorkoutTime && !ui.routineTimer.totalRestSeconds;
  refs.startRoutineRestTimer.textContent = ui.routineTimer.restRunning
    ? "Pause break"
    : (ui.routineTimer.restAccumulatedElapsedSeconds > 0 ? "Resume break" : "Start break");
  refs.stopRoutineRestTimer.disabled = !ui.routineTimer.restRunning && ui.routineTimer.restAccumulatedElapsedSeconds === 0;
  refs.stopRoutineRestTimer.textContent = ui.routineTimer.restRunning || ui.routineTimer.restAccumulatedElapsedSeconds > 0
    ? "Reset break"
    : "Reset break";
  refs.addRoutineRestTime.disabled = false;
  refs.routineRestPresets.forEach((button) => {
    button.classList.toggle("is-selected", Number(button.dataset.restPreset) === ui.routineTimer.restPresetSeconds);
  });

  syncRoutineDurationFromTimer();
}

function runRoutineTimerTick() {
  if (ui.routineTimer.workoutRunning) {
    ui.routineTimer.workoutElapsedSeconds = currentWorkoutElapsedSeconds();
    ui.routineTimer.hasMeasuredWorkoutTime = ui.routineTimer.workoutElapsedSeconds > 0;
  }

  if (ui.routineTimer.restRunning) {
    const restElapsed = currentRestElapsedSeconds();
    ui.routineTimer.restRemainingSeconds = currentRestRemainingSeconds();
    if (
      !ui.routineTimer.restTargetReachedNotified
      && restElapsed >= ui.routineTimer.restDurationSeconds
    ) {
      ui.routineTimer.restTargetReachedNotified = true;
      navigator.vibrate?.(120);
      showToast("Planned break reached");
    }
  }

  renderRoutineTimerUI();
  renderGuidedWorkoutUI();
  stopRoutineTimerIntervalIfIdle();
}

function ensureRoutineTimerInterval() {
  if (routineTimerInterval) {
    return;
  }

  routineTimerInterval = window.setInterval(runRoutineTimerTick, 1000);
}

function resetRoutineTimerState({ autoStart = false, elapsedSeconds = 0, restSeconds = 0, presetSeconds = 120 } = {}) {
  ui.routineTimer = createRoutineTimerState();
  ui.routineTimer.workoutElapsedSeconds = Math.max(0, Math.floor(elapsedSeconds || 0));
  ui.routineTimer.totalRestSeconds = Math.max(0, Math.floor(restSeconds || 0));
  ui.routineTimer.restPresetSeconds = presetSeconds;
  ui.routineTimer.restDurationSeconds = presetSeconds;
  ui.routineTimer.restRemainingSeconds = presetSeconds;
  ui.routineTimer.restAccumulatedElapsedSeconds = 0;
  ui.routineTimer.hasMeasuredWorkoutTime = ui.routineTimer.workoutElapsedSeconds > 0;

  if (routineTimerInterval) {
    window.clearInterval(routineTimerInterval);
    routineTimerInterval = null;
  }

  if (autoStart) {
    startRoutineWorkoutTimer();
  } else {
    renderRoutineTimerUI();
  }
}

function startRoutineWorkoutTimer() {
  if (ui.routineTimer.workoutRunning) {
    return;
  }

  ui.routineTimer.workoutStartedAt = Date.now() - (ui.routineTimer.workoutElapsedSeconds * 1000);
  ui.routineTimer.workoutRunning = true;
  ensureRoutineTimerInterval();
  renderRoutineTimerUI();
}

function pauseRoutineWorkoutTimer() {
  if (!ui.routineTimer.workoutRunning) {
    return;
  }

  ui.routineTimer.workoutElapsedSeconds = currentWorkoutElapsedSeconds();
  ui.routineTimer.workoutRunning = false;
  ui.routineTimer.workoutStartedAt = null;
  ui.routineTimer.hasMeasuredWorkoutTime = ui.routineTimer.workoutElapsedSeconds > 0;
  renderRoutineTimerUI();
  stopRoutineTimerIntervalIfIdle();
}

function toggleRoutineWorkoutTimer() {
  if (ui.routineTimer.workoutRunning) {
    pauseRoutineWorkoutTimer();
  } else {
    startRoutineWorkoutTimer();
  }
}

function resetRoutineRestTimer({ recordElapsed = true } = {}) {
  const elapsed = currentRestElapsedSeconds();
  if (recordElapsed && elapsed > 0) {
    ui.routineTimer.totalRestSeconds += elapsed;
  }

  ui.routineTimer.restRunning = false;
  ui.routineTimer.restStartedAt = null;
  ui.routineTimer.restDurationSeconds = ui.routineTimer.restPresetSeconds;
  ui.routineTimer.restRemainingSeconds = ui.routineTimer.restPresetSeconds;
  ui.routineTimer.restAccumulatedElapsedSeconds = 0;
  ui.routineTimer.restTargetReachedNotified = false;
  renderRoutineTimerUI();
  stopRoutineTimerIntervalIfIdle();
}

function startRoutineRestTimer() {
  if (ui.routineTimer.restRunning) {
    ui.routineTimer.restAccumulatedElapsedSeconds = currentRestElapsedSeconds();
    ui.routineTimer.restRemainingSeconds = currentRestRemainingSeconds();
    ui.routineTimer.restRunning = false;
    ui.routineTimer.restStartedAt = null;
    renderRoutineTimerUI();
    stopRoutineTimerIntervalIfIdle();
    return;
  }

  if (ui.routineTimer.restAccumulatedElapsedSeconds === 0) {
    ui.routineTimer.restDurationSeconds = ui.routineTimer.restPresetSeconds;
    ui.routineTimer.restRemainingSeconds = ui.routineTimer.restPresetSeconds;
    ui.routineTimer.restTargetReachedNotified = false;
  }
  ui.routineTimer.restStartedAt = Date.now();
  ui.routineTimer.restRunning = true;
  ensureRoutineTimerInterval();
  renderRoutineTimerUI();
}

function addRoutineRestTime(extraSeconds = 30) {
  ui.routineTimer.restDurationSeconds += extraSeconds;
  ui.routineTimer.restRemainingSeconds = currentRestRemainingSeconds() + extraSeconds;
  if (currentRestElapsedSeconds() < ui.routineTimer.restDurationSeconds) {
    ui.routineTimer.restTargetReachedNotified = false;
  }
  renderRoutineTimerUI();
}

function selectRoutineRestPreset(seconds) {
  ui.routineTimer.restPresetSeconds = seconds;
  if (!ui.routineTimer.restRunning && ui.routineTimer.restAccumulatedElapsedSeconds === 0) {
    ui.routineTimer.restDurationSeconds = seconds;
    ui.routineTimer.restRemainingSeconds = seconds;
    ui.routineTimer.restTargetReachedNotified = false;
  }
  renderRoutineTimerUI();
}

function loadRoutineTimerFromWorkout(workout) {
  resetRoutineTimerState({
    elapsedSeconds: workout?.elapsedSeconds || 0,
    restSeconds: workout?.restSeconds || 0,
    presetSeconds: workout?.restPresetSeconds || 120
  });
}

function buildStarterLegDayRoutine(id = uid()) {
  return {
    id,
    systemKey: "starter-leg-day-v1",
    name: STARTER_LEG_DAY_NAME,
    kind: "strength",
    sessionKind: "strength",
    notes: "Ready for tomorrow. Compounds: rest 2 to 3 min. Isolation work: 90 sec. Pause the timer anytime if life interrupts. Total workout time will still log.",
    estimatedMinutes: 80,
    exercises: [
      { id: uid(), name: "Back Squat", targetSets: 4, targetReps: "5-6", notes: "Compound. Rest 2-3 min." },
      { id: uid(), name: "Romanian Deadlift", targetSets: 4, targetReps: "6-8", notes: "Compound. Rest 2-3 min." },
      { id: uid(), name: "Leg Press", targetSets: 3, targetReps: "8-10", notes: "Compound. Rest 2 min." },
      { id: uid(), name: "Walking Lunge", targetSets: 3, targetReps: "8 each", notes: "Control the descent. Rest 90-120 sec." },
      { id: uid(), name: "Seated Leg Curl", targetSets: 3, targetReps: "10-12", notes: "Isolation. Rest 90 sec." },
      { id: uid(), name: "Leg Extension", targetSets: 3, targetReps: "12-15", notes: "Isolation. Rest 90 sec." },
      { id: uid(), name: "Standing Calf Raise", targetSets: 3, targetReps: "12-15", notes: "Isolation. Rest 90 sec." }
    ]
  };
}

function buildUploadedHistoryStarterRoutines(workouts = []) {
  const profile = buildTrainingHistoryProfile(workouts);
  const preferred = profile.preferredExercises;
  const personalizeFromHistory = (baseExercise, preferredName) => personalizeRoutineExercise(
    baseExercise,
    preferredName,
    { workouts }
  );

  return [
    {
      id: uid(),
      systemKey: "notebook-quad-focus-v1",
      name: "Notebook Quad Focus",
      kind: "strength",
      sessionKind: "strength",
      notes: `Built from your quad-focused pages: keep ${preferred.lowerSquat.toLowerCase()}, ${preferred.lowerQuadPress.toLowerCase()}, and one unilateral knee-dominant pattern present, then finish with simple quad and calf support.`,
      estimatedMinutes: 75,
      exercises: [
        personalizeFromHistory({ name: "Hip Thrust", targetSets: 4, targetReps: "8-10", targetLogReps: 10, targetEffortPercent: 82, targetRestSeconds: 105, notes: "Glute primer before the main knee-dominant work." }, preferred.lowerPosteriorSupport),
        personalizeFromHistory({ name: "Back Squat", targetSets: 3, targetReps: "5-6", targetLogReps: 6, targetEffortPercent: 85, targetRestSeconds: 150, notes: "Main quad anchor. Keep the reps clean." }, preferred.lowerSquat),
        personalizeFromHistory({ name: "Hack Squat", targetSets: 3, targetReps: "6-8", targetLogReps: 8, targetEffortPercent: 82, targetRestSeconds: 120, notes: "Machine quad volume without another long setup." }, preferred.lowerQuadPress),
        personalizeFromHistory({ name: "Step-Up", targetSets: 3, targetReps: "6 each", targetLogReps: 6, targetEffortPercent: 80, targetRestSeconds: 90, notes: "Use your preferred unilateral quad pattern here." }, preferred.lowerSingle),
        personalizeFromHistory({ name: "Leg Extension", targetSets: 2, targetReps: "10-15", targetLogReps: 12, targetEffortPercent: 78, targetRestSeconds: 60, notes: "Straightforward quad finish." }, preferred.lowerQuadAccessory),
        personalizeFromHistory({ name: "Calf Raise", targetSets: 2, targetReps: "10-12", targetLogReps: 12, targetEffortPercent: 78, targetRestSeconds: 60, notes: "Smooth tempo." }, preferred.lowerCalves)
      ]
    },
    {
      id: uid(),
      systemKey: "notebook-glutes-hammies-v1",
      name: "Notebook Glutes + Hammies",
      kind: "strength",
      sessionKind: "strength",
      notes: `Closer to your glutes-and-hams notebooks: hinge first, glute support second, then one unilateral pattern and simple hamstring work instead of junk volume.`,
      estimatedMinutes: 70,
      exercises: [
        personalizeFromHistory({ name: "Romanian Deadlift", targetSets: 4, targetReps: "6-8", targetLogReps: 6, targetEffortPercent: 82, targetRestSeconds: 120, notes: "Main hinge of the day." }, preferred.lowerPosteriorMain),
        personalizeFromHistory({ name: "Hip Thrust", targetSets: 3, targetReps: "8-10", targetLogReps: 10, targetEffortPercent: 82, targetRestSeconds: 90, notes: "Glute support, not a second max lift." }, preferred.lowerPosteriorSupport),
        personalizeFromHistory({ name: "Bulgarian Split Squat", targetSets: 3, targetReps: "6 each", targetLogReps: 6, targetEffortPercent: 82, targetRestSeconds: 90, notes: "Keep the single-leg pattern alive." }, preferred.lowerSingle),
        personalizeFromHistory({ name: "Back Squat", targetSets: 2, targetReps: "5-6", targetLogReps: 5, targetEffortPercent: 80, targetRestSeconds: 120, notes: "Optional second compound if you still feel crisp." }, preferred.lowerSquat),
        personalizeFromHistory({ name: "Hamstring Curl", targetSets: 2, targetReps: "10-12", targetLogReps: 10, targetEffortPercent: 78, targetRestSeconds: 60, notes: "Easy hamstring volume." }, preferred.lowerHamAccessory),
        personalizeFromHistory({ name: "Back Extension", targetSets: 2, targetReps: "10-12", targetLogReps: 10, targetEffortPercent: 75, targetRestSeconds: 60, notes: "Lower-back and glute support." }, preferred.lowerPosteriorSupport)
      ]
    },
    {
      id: uid(),
      systemKey: "notebook-cali-pull-dips-v1",
      name: "Notebook Cali Pull + Dips",
      kind: "mixed",
      sessionKind: "functional",
      notes: `Matches the cali-heavy upper pages better than a pure bodybuilding split: ${preferred.upperPullMain.toLowerCase()}, ${preferred.upperDip.toLowerCase()}, a row, trunk work, and a little skill if the shoulders feel good. Bare tag en masse reps, keep volume over pauser, and make it faster and more useful for what you actually need.`,
      estimatedMinutes: 55,
      exercises: [
        personalizeFromHistory({ name: "Pull-Up", targetSets: 5, targetReps: "3-6", targetLogReps: 5, targetEffortPercent: 85, targetRestSeconds: 120, notes: "Strict reps first." }, preferred.upperPullMain),
        personalizeFromHistory({ name: "Dips", targetSets: 3, targetReps: "6-10", targetLogReps: 8, targetEffortPercent: 85, targetRestSeconds: 105, notes: "Weighted only if the shoulders feel good." }, preferred.upperDip),
        personalizeFromHistory({ name: "Row", targetSets: 3, targetReps: "6-10", targetLogReps: 8, targetEffortPercent: 80, targetRestSeconds: 90, notes: "Simple row anchor." }, preferred.upperRow),
        personalizeFromHistory({ name: "Shoulder Press", targetSets: 2, targetReps: "6-8", targetLogReps: 6, targetEffortPercent: 78, targetRestSeconds: 90, notes: "Support, not ego pressing." }, preferred.upperVerticalPress),
        personalizeFromHistory({ name: "Weighted Plank", targetSets: 3, targetReps: "40-60 s", targetSetSeconds: 45, targetRestSeconds: 75, notes: "Trunk tension and shoulder position." }, preferred.core),
        personalizeFromHistory({ name: "Dead Hang", targetSets: 2, targetReps: "max quality", targetRestSeconds: 75, notes: "Grip and shoulder decompression." }, preferred.core)
      ]
    },
    {
      id: uid(),
      systemKey: "notebook-gym-upper-balance-v1",
      name: "Notebook Gym Upper Balance",
      kind: "strength",
      sessionKind: "strength",
      notes: `Built from the mixed upper-body pages: one vertical pull, one row, one main press, shoulder support, and a small arm finish if you want it.`,
      estimatedMinutes: 65,
      exercises: [
        personalizeFromHistory({ name: "Lat Pulldown", targetSets: 3, targetReps: "6-8", targetLogReps: 8, targetEffortPercent: 82, targetRestSeconds: 90, notes: "Vertical pull anchor." }, preferred.upperGymPull),
        personalizeFromHistory({ name: "Row", targetSets: 3, targetReps: "6-8", targetLogReps: 8, targetEffortPercent: 80, targetRestSeconds: 90, notes: "Keep the shoulders balanced." }, preferred.upperRow),
        personalizeFromHistory({ name: "Bench Press", targetSets: 3, targetReps: "4-6", targetLogReps: 5, targetEffortPercent: 82, targetRestSeconds: 120, notes: "Heavy press anchor." }, preferred.upperPressMain),
        personalizeFromHistory({ name: "Shoulder Press", targetSets: 2, targetReps: "6-8", targetLogReps: 6, targetEffortPercent: 78, targetRestSeconds: 90, notes: "Controlled path." }, preferred.upperVerticalPress),
        personalizeFromHistory({ name: "Face Pull", targetSets: 2, targetReps: "10-15", targetLogReps: 12, targetEffortPercent: 72, targetRestSeconds: 60, notes: "Scap and rear-delt support." }, preferred.upperScap),
        { id: uid(), name: "Curl", targetSets: 2, targetReps: "10-12", targetLogReps: 10, targetEffortPercent: 75, targetRestSeconds: 60, notes: "Optional arm finish." }
      ]
    },
    {
      id: uid(),
      systemKey: "ladder-full-body-a-v1",
      name: "Ladder Full Body A",
      kind: "strength",
      sessionKind: "strength",
      notes: "Inspired by the Ladder notes you kept: one squat, one hip-dominant lift, one pull anchor, and simple trunk / shoulder support.",
      estimatedMinutes: 60,
      exercises: [
        personalizeFromHistory({ name: "Back Squat", targetSets: 3, targetReps: "3-8", targetLogReps: 5, targetEffortPercent: 85, targetRestSeconds: 150, notes: "Use the heavy focus lift here." }, preferred.lowerSquat),
        personalizeFromHistory({ name: "Hip Thrust", targetSets: 3, targetReps: "8-12", targetLogReps: 10, targetEffortPercent: 82, targetRestSeconds: 90, notes: "Strong but smooth." }, preferred.lowerPosteriorSupport),
        personalizeFromHistory({ name: "Pull-Up", targetSets: 4, targetReps: "4-6", targetLogReps: 5, targetEffortPercent: 85, targetRestSeconds: 120, notes: "Leave one good rep in reserve." }, preferred.upperPullMain),
        personalizeFromHistory({ name: "Face Pull", targetSets: 3, targetReps: "10-15", targetLogReps: 12, targetEffortPercent: 72, targetRestSeconds: 60, notes: "Rear-delt / shoulder support." }, preferred.upperScap),
        personalizeFromHistory({ name: "Leg Raise", targetSets: 3, targetReps: "8-12", targetLogReps: 10, targetEffortPercent: 75, targetRestSeconds: 60, notes: "Simple core finish." }, preferred.core)
      ]
    },
    {
      id: uid(),
      systemKey: "ladder-full-body-b-v1",
      name: "Ladder Full Body B",
      kind: "strength",
      sessionKind: "strength",
      notes: "Second Ladder-style full body day: hinge, bench, row, unilateral legs, and one triceps / dip slot.",
      estimatedMinutes: 65,
      exercises: [
        personalizeFromHistory({ name: "Deadlift", targetSets: 3, targetReps: "3-6", targetLogReps: 4, targetEffortPercent: 85, targetRestSeconds: 150, notes: "Heavy hinge focus." }, preferred.lowerPosteriorMain),
        personalizeFromHistory({ name: "Bench Press", targetSets: 3, targetReps: "4-6", targetLogReps: 5, targetEffortPercent: 82, targetRestSeconds: 120, notes: "Press anchor." }, preferred.upperPressMain),
        personalizeFromHistory({ name: "Single-Arm Row", targetSets: 3, targetReps: "8-12", targetLogReps: 10, targetEffortPercent: 80, targetRestSeconds: 75, notes: "Keep it controlled." }, preferred.upperRow),
        personalizeFromHistory({ name: "Walking Lunge", targetSets: 3, targetReps: "8 each", targetLogReps: 8, targetEffortPercent: 80, targetRestSeconds: 90, notes: "Unilateral leg support." }, preferred.lowerSingle),
        personalizeFromHistory({ name: "Dips", targetSets: 3, targetReps: "8-12", targetLogReps: 10, targetEffortPercent: 80, targetRestSeconds: 90, notes: "Triceps / chest finish." }, preferred.upperDip)
      ]
    },
    {
      id: uid(),
      systemKey: "notebook-5k-quality-v1",
      name: "Notebook 5k Quality",
      kind: "conditioning",
      sessionKind: "run",
      notes: "Built from your 400 m, 600 m, 1000 m, and threshold notes. Use this for a flatter week where you want one structured run instead of guessing mid-session.",
      estimatedMinutes: 45,
      exercises: []
    },
    {
      id: uid(),
      systemKey: "brain-break-endurance-bike-v1",
      name: "Brain-Break Endurance Bike",
      kind: "conditioning",
      sessionKind: "bike",
      notes: "Steady endurance ride inspired by your long spin notes: controlled cadence, no standing grind, and a version that works even on tired-brain days.",
      estimatedMinutes: 75,
      exercises: []
    }
  ];
}

function buildSystemStarterRoutines(workouts = []) {
  return [buildStarterLegDayRoutine(), ...buildUploadedHistoryStarterRoutines(workouts)];
}

function ensureSystemStarterRoutines(routines = [], workouts = []) {
  const existingKeys = new Set(routines.map((routine) => routine.systemKey).filter(Boolean));
  const existingNames = new Set(
    routines.map((routine) => String(routine.name || "").trim().toLowerCase()).filter(Boolean)
  );
  const missing = buildSystemStarterRoutines(workouts).filter((routine) => {
    const normalizedName = String(routine.name || "").trim().toLowerCase();
    return !existingKeys.has(routine.systemKey) && !existingNames.has(normalizedName);
  });

  return missing.length ? [...missing, ...routines] : routines;
}

function clearRoutineLogTemplate() {
  ui.activeRoutineLogTemplate = null;
  refs.routineLogTemplateNote.textContent = "";
  refs.routineLogTemplateNote.classList.add("hidden");
  refs.routineLogSelect.disabled = false;
}

function setRoutineLogTemplate(template) {
  ui.activeRoutineLogTemplate = template;
  if (!template) {
    clearRoutineLogTemplate();
    return;
  }

  refs.routineLogTemplateNote.textContent = template.sourceType === "planned"
    ? `Tracking ${template.title} from ${template.sourceLabel}. Exercise history stays shared by exercise name across weeks, routines, and blocks.`
    : template.sourceType === "photo"
      ? "Imported from handwritten notes. Review the OCR-filled sets, then save so the workout becomes part of your progress history."
      : "";
  refs.routineLogTemplateNote.classList.toggle("hidden", template.sourceType === "routine");
  refs.routineLogSelect.disabled = template.sourceType !== "routine";
}

function cloneExerciseTemplates(exercises = []) {
  return exercises.map((exercise) => normalizeExerciseTemplate({
    id: exercise.id,
    name: exercise.name,
    targetSets: exercise.targetSets,
    targetReps: exercise.targetReps,
    notes: exercise.notes,
    targetLogReps: exercise.targetLogReps,
    targetEffortPercent: exercise.targetEffortPercent,
    targetWeight: exercise.targetWeight,
    targetSetSeconds: exercise.targetSetSeconds,
    targetRestSeconds: exercise.targetRestSeconds,
    afterSetTemplates: exercise.afterSetTemplates,
    extraSetTemplates: exercise.extraSetTemplates
  }));
}

function ensureEditableRoutineLogTemplate() {
  const template = currentRoutineLogTemplate();
  if (!template) {
    return null;
  }

  if (ui.activeRoutineLogTemplate) {
    return ui.activeRoutineLogTemplate;
  }

  const workingTemplate = {
    ...template,
    exercises: cloneExerciseTemplates(template.exercises || [])
  };
  setRoutineLogTemplate(workingTemplate);
  return workingTemplate;
}

function promptForSessionExerciseName() {
  const value = window.prompt("Exercise name");
  return value ? value.trim() : "";
}

function buildAdHocExerciseTemplate(name, sessionKind = "strength") {
  const isLiftStyle = liftSessionKinds.has(sessionKind);

  return hydrateExerciseTemplate({
    id: uid(),
    name,
    targetSets: isLiftStyle ? 3 : 1,
    targetReps: isLiftStyle ? "8-10" : "",
    notes: "",
    targetRestSeconds: isLiftStyle ? ui.routineTimer.restPresetSeconds : null
  }, sessionKind);
}

function findPlannedSessionRecord(sessionId) {
  for (const block of state.blocks) {
    for (const week of block.weeks || []) {
      for (const session of week.plannedSessions || []) {
        if (session.id === sessionId) {
          return { block, week, session };
        }
      }
    }
  }

  return null;
}

function buildRoutineLogTemplateFromRoutine(routine) {
  if (!routine) {
    return null;
  }

  return {
    sourceType: "routine",
    routineId: routine.id,
    sessionId: null,
    blockId: null,
    weekId: null,
    title: routine.name,
    kind: routine.sessionKind,
    notes: routine.notes || sessionKinds[routine.sessionKind].description,
    estimatedMinutes: routine.estimatedMinutes || 60,
    exercises: cloneExerciseTemplates(routine.exercises || []),
    sourceLabel: routine.name
  };
}

function buildRoutineLogTemplateFromPlannedSession(record) {
  if (!record?.session) {
    return null;
  }

  const linkedRoutine = linkedRoutineForSession(record.session);
  const kind = plannedSessionKindValue(record.session);

  return {
    sourceType: "planned",
    routineId: record.session.routineId || null,
    sessionId: record.session.id,
    blockId: record.block?.id || null,
    weekId: record.week?.id || null,
    title: plannedSessionTitle(record.session),
    kind,
    notes: record.session.details?.trim() || linkedRoutine?.notes || sessionKinds[kind]?.description || "",
    estimatedMinutes: linkedRoutine?.estimatedMinutes || 60,
    exercises: cloneExerciseTemplates(plannedSessionExercises(record.session)),
    sourceLabel: [record.block?.name, record.week?.title, record.session.dayLabel].filter(Boolean).join(" • ")
  };
}

function buildRoutineLogTemplateFromWorkout(workout) {
  if (!workout) {
    return null;
  }

  const record = workout.plannedSessionId ? findPlannedSessionRecord(workout.plannedSessionId) : null;
  const fallbackExercises = Array.isArray(workout.templateExercises) && workout.templateExercises.length
    ? workout.templateExercises
    : (record ? plannedSessionExercises(record.session) : []);
  const sourceType = workout.templateSourceType
    || (workout.plannedSessionId ? "planned" : (fallbackExercises.length ? "photo" : "routine"));

  return {
    sourceType,
    routineId: workout.routineId || record?.session?.routineId || null,
    sessionId: workout.plannedSessionId || record?.session?.id || null,
    blockId: workout.plannedBlockId || record?.block?.id || null,
    weekId: workout.plannedWeekId || record?.week?.id || null,
    title: workout.templateTitle || workout.title,
    kind: workout.templateKind || workout.kind,
    notes: workout.templateNotes || record?.session?.details || workout.notes || "",
    estimatedMinutes: workout.elapsedSeconds
      ? Math.max(1, Math.round(workout.elapsedSeconds / 60))
      : (workout.durationMinutes || record?.session?.estimatedMinutes || 60),
    exercises: cloneExerciseTemplates(fallbackExercises),
    sourceLabel: workout.templateSourceLabel
      || [record?.block?.name, record?.week?.title, record?.session?.dayLabel].filter(Boolean).join(" • ")
      || (sourceType === "photo" ? "Handwritten notes import" : "Saved workout template")
  };
}

function currentRoutineLogTemplate() {
  if (ui.activeRoutineLogTemplate) {
    return ui.activeRoutineLogTemplate;
  }

  return buildRoutineLogTemplateFromRoutine(
    state.routines.find((item) => item.id === refs.routineLogSelect.value)
  );
}

function collectExerciseSetLogsFromContainer(container, { includeUntouched = false } = {}) {
  if (!container) {
    return [];
  }

  const mainWeight = container.closest("[data-exercise-name]")
    ? normalizeSelectNumber(currentExerciseCardSetWeight(container.closest("[data-exercise-name]")))
    : normalizeSelectNumber(currentGuidedWorkoutDraft()?.weightValue ?? currentGuidedWorkoutDraft()?.targetWeight);

  return [...container.querySelectorAll("[data-set-row]")].map((row) => {
    const setLog = normalizeExerciseSetLog({
      id: row.dataset.setId || uid(),
      rowType: row.dataset.rowType,
      setIndex: row.dataset.setIndex,
      parentSetIndex: row.dataset.parentSetIndex,
      templateLabel: row.dataset.templateLabel,
      placeholderReps: row.dataset.placeholderReps,
      weightMode: row.dataset.weightMode,
      weightValue: row.dataset.weightValue
    }, {
      fallbackReps: row.dataset.placeholderReps || ""
    });
    const weightValue = row.querySelector("[data-set-weight]")?.value;
    const repsValue = row.querySelector("[data-set-reps]")?.value;
    const effortPercentValue = row.querySelector("[data-set-effort-percent]")?.value;
    const setSecondsValue = row.querySelector("[data-set-log-seconds]")?.value;
    const restSecondsValue = row.querySelector("[data-set-log-rest-seconds]")?.value;
    const weight = weightValue === "" ? null : Number(weightValue);
    const reps = repsValue === "" ? null : Number(repsValue);
    const effortPercent = effortPercentValue === "" ? null : Number(effortPercentValue);
    const setSeconds = setSecondsValue === "" ? null : Number(setSecondsValue);
    const restSeconds = restSecondsValue === "" ? null : Number(restSecondsValue);
    const expectedWeight = resolveSetTemplateAutoWeight(setLog, mainWeight);
    const expectedSetSeconds = normalizeSelectNumber(row.dataset.defaultSetSeconds);
    const expectedRestSeconds = normalizeSelectNumber(row.dataset.defaultRestSeconds);
    const expectedEffortPercent = normalizeSelectNumber(row.dataset.defaultEffortPercent);
    const isUntouchedSuggestedWeight = reps == null
      && effortPercent == null
      && weight != null
      && expectedWeight != null
      && Math.abs(weight - expectedWeight) < 0.001;
    const hasDetailChange = (setSeconds != null || restSeconds != null || effortPercent != null)
      && (
        (setSeconds ?? null) !== (expectedSetSeconds ?? null)
        || (restSeconds ?? null) !== (expectedRestSeconds ?? null)
        || (effortPercent ?? null) !== (expectedEffortPercent ?? null)
      );

    if (
      !includeUntouched
      && !hasDetailChange
      && ((weight == null && reps == null) || isUntouchedSuggestedWeight)
    ) {
      return null;
    }

    return {
      ...setLog,
      weight: Number.isFinite(weight) ? weight : null,
      reps: Number.isFinite(reps) ? reps : null,
      effortPercent: Number.isFinite(effortPercent) ? effortPercent : expectedEffortPercent,
      setSeconds: Number.isFinite(setSeconds) ? setSeconds : expectedSetSeconds,
      restSeconds: Number.isFinite(restSeconds) ? restSeconds : expectedRestSeconds
    };
  }).filter(Boolean);
}

function buildGuidedWorkoutDraft(exercise, card, templateKind) {
  const latestEntry = getPreviousExerciseEntry(exercise.name);
  const suggestedWeight = getSuggestedExerciseWeight(exercise, templateKind, { latestEntry });
  const summary = card
    ? summarizeExerciseSetLogs(collectExerciseSetLogsFromContainer(card.querySelector("[data-set-list]")))
    : { keyWeight: null, reps: null };
  const draftSetLogs = card
    ? collectExerciseSetLogsFromContainer(card.querySelector("[data-set-list]"), { includeUntouched: true })
    : [];

  return {
    ...normalizeExerciseTemplate(exercise),
    templateNote: exercise.notes || "",
    noteValue: card?.querySelector("[data-note]")?.value.trim() || "",
    repsValue: card?.querySelector("[data-reps-picker]")?.value || exercise.targetLogReps || summary.reps || "",
    effortPercentValue: card?.querySelector("[data-effort-percent]")?.value || exercise.targetEffortPercent || "",
    weightValue: card?.querySelector("[data-lift-weight]")?.value || suggestedWeight || exercise.targetWeight || summary.keyWeight || "",
    setSecondsValue: card?.querySelector("[data-set-seconds]")?.value || exercise.targetSetSeconds || inferSetSecondsFromExercise(exercise),
    restTargetSecondsValue: card?.querySelector("[data-rest-seconds]")?.value || exercise.targetRestSeconds || "",
    restSecondsValue: "",
    setLogs: draftSetLogs.length
      ? draftSetLogs
      : buildExerciseSetDraftsFromTemplate(exercise, {
        defaultWeight: suggestedWeight,
        defaultSetSeconds: exercise.targetSetSeconds ?? inferSetSecondsFromExercise(exercise),
        defaultRestSeconds: exercise.targetRestSeconds ?? "",
        defaultEffortPercent: exercise.targetEffortPercent ?? ""
      })
  };
}

function buildGuidedWorkoutDrafts(template) {
  const cards = [...refs.routineExerciseFields.querySelectorAll("[data-exercise-name]")];

  return (template?.exercises || []).map((exercise, index) => (
    buildGuidedWorkoutDraft(exercise, cards[index], template?.kind)
  ));
}

function currentGuidedWorkoutDraft() {
  return ui.guidedWorkout.exerciseDrafts[ui.guidedWorkout.exerciseIndex] || null;
}

function currentGuidedExerciseElapsedSeconds() {
  if (ui.guidedWorkout.frozenExerciseElapsedSeconds != null) {
    return ui.guidedWorkout.frozenExerciseElapsedSeconds;
  }

  if (!ui.guidedWorkout.active || !ui.guidedWorkout.enteredExerciseAt) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - ui.guidedWorkout.enteredExerciseAt) / 1000));
}

function buildGuidedExercisePhaseSequence(draft = currentGuidedWorkoutDraft()) {
  const safeDraft = draft || {};
  return buildExercisePhaseSequence(safeDraft, {
    targetReps: safeDraft.targetReps || "",
    defaultWeight: normalizeSelectNumber(safeDraft.weightValue) ?? safeDraft.targetWeight,
    defaultSetSeconds: guidedExerciseSetTargetSeconds(safeDraft),
    defaultRestSeconds: guidedExerciseRestTargetSeconds(safeDraft)
  });
}

function buildGuidedExercisePhaseState(draft = currentGuidedWorkoutDraft()) {
  const autoElapsed = currentGuidedExerciseElapsedSeconds();
  const defaultSetSeconds = guidedExerciseSetTargetSeconds(draft);
  const defaultRestSeconds = guidedExerciseRestTargetSeconds(draft);
  const sequence = buildGuidedExercisePhaseSequence(draft);
  const phases = sequence.phases || [];
  const currentPhaseIndex = phases.findIndex((item) => autoElapsed < item.endOffsetSeconds);
  const resolvedPhaseIndex = currentPhaseIndex >= 0
    ? currentPhaseIndex
    : (phases.length ? phases.length - 1 : -1);
  const currentPhase = resolvedPhaseIndex >= 0 ? phases[resolvedPhaseIndex] : null;
  const nextPhase = resolvedPhaseIndex >= 0 ? phases[resolvedPhaseIndex + 1] || null : null;
  const plannedWorkSeconds = sequence.totalWorkSeconds;
  const plannedRestSeconds = sequence.totalRestSeconds;
  const totalDurationSeconds = sequence.totalDurationSeconds;
  const phaseBudget = currentPhase?.durationSeconds || 0;
  const phaseElapsed = currentPhase
    ? clamp(autoElapsed - currentPhase.startOffsetSeconds, 0, phaseBudget)
    : 0;
  const remainingSeconds = currentPhase
    ? Math.max(0, currentPhase.endOffsetSeconds - autoElapsed)
    : 0;
  const extraSeconds = currentPhase
    ? Math.max(0, autoElapsed - currentPhase.endOffsetSeconds)
    : Math.max(0, autoElapsed - totalDurationSeconds);
  const inBreakPhase = currentPhase?.type === "break";
  const progressRatio = phaseBudget > 0 ? clamp(phaseElapsed / phaseBudget, 0, 1) : 1;
  const canSkipCurrentPhaseEarly = Boolean(currentPhase && phaseBudget > 0 && remainingSeconds > 0);

  return {
    autoElapsed,
    setSeconds: defaultSetSeconds,
    defaultRestSeconds,
    sequence,
    phases,
    phaseCount: phases.length,
    currentPhase,
    currentPhaseIndex: resolvedPhaseIndex,
    nextPhase,
    plannedWorkSeconds,
    plannedRestSeconds,
    totalDurationSeconds,
    inBreakPhase,
    remainingSeconds,
    extraSeconds,
    progressRatio,
    canSkipCurrentPhaseEarly,
    skipActionLabel: inBreakPhase ? "Skip break timer" : "Skip set timer",
    currentPhaseTitle: currentPhase?.title || "No timer planned",
    completed: Boolean(currentPhase && autoElapsed >= totalDurationSeconds)
  };
}

function guidedExerciseSetTargetSeconds(draft = currentGuidedWorkoutDraft()) {
  return normalizeSelectNumber(draft?.setSecondsValue)
    ?? draft?.targetSetSeconds
    ?? inferSetSecondsFromExercise(draft);
}

function guidedExerciseRestTargetSeconds(draft = currentGuidedWorkoutDraft()) {
  return normalizeSelectNumber(draft?.restTargetSecondsValue)
    ?? draft?.targetRestSeconds
    ?? ui.routineTimer.restPresetSeconds;
}

function guidedExercisePlannedWorkSeconds(draft = currentGuidedWorkoutDraft()) {
  return buildGuidedExercisePhaseSequence(draft).totalWorkSeconds;
}

function commitGuidedExerciseRest(index = ui.guidedWorkout.exerciseIndex) {
  if (!ui.guidedWorkout.active || ui.guidedWorkout.introVisible) {
    return;
  }

  const draft = ui.guidedWorkout.exerciseDrafts[index];
  if (!draft) {
    return;
  }

  const elapsed = index === ui.guidedWorkout.exerciseIndex
    ? currentGuidedExerciseElapsedSeconds()
    : null;
  const sequence = buildGuidedExercisePhaseSequence(draft);
  const targetSeconds = guidedExerciseRestTargetSeconds(draft);
  const loggedRestSeconds = elapsed != null
    ? calculateElapsedPhaseTypeSeconds(sequence, elapsed, "break")
    : (normalizeSelectNumber(draft.restSecondsValue) ?? targetSeconds ?? 0);

  draft.restTargetSecondsValue = targetSeconds;
  draft.restSecondsValue = loggedRestSeconds > 0 ? String(loggedRestSeconds) : "";
  syncGuidedDraftToForm(index);
}

function totalGuidedTrackedRestSeconds() {
  if (!ui.guidedWorkout.active) {
    return 0;
  }

  return ui.guidedWorkout.exerciseDrafts.reduce((total, draft) => {
    const value = normalizeSelectNumber(draft.restSecondsValue);
    return total + (value != null ? value : 0);
  }, 0);
}

function scrollGuidedTrackingIntoView() {
  refs.guidedTrackingSheet?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function dismissGuidedOverview() {
  if (!ui.guidedWorkout.active) {
    return;
  }

  ui.guidedWorkout.introVisible = false;
  ui.guidedWorkout.introDismissAt = null;
  ui.guidedWorkout.frozenExerciseElapsedSeconds = null;
  if (!ui.guidedWorkout.enteredExerciseAt) {
    ui.guidedWorkout.enteredExerciseAt = Date.now();
  }
  renderGuidedWorkoutUI();
}

function skipGuidedBreakEarly() {
  skipGuidedCurrentPhase();
}

function skipGuidedCurrentPhase() {
  if (!ui.guidedWorkout.active || ui.guidedWorkout.introVisible) {
    return;
  }

  const draft = currentGuidedWorkoutDraft();
  if (!draft) {
    return;
  }

  const phase = buildGuidedExercisePhaseState(draft);
  if (!phase.canSkipCurrentPhaseEarly) {
    return;
  }

  if (!phase.currentPhase) {
    return;
  }

  const nextElapsedSeconds = phase.currentPhase.endOffsetSeconds;
  if (phase.nextPhase) {
    ui.guidedWorkout.frozenExerciseElapsedSeconds = null;
    ui.guidedWorkout.enteredExerciseAt = Date.now() - (nextElapsedSeconds * 1000);
  } else {
    ui.guidedWorkout.frozenExerciseElapsedSeconds = phase.totalDurationSeconds;
    ui.guidedWorkout.enteredExerciseAt = null;
  }

  if (phase.inBreakPhase) {
    commitGuidedExerciseRest();
    showToast("Break timer skipped");
  } else {
    showToast("Set timer skipped");
  }

  ui.guidedWorkout.paused = false;
  renderGuidedWorkoutUI();
}

function inferExerciseEquipmentLabel(exercise = {}) {
  const text = `${exercise.name || ""} ${exercise.notes || ""}`.toLowerCase();

  if (/\byoga block\b/.test(text)) {
    return "Yoga block";
  }
  if (/\bbarbell\b/.test(text)) {
    return "Barbell";
  }
  if (/\bdumbbell|dumbbells\b/.test(text)) {
    return "Dumbbells";
  }
  if (/\bkettlebell|kettlebells\b/.test(text)) {
    return "Kettlebell";
  }
  if (/\bcable|cables\b/.test(text)) {
    return "Cable";
  }
  if (/\bband|bands\b/.test(text)) {
    return "Bands";
  }
  if (/\bmachine|leg press|leg curl|leg extension|chest press|lat pulldown\b/.test(text)) {
    return "Machine";
  }
  if (/\bbodyweight|dead bug|plank|bridge|tap|crawl|hollow|bird dog|lunge|squat\b/.test(text)) {
    return "Bodyweight";
  }

  return exerciseNeedsLiftFields(exercise, ui.guidedWorkout.templateKind) ? "Gym setup" : "Mixed";
}

function summarizeRoutineEquipment(exercises = []) {
  const labels = [...new Set(exercises.map((exercise) => inferExerciseEquipmentLabel(exercise)).filter(Boolean))];
  if (!labels.length) {
    return "Mixed equipment";
  }
  if (labels.length === 1) {
    return labels[0];
  }
  if (labels.length === 2) {
    return `${labels[0]} + ${labels[1]}`;
  }

  return `${labels[0]} + more`;
}

function buildGuidedOverviewListMarkup(exercises = []) {
  return exercises.map((exercise, index) => `
    <div class="guided-overview-row">
      <span class="guided-overview-count">${exercise.targetSets}x</span>
      <div>
        <div>${escapeHtml(exercise.name || `Exercise ${index + 1}`)}</div>
        <div class="helper-text">${escapeHtml(exercise.targetReps || "-")} • Set ${escapeHtml(formatDurationCompact(normalizeSelectNumber(exercise.targetSetSeconds) ?? inferSetSecondsFromExercise(exercise)))} • Break ${escapeHtml(formatDurationCompact(exercise.targetRestSeconds || ui.routineTimer.restPresetSeconds))}</div>
      </div>
    </div>
  `).join("");
}

function openWorkoutSummary(summary) {
  ui.exerciseProgress = createExerciseProgressState();
  ui.workoutSummary = {
    visible: true,
    data: summary
  };
  renderExerciseProgress();
  renderWorkoutSummary();
}

function closeWorkoutSummary() {
  ui.workoutSummary = createWorkoutSummaryState();
  closeExerciseProgress();
  renderWorkoutSummary();
}

function openExerciseProgress(exerciseName, equipmentFilter = "all") {
  ui.exerciseProgress = {
    visible: true,
    exerciseName,
    equipmentFilter
  };
  renderExerciseProgress();
}

function closeExerciseProgress() {
  ui.exerciseProgress = createExerciseProgressState();
  renderExerciseProgress();
}

function closeExerciseProgressAndSummary() {
  closeExerciseProgress();
  closeWorkoutSummary();
}

function handleWorkoutSummaryClick(event) {
  const trigger = event.target.closest("[data-open-exercise-progress]");
  if (!trigger) {
    return;
  }

  openExerciseProgress(trigger.dataset.openExerciseProgress);
}

function handleExerciseProgressFilterClick(event) {
  const filterButton = event.target.closest("[data-exercise-filter]");
  if (!filterButton || !ui.exerciseProgress.exerciseName) {
    return;
  }

  ui.exerciseProgress.equipmentFilter = filterButton.dataset.exerciseFilter || "all";
  renderExerciseProgress();
}

function equipmentFilterKey(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function estimateOneRepMax(entry) {
  const summary = summarizeExerciseLog(entry);
  const weight = summary.keyWeight;
  const reps = summary.reps;

  if (weight == null) {
    return null;
  }

  if (reps == null || reps <= 0) {
    return weight;
  }

  return weight * (1 + (Math.min(reps, 15) / 30));
}

function getTotalRepsForEntry(entry) {
  const setLogs = Array.isArray(entry?.setLogs) ? entry.setLogs : [];
  if (setLogs.length) {
    return sum(setLogs.map((setLog) => Number(setLog.reps) || 0));
  }

  const summary = summarizeExerciseLog(entry);
  return summary.reps || 0;
}

function calculateExerciseVolume(entry) {
  const setLogs = Array.isArray(entry?.setLogs) ? entry.setLogs : [];
  if (setLogs.length) {
    return sum(setLogs.map((setLog) => (Number(setLog.weight) || 0) * (Number(setLog.reps) || 0)));
  }

  const summary = summarizeExerciseLog(entry);
  if (summary.keyWeight != null && summary.reps != null) {
    return summary.keyWeight * summary.reps;
  }

  return 0;
}

function buildExerciseProgressDetail(exerciseName, { equipmentFilter = "all" } = {}) {
  const fullHistory = getExerciseHistory(exerciseName, { limit: Number.MAX_SAFE_INTEGER }).map((entry) => ({
    ...entry,
    equipmentLabel: inferExerciseEquipmentLabel({ name: entry.name, notes: entry.note || "" }),
    totalReps: getTotalRepsForEntry(entry),
    volume: calculateExerciseVolume(entry),
    estimatedOneRepMax: estimateOneRepMax(entry)
  }));
  const equipmentOptions = [...new Set(fullHistory.map((entry) => entry.equipmentLabel).filter(Boolean))];
  const filteredHistory = equipmentFilter === "all"
    ? fullHistory
    : fullHistory.filter((entry) => equipmentFilterKey(entry.equipmentLabel) === equipmentFilter);
  const chronological = [...filteredHistory].reverse();
  const latest = filteredHistory[0] || null;
  const earliest = chronological[0] || null;
  const latestEstimate = latest?.estimatedOneRepMax ?? latest?.keyWeight ?? null;
  const earliestEstimate = earliest?.estimatedOneRepMax ?? earliest?.keyWeight ?? null;
  const latestSummary = latest ? summarizeExerciseLog(latest) : null;
  const sinceStartedPercent = latestEstimate != null && earliestEstimate
    ? ((latestEstimate - earliestEstimate) / earliestEstimate) * 100
    : null;
  const chartPoints = chronological.slice(-6).map((entry) => ({
    value: entry.estimatedOneRepMax ?? entry.keyWeight ?? entry.totalReps ?? 0,
    label: new Intl.DateTimeFormat(navigator.language || "en-GB", {
      month: "numeric",
      day: "numeric"
    }).format(localDate(entry.workoutDate)),
    assist: formatWeight(entry.keyWeight ?? 0)
  }));
  const maxChartValue = Math.max(...chartPoints.map((point) => point.value), 1);
  const weightEntries = filteredHistory.filter((entry) => summarizeExerciseLog(entry).keyWeight != null);
  const totalVolume = sum(filteredHistory.map((entry) => entry.volume || 0));
  const totalReps = sum(filteredHistory.map((entry) => entry.totalReps || 0));
  const avgWeight = weightEntries.length
    ? sum(weightEntries.map((entry) => summarizeExerciseLog(entry).keyWeight || 0)) / weightEntries.length
    : null;
  const maxWeight = weightEntries.length
    ? Math.max(...weightEntries.map((entry) => summarizeExerciseLog(entry).keyWeight || 0))
    : null;

  return {
    exerciseName,
    equipmentFilter,
    equipmentOptions,
    fullHistory,
    latestEstimate,
    sinceStartedPercent,
    latestSummary,
    chartPoints,
    maxChartValue,
    metrics: [
      { label: "Total Volume", value: totalVolume ? `${formatNumber(totalVolume)} kg` : "--" },
      { label: "Total Reps", value: totalReps ? `${formatNumber(totalReps)}` : "--" },
      { label: "Avg Weight", value: avgWeight != null ? formatWeight(avgWeight) : "--" },
      { label: "Max Weight", value: maxWeight != null ? formatWeight(maxWeight) : "--" }
    ],
    history: filteredHistory
  };
}

function renderExerciseProgress() {
  const isVisible = ui.exerciseProgress.visible && Boolean(ui.exerciseProgress.exerciseName);
  refs.exerciseProgressPanel.classList.toggle("hidden", !isVisible);

  if (!isVisible) {
    return;
  }

  const detail = buildExerciseProgressDetail(ui.exerciseProgress.exerciseName, {
    equipmentFilter: ui.exerciseProgress.equipmentFilter
  });

  refs.exerciseProgressTitle.textContent = detail.exerciseName;
  refs.exerciseProgressFilters.innerHTML = [
    `<button class="chip ${detail.equipmentFilter === "all" ? "is-selected" : ""}" type="button" data-exercise-filter="all">All (${detail.fullHistory.length})</button>`,
    ...detail.equipmentOptions.map((label) => {
      const key = equipmentFilterKey(label);
      const count = detail.fullHistory.filter((entry) => equipmentFilterKey(entry.equipmentLabel) === key).length;
      return `<button class="chip ${detail.equipmentFilter === key ? "is-selected" : ""}" type="button" data-exercise-filter="${escapeAttribute(key)}">${escapeHtml(label)} (${count})</button>`;
    })
  ].join("");
  refs.exerciseProgressHeroValue.textContent = detail.latestEstimate != null
    ? `${formatNumber(detail.latestEstimate)}`
    : (detail.latestSummary?.keyWeight != null ? formatWeight(detail.latestSummary.keyWeight) : "--");
  refs.exerciseProgressHeroLabel.textContent = detail.latestEstimate != null ? "Estimated 1RM" : "Latest tracked value";
  refs.exerciseProgressHeroChange.textContent = detail.sinceStartedPercent != null
    ? `${detail.sinceStartedPercent >= 0 ? "↑" : "↓"} ${formatNumber(Math.abs(detail.sinceStartedPercent))}%`
    : "New";
  refs.exerciseProgressHeroSubtitle.textContent = detail.sinceStartedPercent != null
    ? "Since you started"
    : "First benchmark";
  refs.exerciseProgressChart.innerHTML = detail.chartPoints.length
    ? detail.chartPoints.map((point) => `
      <div class="exercise-progress-bar">
        <div class="exercise-progress-bar-fill" style="height:${(point.value / detail.maxChartValue) * 100}%"></div>
        <div class="exercise-progress-bar-label">${escapeHtml(point.label)}</div>
      </div>
    `).join("")
    : `<div class="empty-card">Log this exercise a few times to build the progress chart.</div>`;
  refs.exerciseProgressMetrics.innerHTML = detail.metrics.map((metric) => `
    <article class="metric-card">
      <div class="metric-value">${escapeHtml(metric.value)}</div>
      <div class="metric-label">${escapeHtml(metric.label)}</div>
    </article>
  `).join("");
  refs.exerciseProgressHistoryList.innerHTML = detail.history.length
    ? detail.history.map((entry) => {
      const summary = summarizeExerciseLog(entry);
      const effortPercent = getExerciseEffortPercent(entry);
      const metaLine = [
        entry.equipmentLabel,
        summary.reps != null ? `${summary.reps} reps` : "",
        formatLoggedExerciseSetTime(entry),
        formatLoggedExerciseRest(entry),
        effortPercent != null ? `${effortPercent}% effort` : ""
      ].filter(Boolean).join(" • ");
      return `
        <article class="list-card">
          <div class="list-row-top">
            <div>
              <div class="list-title">${escapeHtml(formatDate(entry.workoutDate, { day: "numeric", month: "short", year: "2-digit" }))}</div>
              <div class="list-meta">${escapeHtml(metaLine || "Logged")}</div>
            </div>
            <span class="small-tag">${summary.keyWeight != null ? escapeHtml(formatWeight(summary.keyWeight)) : escapeHtml(summary.reps != null ? `${summary.reps} reps` : "Logged")}</span>
          </div>
        </article>
      `;
    }).join("")
    : `<div class="empty-card">No history found for this filter yet.</div>`;
}

function formatSignedPercent(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return `${value > 0 ? "+" : ""}${formatNumber(value)}%`;
}

function formatMetricDelta(delta, metricType) {
  if (!Number.isFinite(delta)) {
    return "";
  }

  if (metricType === "weight") {
    return `${delta > 0 ? "+" : ""}${formatNumber(delta)} kg`;
  }

  return `${delta > 0 ? "+" : ""}${formatNumber(delta)} reps`;
}

function buildWorkoutProgressEntrySummary(entry, workoutId) {
  const current = summarizeExerciseLog(entry);
  const previous = getPreviousExerciseEntry(entry.name, { excludeWorkoutId: workoutId });
  const previousSummary = previous ? summarizeExerciseLog(previous) : null;
  const previousBest = getExercisePersonalBest(entry.name, { excludeWorkoutId: workoutId });
  const hasWeightComparison = current.keyWeight != null && previousSummary?.keyWeight != null;
  const hasRepComparison = current.reps != null && previousSummary?.reps != null;
  const metricType = hasWeightComparison ? "weight" : (hasRepComparison ? "reps" : null);
  const currentMetricValue = metricType === "weight"
    ? current.keyWeight
    : (metricType === "reps" ? current.reps : (current.keyWeight ?? current.reps ?? null));
  const previousMetricValue = metricType === "weight"
    ? previousSummary?.keyWeight
    : (metricType === "reps" ? previousSummary?.reps : null);
  const delta = currentMetricValue != null && previousMetricValue != null
    ? currentMetricValue - previousMetricValue
    : null;
  const deltaPercent = delta != null && previousMetricValue
    ? (delta / previousMetricValue) * 100
    : null;
  const trend = !previous
    ? "new"
    : delta == null
      ? "flat"
      : delta > 0.001
        ? "up"
        : delta < -0.001
          ? "down"
          : "flat";
  const currentLabel = current.keyWeight != null
    ? `${formatWeight(current.keyWeight)}${current.reps != null ? ` • ${current.reps} reps` : ""}`
    : current.reps != null
      ? `${current.reps} reps`
      : "Logged";
  const deltaLabel = !previous
    ? "First tracked session"
    : delta == null
      ? "Logged again today"
      : Math.abs(delta) < 0.001
        ? "Matched last time"
        : `${formatMetricDelta(delta, metricType)} • ${formatSignedPercent(deltaPercent)}`;
  const comparisonLabel = previous
    ? `Last time: ${previousSummary?.keyWeight != null
        ? `${formatWeight(previousSummary.keyWeight)}${previousSummary.reps != null ? ` • ${previousSummary.reps} reps` : ""}`
        : previousSummary?.reps != null
          ? `${previousSummary.reps} reps`
          : "logged"}`
    : "No previous comparison yet";

  return {
    name: entry.name,
    trend,
    currentLabel,
    deltaLabel,
    comparisonLabel,
    isPersonalBest: current.keyWeight != null && previousBest != null && current.keyWeight > previousBest
  };
}

function buildWorkoutProgressSummary(workout, { templateExerciseCount = 0 } = {}) {
  const entries = (workout.exerciseLogs || []).map((entry) => buildWorkoutProgressEntrySummary(entry, workout.id));
  const order = { up: 0, new: 1, flat: 2, down: 3 };
  entries.sort((a, b) => {
    if (order[a.trend] !== order[b.trend]) {
      return order[a.trend] - order[b.trend];
    }
    return a.name.localeCompare(b.name);
  });

  const comparableCount = entries.filter((entry) => entry.trend !== "new").length;
  const improvedCount = entries.filter((entry) => entry.trend === "up").length;
  const completionPercent = templateExerciseCount
    ? Math.round((Math.max(workout.exerciseLogs.length, 0) / templateExerciseCount) * 100)
    : 100;
  const progressPercent = comparableCount
    ? Math.round((improvedCount / comparableCount) * 100)
    : 0;
  const prCount = entries.filter((entry) => entry.isPersonalBest).length;

  return {
    title: workout.title,
    subtitle: entries.length
      ? (comparableCount
        ? `${improvedCount} of ${comparableCount} exercises moved up today`
        : "First benchmark for these exercises")
      : "Session saved. Add repeatable exercises to see lift progression here.",
    completionPercent: clamp(completionPercent, 0, 100),
    progressPercent: clamp(progressPercent, 0, 100),
    prCount,
    entries
  };
}

function renderWorkoutSummary() {
  const summary = ui.workoutSummary.data;
  const isVisible = ui.workoutSummary.visible && Boolean(summary);

  refs.workoutSummaryPanel.classList.toggle("hidden", !isVisible);

  if (!isVisible || !summary) {
    return;
  }

  refs.workoutSummaryTitle.textContent = summary.title || "Progress overview";
  refs.workoutSummarySubtitle.textContent = summary.subtitle || "See what moved today";
  refs.workoutSummaryCompletion.textContent = `${summary.completionPercent}% complete`;
  refs.workoutSummaryProgress.textContent = `${summary.progressPercent}% up`;
  refs.workoutSummaryPrs.textContent = `${summary.prCount} PR${summary.prCount === 1 ? "" : "s"}`;
  refs.workoutSummaryList.innerHTML = summary.entries.length
    ? summary.entries.map((entry) => `
      <button class="workout-summary-row is-${entry.trend}" type="button" data-open-exercise-progress="${escapeAttribute(entry.name)}">
        <div class="list-row-top">
          <div>
            <div class="list-title">${escapeHtml(entry.name)}</div>
            <div class="list-meta">${escapeHtml(entry.currentLabel)}</div>
          </div>
          <span class="small-tag">${escapeHtml(entry.deltaLabel)}</span>
        </div>
        <div class="helper-text">${escapeHtml(entry.comparisonLabel)}</div>
        ${entry.isPersonalBest ? `<div class="helper-text workout-summary-pr">New PR</div>` : ""}
      </button>
    `).join("")
    : `<div class="empty-card">No exercise progression to compare yet for this workout.</div>`;
}

function syncGuidedDraftToForm(index) {
  const draft = ui.guidedWorkout.exerciseDrafts[index];
  const card = [...refs.routineExerciseFields.querySelectorAll("[data-exercise-name]")][index];

  if (!draft || !card) {
    return;
  }

  const repsField = card.querySelector("[data-reps-picker]");
  const effortField = card.querySelector("[data-effort-percent]");
  const weightField = card.querySelector("[data-lift-weight]");
  const setTimeField = card.querySelector("[data-set-seconds]");
  const restField = card.querySelector("[data-rest-seconds]");
  const noteField = card.querySelector("[data-note]");
  const setList = card.querySelector("[data-set-list]");

  if (repsField) {
    repsField.value = draft.repsValue ?? "";
  }
  if (effortField) {
    effortField.value = draft.effortPercentValue ?? "";
  }
  if (weightField) {
    weightField.value = draft.weightValue ?? "";
  }
  card.dataset.defaultSetWeight = normalizedWeightValue(draft.weightValue ?? draft.targetWeight);
  card.dataset.defaultEffortPercent = normalizeSelectNumber(draft.effortPercentValue ?? draft.targetEffortPercent) != null
    ? String(normalizeSelectNumber(draft.effortPercentValue ?? draft.targetEffortPercent))
    : "";
  if (setTimeField) {
    setTimeField.value = draft.setSecondsValue ?? "";
    setTimeField.dataset.autoSetSeconds = String(inferSetSecondsFromTargetReps(draft.repsValue || draft.targetLogReps || draft.targetReps));
  }
  if (restField) {
    restField.value = draft.restTargetSecondsValue ?? "";
  }
  if (noteField) {
    noteField.value = draft.noteValue ?? "";
  }
  if (setList) {
      setList.innerHTML = buildExerciseSetRowsMarkup(
        draft.setLogs?.length ? draft.setLogs : buildExerciseSetDraftsFromTemplate(draft, {
          defaultWeight: normalizeSelectNumber(draft.weightValue) ?? draft.targetWeight,
          defaultSetSeconds: guidedExerciseSetTargetSeconds(draft),
          defaultRestSeconds: guidedExerciseRestTargetSeconds(draft),
          defaultEffortPercent: normalizeSelectNumber(draft.effortPercentValue) ?? draft.targetEffortPercent
        }),
        draft.targetReps,
        normalizeSelectNumber(draft.weightValue) ?? draft.targetWeight,
        guidedExerciseSetTargetSeconds(draft),
        guidedExerciseRestTargetSeconds(draft),
        normalizeSelectNumber(draft.effortPercentValue) ?? draft.targetEffortPercent
      );
    }

  if (draft.noteValue) {
    setExercisePanelOpen(card, "notes", true);
  }
  if (draft.setLogs?.length) {
    setExercisePanelOpen(card, "details", true);
  }
}

function syncAllGuidedDraftsToForm() {
  ui.guidedWorkout.exerciseDrafts.forEach((_, index) => {
    syncGuidedDraftToForm(index);
  });
}

function openGuidedWorkout() {
  const template = currentRoutineLogTemplate();
  if (!template?.exercises?.length) {
    showToast("Choose a routine with exercises first");
    return;
  }

  if (!ui.guidedWorkout.active) {
    ui.guidedWorkout = {
      ...createGuidedWorkoutState(),
      active: true,
      visible: true,
      introVisible: true,
      introDismissAt: Date.now() + 18000,
      paused: false,
      exerciseIndex: 0,
      enteredExerciseAt: null,
      templateTitle: template.title,
      templateSourceLabel: template.sourceLabel || template.title,
      templateKind: template.kind,
      exerciseDrafts: buildGuidedWorkoutDrafts(template)
    };
  } else {
    ui.guidedWorkout.renderedExerciseIndex = -1;
    ui.guidedWorkout.visible = true;
  }

  refs.guidedWorkoutPanel.scrollTo({ top: 0, behavior: "auto" });

  if (!ui.routineTimer.workoutRunning && !ui.routineTimer.hasMeasuredWorkoutTime) {
    startRoutineWorkoutTimer();
  } else {
    ensureRoutineTimerInterval();
  }

  renderGuidedWorkoutUI();
  updateWorkoutEditUI();
}

function closeGuidedWorkout() {
  if (!ui.guidedWorkout.active) {
    return;
  }

  ui.guidedWorkout.visible = false;
  renderGuidedWorkoutUI();
  updateWorkoutEditUI();
}

function clearGuidedWorkout() {
  ui.guidedWorkout = createGuidedWorkoutState();
  renderGuidedWorkoutUI();
  updateWorkoutEditUI();
}

function toggleGuidedWorkoutPause() {
  if (!ui.guidedWorkout.active) {
    return;
  }

  if (ui.guidedWorkout.paused) {
    if (ui.guidedWorkout.frozenExerciseElapsedSeconds != null) {
      ui.guidedWorkout.enteredExerciseAt = Date.now() - (ui.guidedWorkout.frozenExerciseElapsedSeconds * 1000);
      ui.guidedWorkout.frozenExerciseElapsedSeconds = null;
    }
    ui.guidedWorkout.paused = false;
  } else {
    ui.guidedWorkout.frozenExerciseElapsedSeconds = currentGuidedExerciseElapsedSeconds();
    ui.guidedWorkout.enteredExerciseAt = null;
    ui.guidedWorkout.paused = true;
  }
  renderGuidedWorkoutUI();
}

function goToGuidedExercise(index) {
  if (!ui.guidedWorkout.active) {
    return;
  }

  commitGuidedExerciseRest();
  const nextIndex = clamp(index, 0, ui.guidedWorkout.exerciseDrafts.length - 1);
  ui.guidedWorkout.exerciseIndex = nextIndex;
  ui.guidedWorkout.enteredExerciseAt = Date.now();
  ui.guidedWorkout.frozenExerciseElapsedSeconds = null;
  ui.guidedWorkout.paused = false;
  refs.guidedWorkoutPanel.scrollTo({ top: 0, behavior: "smooth" });
  renderGuidedWorkoutUI();
}

function advanceGuidedWorkout() {
  if (!ui.guidedWorkout.active) {
    return;
  }

  if (ui.guidedWorkout.exerciseIndex >= ui.guidedWorkout.exerciseDrafts.length - 1) {
    saveGuidedWorkout();
    return;
  }

  goToGuidedExercise(ui.guidedWorkout.exerciseIndex + 1);
}

function saveGuidedWorkout() {
  if (!ui.guidedWorkout.active) {
    return;
  }

  commitGuidedExerciseRest();
  syncAllGuidedDraftsToForm();
  refs.routineLogForm.requestSubmit();
}

function buildGuidedHistoryMarkup(exerciseName) {
  const history = getExerciseHistory(exerciseName, { limit: 4 });
  if (!history.length) {
    return `<div class="helper-text">No previous exercise log yet</div>`;
  }

  return `
    <div class="exercise-history">
      <div class="exercise-history-title">Recent weeks</div>
      ${history.map((entry) => `
        <div class="exercise-history-row">
          <div class="exercise-history-main">${escapeHtml(formatExerciseHistoryLine(entry))}</div>
          ${entry.note ? `<div class="exercise-history-note">${escapeHtml(entry.note)}</div>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function guidedWorkoutIsCaliContext(draft = currentGuidedWorkoutDraft()) {
  const text = [
    ui.guidedWorkout.templateTitle,
    draft?.name,
    draft?.templateNote,
    draft?.notes
  ].join(" ").toLowerCase();

  return ui.guidedWorkout.templateKind === "functional"
    || /\bcali|calisthenics|dead hang|human flag|handstand|hspu/.test(text);
}

function guidedWorkoutChatSuggestions(draft = currentGuidedWorkoutDraft()) {
  if (!draft) {
    return [];
  }

  if (guidedWorkoutIsCaliContext(draft)) {
    return [
      "Need the cali reminder",
      "Want the shortest useful version",
      "Shoulders feel cooked",
      "Want more volume"
    ];
  }

  if (/\bsquat|deadlift|rdl|hip thrust|leg press|split squat|lunge|ham/i.test(draft.name || "")) {
    return [
      "Legs feel heavy",
      "Want the shortest useful version",
      "Want to push heavier",
      "Need an easier option"
    ];
  }

  return [
    "Want the shortest useful version",
    "Shoulders feel cooked",
    "Want more push today",
    "Need an easier option"
  ];
}

function buildGuidedWorkoutCoachIntro(draft = currentGuidedWorkoutDraft()) {
  const exerciseName = draft?.name || "this exercise";
  const baseLine = `Talk to me during the session about how it feels or what you want, and I will keep the answer tied to ${exerciseName.toLowerCase()} plus the rest of this workout.`;

  if (guidedWorkoutIsCaliContext(draft)) {
    return `${baseLine} For cali today: bare tag en masse reps. Volume over pauser. Keep it faster and more efficient for what you actually need.`;
  }

  return `${baseLine} If you want the shortest useful version, say so and we will trim it down without losing the point of the day.`;
}

function pushGuidedWorkoutChatMessage(role, text) {
  if (!text) {
    return;
  }

  ui.guidedWorkout.chatMessages.push({
    id: uid(),
    role,
    text
  });
}

function ensureGuidedWorkoutChat(draft = currentGuidedWorkoutDraft()) {
  if (!draft || ui.guidedWorkout.chatMessages.length) {
    return;
  }

  pushGuidedWorkoutChatMessage("assistant", buildGuidedWorkoutCoachIntro(draft));
}

function buildGuidedWorkoutCoachReply(prompt, draft = currentGuidedWorkoutDraft()) {
  const raw = String(prompt || "").trim();
  const text = raw.toLowerCase();
  const exerciseName = draft?.name || "this exercise";
  const remainingExercises = Math.max(0, ui.guidedWorkout.exerciseDrafts.length - ui.guidedWorkout.exerciseIndex - 1);
  const lines = [];
  const caliContext = guidedWorkoutIsCaliContext(draft);

  if (caliContext && (lines.length === 0 || /\bcali|volume|reps|paus|rest|dense|efficien|hurtig|remind/.test(text))) {
    lines.push("For cali today: bare tag en masse reps. Volume over pauser. Keep it dense and useful instead of stretching the session with long rests.");
  }

  if (/\bshort|shorter|quick|busy|time|efficient|kort|hurtig|trim/.test(text)) {
    lines.push(`Make ${exerciseName.toLowerCase()} the anchor, then keep only one support move if you still want it. Shortest useful version beats finishing everything slowly.`);
  }

  if (/\bshoulder|shoulders|wrist|wrists|back|lats?|pain|hurt|cooked|irritat|øm|sore/.test(text)) {
    lines.push("Keep the reps clean and strip out the flashy stuff. If the joints feel off, stop chasing skill or heavy pressing and bias rows, core, or just end the upper work earlier.");
  }

  if (/\blegs?|glutes?|quads?|hams?|fried|dead|flat|tired|heavy/.test(text)) {
    lines.push("Treat today like a quality-control day, not a hero day. Keep the first important sets sharp, lower the accessory cost, and do not force speed if the legs feel boxed in.");
  }

  if (/\bheavy|heavier|push|strong|stronger|pr|max|load/.test(text)) {
    lines.push("Put the intent into the first anchor lift only. Accessories should stay clean, controlled, and 1 to 2 reps away from the grind.");
  }

  if (/\bvolume|reps|pump|more|many|dens/.test(text) && !caliContext) {
    lines.push("Bias total reps and shorter rests on the easier movements, not failure-chasing on the first lift. More work only counts if the quality stays high.");
  }

  if (/\bskip|change|swap|another|different/.test(text)) {
    lines.push(`You can pivot. Start a different session or cut this one down; there ${remainingExercises === 1 ? "is" : "are"} still ${remainingExercises} exercise${remainingExercises === 1 ? "" : "s"} after this, so protecting the whole workout matters more than forcing one piece.`);
  }

  if (!lines.length) {
    lines.push(caliContext
      ? "Keep this cali touch simple: accumulate good reps, keep rest honest, and leave before it turns into filler."
      : `I would keep ${exerciseName.toLowerCase()} clean and useful, then let the rest of the workout match how you actually feel instead of what looked perfect on paper.`);
  }

  return lines.slice(0, 3).join(" ");
}

function scrollGuidedChatThreadToBottom() {
  if (!refs.guidedChatThread) {
    return;
  }

  refs.guidedChatThread.scrollTop = refs.guidedChatThread.scrollHeight;
}

function renderGuidedWorkoutChat(draft = currentGuidedWorkoutDraft()) {
  if (!draft) {
    return;
  }

  ensureGuidedWorkoutChat(draft);
  refs.guidedChatContext.textContent = `${draft.name || "Exercise"} • ${ui.guidedWorkout.exerciseIndex + 1}/${ui.guidedWorkout.exerciseDrafts.length}`;
  refs.guidedChatSuggestions.innerHTML = guidedWorkoutChatSuggestions(draft).map((prompt) => `
    <button class="guided-chat-chip" type="button" data-guided-chat-prompt="${escapeAttribute(prompt)}">${escapeHtml(prompt)}</button>
  `).join("");
  refs.guidedChatThread.innerHTML = ui.guidedWorkout.chatMessages.length
    ? ui.guidedWorkout.chatMessages.map((message) => `
      <article class="guided-chat-message ${message.role === "user" ? "is-user" : ""}">
        <div class="guided-chat-role">${message.role === "user" ? "You" : "Coach"}</div>
        <div class="guided-chat-text">${escapeHtml(message.text)}</div>
      </article>
    `).join("")
    : `<div class="guided-chat-empty helper-text">Talk through how it feels and what you want from the session.</div>`;
  refs.guidedChatInput.value = ui.guidedWorkout.chatInputValue || "";
  scrollGuidedChatThreadToBottom();
}

function submitGuidedWorkoutChat(prompt = refs.guidedChatInput?.value || "") {
  const draft = currentGuidedWorkoutDraft();
  const text = String(prompt || "").trim();
  if (!draft || !text) {
    return;
  }

  pushGuidedWorkoutChatMessage("user", text);
  pushGuidedWorkoutChatMessage("assistant", buildGuidedWorkoutCoachReply(text, draft));
  ui.guidedWorkout.chatInputValue = "";
  refs.guidedChatInput.value = "";
  renderGuidedWorkoutChat(draft);
}

function renderGuidedWorkoutUI() {
  const draft = currentGuidedWorkoutDraft();
  const isVisible = ui.guidedWorkout.active && ui.guidedWorkout.visible && ui.logMode === "routine" && ui.screen === "log";
  const shouldRefreshContent = ui.guidedWorkout.renderedExerciseIndex !== ui.guidedWorkout.exerciseIndex;
  const stage = refs.guidedWorkoutPanel.querySelector(".guided-workout-stage");

  if (
    ui.guidedWorkout.introVisible
    && ui.guidedWorkout.introDismissAt
    && Date.now() >= ui.guidedWorkout.introDismissAt
  ) {
    ui.guidedWorkout.introVisible = false;
    ui.guidedWorkout.introDismissAt = null;
    if (!ui.guidedWorkout.enteredExerciseAt) {
      ui.guidedWorkout.enteredExerciseAt = Date.now();
    }
  }

  const showIntro = isVisible && ui.guidedWorkout.introVisible;

  refs.guidedWorkoutPanel.classList.toggle("hidden", !isVisible);
  refs.guidedOverviewPanel.classList.toggle("hidden", !showIntro);
  stage?.classList.toggle("hidden", showIntro);
  refs.guidedTrackingSheet.classList.toggle("hidden", showIntro);
  refs.startGuidedWorkout.textContent = ui.guidedWorkout.active ? "Return to workout" : "Start workout flow";

  if (!ui.guidedWorkout.active || !draft) {
    return;
  }

  const kind = sessionKinds[ui.guidedWorkout.templateKind] || sessionKinds.strength;
  const needsLiftFields = exerciseNeedsLiftFields(draft, ui.guidedWorkout.templateKind);
  const phase = buildGuidedExercisePhaseState(draft);
  const {
    defaultRestSeconds,
    currentPhase,
    currentPhaseIndex,
    phaseCount,
    plannedWorkSeconds,
    plannedRestSeconds,
    inBreakPhase,
    remainingSeconds,
    extraSeconds,
    progressRatio,
    canSkipCurrentPhaseEarly,
    skipActionLabel,
    currentPhaseTitle
  } = phase;
  const phaseBudgetSeconds = currentPhase?.durationSeconds || 0;
  const phaseCounterLabel = currentPhaseIndex >= 0 ? `${currentPhaseIndex + 1}/${phaseCount}` : "";
  const phaseStatusText = currentPhase
    ? (ui.guidedWorkout.paused
      ? `Paused • ${currentPhaseTitle}`
      : extraSeconds
        ? `${currentPhaseTitle} finished • +${formatTimerClock(extraSeconds, { showHours: false })} extra`
        : remainingSeconds > 0
          ? `${currentPhaseTitle} • ${formatTimerClock(remainingSeconds, { showHours: false })} left`
          : `${currentPhaseTitle} complete • move on when ready`)
    : "Add set and break times to guide this exercise.";
  const displayEffort = normalizeSelectNumber(draft.effortPercentValue) ?? draft.targetEffortPercent;
  const displayReps = normalizeSelectNumber(draft.repsValue) ?? draft.targetLogReps;
  const displayWeight = normalizeSelectNumber(draft.weightValue) ?? draft.targetWeight;
  const equipmentLabel = inferExerciseEquipmentLabel(draft);
  const heroSecondaryValue = needsLiftFields
    ? (displayWeight != null ? formatWeight(displayWeight) : "--")
    : (displayEffort != null ? `${displayEffort}%` : "--");

  refs.guidedOverviewTitle.textContent = ui.guidedWorkout.templateTitle || "Workout";
  refs.guidedOverviewKind.textContent = kind.label;
  refs.guidedOverviewKind.style.background = kind.color;
  refs.guidedOverviewEquipment.textContent = summarizeRoutineEquipment(ui.guidedWorkout.exerciseDrafts);
  refs.guidedOverviewSource.textContent = ui.guidedWorkout.templateSourceLabel || "Routine overview";
  refs.guidedOverviewList.innerHTML = buildGuidedOverviewListMarkup(ui.guidedWorkout.exerciseDrafts);
  refs.guidedWorkoutKicker.textContent = ui.guidedWorkout.paused
    ? "Paused in log"
    : (ui.guidedWorkout.templateSourceLabel || "Workout flow");
  refs.guidedWorkoutTitle.textContent = ui.guidedWorkout.templateTitle || "Workout";
  refs.guidedExerciseProgress.textContent = `Exercise ${ui.guidedWorkout.exerciseIndex + 1} of ${ui.guidedWorkout.exerciseDrafts.length}`;
  refs.guidedSessionTimer.textContent = formatTimerClock(currentWorkoutElapsedSeconds(), { showHours: true });
  refs.guidedSessionEffort.textContent = displayEffort != null ? `${displayEffort}%` : "--%";
  refs.guidedStageMeterLabel.textContent = currentPhase
    ? `${inBreakPhase ? "Break" : "Set"} ${phaseCounterLabel}`
    : "Timer";
  refs.guidedExerciseTimer.textContent = extraSeconds
    ? `+${formatTimerClock(extraSeconds, { showHours: false })}`
    : formatTimerClock(remainingSeconds, { showHours: phaseBudgetSeconds >= 3600 });
  refs.guidedExerciseName.textContent = draft.name || "Exercise";
  refs.guidedExerciseTarget.textContent = `${draft.targetSets} sets • ${draft.targetReps || "-"} • ${formatDurationCompact(plannedWorkSeconds)} work / ${formatDurationCompact(plannedRestSeconds)} break`;
  refs.guidedExerciseKind.textContent = kind.label;
  refs.guidedExerciseKind.style.background = kind.color;
  refs.guidedHeroReps.textContent = displayReps != null ? `${displayReps}` : "--";
  refs.guidedHeroSecondaryLabel.textContent = needsLiftFields ? "weight" : "effort";
  refs.guidedHeroSecondaryValue.textContent = heroSecondaryValue;
  refs.guidedExerciseEquipment.textContent = equipmentLabel;
  refs.guidedStageMeterRing.style.setProperty("--guided-meter-progress", `${progressRatio}`);
  refs.guidedStageMeterRing.classList.toggle("is-overrun", extraSeconds > 0);
  refs.guidedExerciseStatus.textContent = phaseStatusText;
  refs.guidedExerciseTemplateNote.textContent = draft.templateNote || "";
  refs.guidedExerciseTemplateNote.classList.toggle("hidden", !draft.templateNote);
  refs.guidedWorkoutPause.textContent = ui.guidedWorkout.paused ? "Resume" : "Pause";
  refs.guidedPrevExercise.disabled = ui.guidedWorkout.exerciseIndex === 0;
  refs.guidedSkipBreak.classList.toggle("hidden", !canSkipCurrentPhaseEarly || showIntro);
  refs.guidedSkipBreak.textContent = skipActionLabel;
  refs.guidedSkipPhase.classList.toggle("hidden", !canSkipCurrentPhaseEarly || showIntro);
  refs.guidedSkipPhase.textContent = skipActionLabel;
  refs.guidedNextExercise.textContent = ui.guidedWorkout.exerciseIndex === ui.guidedWorkout.exerciseDrafts.length - 1
    ? "Finish workout"
    : "Next exercise";
  refs.guidedChatPanel.classList.toggle("hidden", showIntro);

  if (shouldRefreshContent) {
    refs.guidedWorkoutFields.innerHTML = buildExerciseRollerFieldsMarkup({
      exercise: {
        ...draft,
        notes: draft.templateNote
      },
      sessionKind: ui.guidedWorkout.templateKind,
      repsValue: draft.repsValue ?? "",
      effortPercent: draft.effortPercentValue ?? "",
      weightValue: draft.weightValue ?? "",
      setSeconds: draft.setSecondsValue ?? guidedExerciseSetTargetSeconds(draft),
      restSeconds: draft.restTargetSecondsValue ?? defaultRestSeconds,
      lastWeight: normalizeSelectNumber(draft.weightValue) ?? draft.targetWeight ?? getLastWeight(draft.name)
    });

    refs.guidedHistoryPanel.innerHTML = buildGuidedHistoryMarkup(draft.name);
    refs.guidedNoteInput.value = draft.noteValue ?? "";
    refs.guidedSetList.innerHTML = buildExerciseSetRowsMarkup(
      draft.setLogs?.length ? draft.setLogs : buildExerciseSetDraftsFromTemplate(draft, {
        defaultWeight: normalizeSelectNumber(draft.weightValue) ?? draft.targetWeight,
        defaultSetSeconds: guidedExerciseSetTargetSeconds(draft),
        defaultRestSeconds: guidedExerciseRestTargetSeconds(draft),
        defaultEffortPercent: normalizeSelectNumber(draft.effortPercentValue) ?? draft.targetEffortPercent
      }),
      draft.targetReps,
      normalizeSelectNumber(draft.weightValue) ?? draft.targetWeight,
      guidedExerciseSetTargetSeconds(draft),
      guidedExerciseRestTargetSeconds(draft),
      normalizeSelectNumber(draft.effortPercentValue) ?? draft.targetEffortPercent
    );
    renderGuidedWorkoutChat(draft);
    ui.guidedWorkout.renderedExerciseIndex = ui.guidedWorkout.exerciseIndex;
  }
}

function handleGuidedWorkoutClick(event) {
  const panelButton = event.target.closest("[data-guided-panel]");
  const removeSetButton = event.target.closest("[data-remove-set]");
  const addFollowupButton = event.target.closest("[data-add-followup-set]");

  if (panelButton) {
    const panelName = panelButton.dataset.guidedPanel;
    const openFromStage = Boolean(panelButton.closest(".guided-stage-tools"));

    if (openFromStage) {
      setGuidedPanelOpen(panelName, true);
      scrollGuidedTrackingIntoView();
    } else {
      toggleGuidedPanel(panelName);
    }
    return;
  }

  if (addFollowupButton) {
    const row = addFollowupButton.closest("[data-set-row]");
    appendExerciseFollowupRow(row, {
      defaultWeight: normalizeSelectNumber(currentGuidedWorkoutDraft()?.weightValue) ?? currentGuidedWorkoutDraft()?.targetWeight,
      defaultSetSeconds: guidedExerciseSetTargetSeconds(currentGuidedWorkoutDraft()),
      defaultRestSeconds: guidedExerciseRestTargetSeconds(currentGuidedWorkoutDraft()),
      defaultEffortPercent: normalizeSelectNumber(currentGuidedWorkoutDraft()?.effortPercentValue) ?? currentGuidedWorkoutDraft()?.targetEffortPercent
    });
    syncGuidedSetLogsFromPanel();
    return;
  }

  if (removeSetButton) {
    removeExerciseSetRow(removeSetButton.closest("[data-set-row]"));
    if (!refs.guidedSetList.children.length) {
      appendExerciseSetRow(refs.guidedSetList, {
        targetReps: currentGuidedWorkoutDraft()?.targetReps || "",
        defaultWeight: normalizeSelectNumber(currentGuidedWorkoutDraft()?.weightValue) ?? currentGuidedWorkoutDraft()?.targetWeight,
        defaultSetSeconds: guidedExerciseSetTargetSeconds(currentGuidedWorkoutDraft()),
        defaultRestSeconds: guidedExerciseRestTargetSeconds(currentGuidedWorkoutDraft()),
        defaultEffortPercent: normalizeSelectNumber(currentGuidedWorkoutDraft()?.effortPercentValue) ?? currentGuidedWorkoutDraft()?.targetEffortPercent
      });
    }
    renumberExerciseSetRows(refs.guidedSetList);
    syncGuidedSetLogsFromPanel();
  }
}

function handleGuidedWorkoutChange(event) {
  const draft = currentGuidedWorkoutDraft();
  if (!draft) {
    return;
  }

  const previousSetSeconds = guidedExerciseSetTargetSeconds(draft);
  const previousRestSeconds = guidedExerciseRestTargetSeconds(draft);

  if (event.target.matches("[data-reps-picker]")) {
    const previousAutoSetSeconds = inferSetSecondsFromExercise({
      ...draft,
      targetLogReps: draft.repsValue || draft.targetLogReps,
      targetReps: draft.targetReps
    });
    draft.repsValue = event.target.value;
    const nextAutoSetSeconds = inferSetSecondsFromExercise({
      ...draft,
      targetLogReps: draft.repsValue || draft.targetLogReps,
      targetReps: draft.targetReps
    });
    const currentSetSeconds = normalizeSelectNumber(draft.setSecondsValue);
    if (currentSetSeconds == null || (previousAutoSetSeconds != null && Math.abs(currentSetSeconds - previousAutoSetSeconds) < 0.001)) {
      draft.setSecondsValue = nextAutoSetSeconds != null ? String(nextAutoSetSeconds) : "";
      syncSetTimingInputs(refs.guidedSetList, {
        nextSetSeconds: draft.setSecondsValue,
        nextRestSeconds: previousRestSeconds
      });
      syncGuidedSetLogsFromPanel();
    }
  }
  if (event.target.matches("[data-effort-percent]")) {
    const previousEffortPercent = draft.effortPercentValue;
    draft.effortPercentValue = event.target.value;
    syncSetEffortInputs(refs.guidedSetList, {
      nextEffortPercent: draft.effortPercentValue,
      previousEffortPercent
    });
    syncGuidedSetLogsFromPanel();
  }
  if (event.target.matches("[data-lift-weight]")) {
    const previousWeight = draft.weightValue;
    draft.weightValue = event.target.value;
    draft.setLogs = applySuggestedWeightToSetLogs(
      draft.setLogs,
      {
        nextWeight: draft.weightValue,
        previousWeight,
        targetSets: draft.targetSets
      }
    );
  }
  if (event.target.matches("[data-set-seconds]")) {
    draft.setSecondsValue = event.target.value;
    syncSetTimingInputs(refs.guidedSetList, {
      nextSetSeconds: draft.setSecondsValue,
      nextRestSeconds: previousRestSeconds
    });
    syncGuidedSetLogsFromPanel();
    ui.guidedWorkout.frozenExerciseElapsedSeconds = null;
    ui.guidedWorkout.enteredExerciseAt = Date.now();
  }
  if (event.target.matches("[data-rest-seconds]")) {
    draft.restTargetSecondsValue = event.target.value;
    syncSetTimingInputs(refs.guidedSetList, {
      nextSetSeconds: previousSetSeconds,
      nextRestSeconds: draft.restTargetSecondsValue
    });
    syncGuidedSetLogsFromPanel();
    ui.guidedWorkout.frozenExerciseElapsedSeconds = null;
    ui.guidedWorkout.enteredExerciseAt = Date.now();
  }
  if (event.target.matches("[data-set-weight], [data-set-reps], [data-set-effort-percent], [data-set-log-seconds], [data-set-log-rest-seconds]")) {
    syncGuidedSetLogsFromPanel();
    if (event.target.matches("[data-set-log-seconds], [data-set-log-rest-seconds]")) {
      ui.guidedWorkout.frozenExerciseElapsedSeconds = null;
      ui.guidedWorkout.enteredExerciseAt = Date.now();
    }
  }

  syncGuidedDraftToForm(ui.guidedWorkout.exerciseIndex);
  renderGuidedWorkoutUI();
}

function handleGuidedWorkoutInput(event) {
  const draft = currentGuidedWorkoutDraft();
  if (!draft) {
    return;
  }

  if (event.target === refs.guidedNoteInput) {
    draft.noteValue = refs.guidedNoteInput.value.trim();
    syncGuidedDraftToForm(ui.guidedWorkout.exerciseIndex);
  }

  if (event.target.matches("[data-set-weight], [data-set-reps], [data-set-effort-percent], [data-set-log-seconds], [data-set-log-rest-seconds]")) {
    syncGuidedSetLogsFromPanel();
  }
}

function syncGuidedSetLogsFromPanel() {
  const draft = currentGuidedWorkoutDraft();
  if (!draft) {
    return;
  }

  draft.setLogs = collectExerciseSetLogsFromContainer(refs.guidedSetList, { includeUntouched: true });
  syncGuidedDraftToForm(ui.guidedWorkout.exerciseIndex);
}

function appendGuidedSetRow() {
  const draft = currentGuidedWorkoutDraft();
  if (!draft) {
    return;
  }

  appendExerciseSetRow(refs.guidedSetList, {
    targetReps: draft.targetReps || "",
    defaultWeight: normalizeSelectNumber(draft.weightValue) ?? draft.targetWeight,
    defaultSetSeconds: guidedExerciseSetTargetSeconds(draft),
    defaultRestSeconds: guidedExerciseRestTargetSeconds(draft),
    defaultEffortPercent: normalizeSelectNumber(draft.effortPercentValue) ?? draft.targetEffortPercent
  });
  syncGuidedSetLogsFromPanel();
}

function handleRoutineExerciseFieldChange(event) {
  const card = event.target.closest("[data-exercise-name]");
  if (!card) {
    return;
  }

  const setList = card.querySelector("[data-set-list]");

  if (event.target.matches("[data-reps-picker]")) {
    syncExerciseCardSetTime(card);
    syncSetTimingInputs(setList, {
      nextSetSeconds: currentExerciseCardSetSeconds(card),
      nextRestSeconds: currentExerciseCardRestSeconds(card)
    });
  }

  if (event.target.matches("[data-lift-weight]")) {
    const previousWeight = card.dataset.defaultSetWeight || "";
    const nextWeight = event.target.value;

    syncSetWeightInputs(setList, {
      nextWeight,
      previousWeight
    });
    card.dataset.defaultSetWeight = normalizedWeightValue(nextWeight);
  }

  if (event.target.matches("[data-effort-percent]")) {
    const previousEffortPercent = card.dataset.defaultEffortPercent || "";
    const nextEffortPercent = event.target.value;

    syncSetEffortInputs(setList, {
      nextEffortPercent,
      previousEffortPercent
    });
    card.dataset.defaultEffortPercent = normalizeSelectNumber(nextEffortPercent) != null
      ? String(normalizeSelectNumber(nextEffortPercent))
      : "";
  }

  if (event.target.matches("[data-set-seconds], [data-rest-seconds]")) {
    syncSetTimingInputs(setList, {
      nextSetSeconds: currentExerciseCardSetSeconds(card),
      nextRestSeconds: currentExerciseCardRestSeconds(card)
    });
  }

  if (event.target.matches("[data-set-seconds], [data-rest-seconds], [data-reps-picker], [data-set-log-seconds], [data-set-log-rest-seconds]")) {
    renderRoutineTimerUI();
  }
}

function setGuidedPanelOpen(panelName, isOpen) {
  const panel = refs.guidedWorkoutPanel.querySelector(`[data-guided-panel-view="${panelName}"]`);
  const buttons = [...refs.guidedWorkoutPanel.querySelectorAll(`[data-guided-panel="${panelName}"]`)];

  if (!panel || !buttons.length) {
    return;
  }

  panel.classList.toggle("hidden", !isOpen);
  buttons.forEach((button) => {
    button.classList.toggle("is-open", isOpen);
  });
}

function toggleGuidedPanel(panelName) {
  const panel = refs.guidedWorkoutPanel.querySelector(`[data-guided-panel-view="${panelName}"]`);
  if (!panel) {
    return;
  }

  const nextOpen = panel.classList.contains("hidden");
  setGuidedPanelOpen(panelName, nextOpen);
}

function openScreen(screen) {
  ui.screen = screen;
  refs.screens.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.screen === screen);
  });
  refs.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.screenTarget === screen);
  });
  if (
    screen === "log"
    && ui.logMode === "quick"
    && !ui.editingWorkoutId
    && !ui.routineTimer.workoutRunning
    && !ui.routineTimer.hasMeasuredWorkoutTime
  ) {
    startRoutineWorkoutTimer();
  }
  renderGuidedWorkoutUI();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderLogMode() {
  refs.logModeButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.logMode === ui.logMode);
  });
  refs.routineLogForm.classList.toggle("hidden", ui.logMode !== "routine");
  refs.quickLogForm.classList.toggle("hidden", ui.logMode !== "quick");
  renderLogPlanner();
  renderRoutineTimerUI();
  renderGuidedWorkoutUI();
  updateWorkoutEditUI();
}

function renderPhotoImportUI() {
  const hasContent = Boolean(ui.photoImport.imageUrl || ui.photoImport.recognizedText || ui.photoImport.processing);
  const canApply = Boolean(ui.photoImport.draft && !ui.photoImport.processing);
  const summary = ui.photoImport.draft;

  refs.photoImportClear.classList.toggle("hidden", !hasContent);
  refs.photoImportStatus.classList.toggle("hidden", !ui.photoImport.status);
  refs.photoImportStatus.textContent = ui.photoImport.status;
  refs.photoImportStatus.classList.toggle("is-error", ui.photoImport.statusTone === "error");
  refs.photoImportStatus.classList.toggle("is-success", ui.photoImport.statusTone === "success");
  refs.photoImportResult.classList.toggle("hidden", !hasContent);

  if (ui.photoImport.imageUrl) {
    refs.photoImportPreview.src = ui.photoImport.imageUrl;
    refs.photoImportPreview.classList.remove("hidden");
  } else {
    refs.photoImportPreview.removeAttribute("src");
    refs.photoImportPreview.classList.add("hidden");
  }

  refs.photoImportApply.disabled = !canApply;
  refs.photoImportApply.textContent = summary
    ? (summary.importMode === "routine" ? "Load into strength log" : "Load into quick log")
    : "Use in log";

  refs.photoImportSummary.innerHTML = summary
    ? buildPhotoImportSummaryMarkup(summary)
    : buildEmptyCard(
        hasContent ? "Keep editing the recognized text" : "No scan loaded yet",
        hasContent
          ? "As soon as the text looks right, PulseBoard will turn it into a workout draft."
          : "Choose a photo and the app will try to classify the workout and capture the useful details."
      );
}

function updateWorkoutEditUI() {
  const editing = Boolean(ui.editingWorkoutId);
  const workout = editing ? state.workouts.find((item) => item.id === ui.editingWorkoutId) : null;
  const template = currentRoutineLogTemplate();
  const label = workout ? `Editing ${workout.title}` : "Editing workout";
  const routineSubmitLabel = template?.sourceType === "planned"
    ? "planned session"
    : template?.sourceType === "photo"
      ? "imported session"
      : "routine session";

  refs.quickLogEditNote.textContent = `${label}. Save to update the existing log.`;
  refs.routineLogEditNote.textContent = `${label}. Save to update the existing log.`;

  refs.quickLogEditNote.classList.toggle("hidden", !(editing && ui.logMode === "quick"));
  refs.routineLogEditNote.classList.toggle("hidden", !(editing && ui.logMode === "routine"));
  refs.quickLogSubmit.textContent = editing && ui.logMode === "quick" ? "Update quick session" : "Save quick session";
  refs.routineLogSubmit.textContent = editing && ui.logMode === "routine"
    ? `Update ${routineSubmitLabel}`
    : `Save ${routineSubmitLabel}`;
  refs.cancelQuickWorkoutEdit.classList.toggle("hidden", !(editing && ui.logMode === "quick"));
  refs.cancelRoutineWorkoutEdit.classList.toggle("hidden", !(editing && ui.logMode === "routine"));
  refs.startGuidedWorkout.textContent = ui.guidedWorkout.active ? "Return to workout" : "Start workout flow";
}

function resetQuickLogForm() {
  refs.quickLogForm.reset();
  refs.quickDate.value = todayISO();
  refs.quickDuration.value = 60;
  refs.quickIntensity.value = 3;
  setQuickAreasFromKind(refs.quickKind.value);
  renderChipGroup(refs.quickAreas, ui.quickAreas, "quick");
}

function resetRoutineLogForm({ keepTemplate = false, autoStartTimer = false } = {}) {
  if (!keepTemplate) {
    clearRoutineLogTemplate();
  }

  clearGuidedWorkout();
  resetRoutineTimerState({ autoStart: autoStartTimer });
  refs.routineLogDate.value = todayISO();
  refs.routineLogIntensity.value = 3;
  refs.routineLogNotes.value = "";
  syncRoutineLogForm({ fromSelection: true });
}

function cancelWorkoutEdit() {
  ui.editingWorkoutId = null;
  resetQuickLogForm();
  resetRoutineLogForm();
  updateWorkoutEditUI();
}

function startRoutineLog(routineId) {
  const routine = state.routines.find((item) => item.id === routineId);
  if (!routine) {
    showToast("That routine is not available");
    return;
  }

  cancelWorkoutEdit();
  clearRoutineLogTemplate();
  ui.logMode = "routine";
  renderLogMode();
  openScreen("log");
  refs.routineLogSelect.value = routineId;
  syncRoutineLogForm({ fromSelection: true });
  refs.routineLogDate.value = todayISO();
  resetRoutineTimerState({ autoStart: true });
  updateWorkoutEditUI();
}

function startPlannedSessionLog(sessionId) {
  const record = findPlannedSessionRecord(sessionId);
  if (!record) {
    showToast("That planned session is not available");
    return;
  }

  const template = buildRoutineLogTemplateFromPlannedSession(record);
  if (!template) {
    showToast("That planned session is not ready to log");
    return;
  }

  cancelWorkoutEdit();

  if (!template.exercises.length) {
    ui.logMode = "quick";
    renderLogMode();
    openScreen("log");
    resetRoutineTimerState({ autoStart: true });
    refs.quickKind.value = template.kind;
    refs.quickDate.value = todayISO();
    refs.quickDuration.value = template.estimatedMinutes || 60;
    refs.quickIntensity.value = 3;
    refs.quickTitle.value = template.title;
    refs.quickMetric.value = "";
    refs.quickNotes.value = template.notes || "";
    ui.quickAreas = new Set(defaultAreasForKind(template.kind));
    renderChipGroup(refs.quickAreas, ui.quickAreas, "quick");
    updateWorkoutEditUI();
    return;
  }

  setRoutineLogTemplate(template);
  ui.logMode = "routine";
  renderLogMode();
  openScreen("log");
  refreshRoutineLogOptions();
  refs.routineLogDate.value = todayISO();
  refs.routineLogNotes.value = template.notes || "";
  resetRoutineTimerState({ autoStart: true });
  updateWorkoutEditUI();
}

function startWorkoutEdit(workoutId) {
  const workout = state.workouts.find((item) => item.id === workoutId);
  if (!workout) {
    return;
  }

  clearGuidedWorkout();
  ui.editingWorkoutId = workoutId;
  openScreen("log");

  if (workout.plannedSessionId || (Array.isArray(workout.templateExercises) && workout.templateExercises.length)) {
    ui.logMode = "routine";
    setRoutineLogTemplate(buildRoutineLogTemplateFromWorkout(workout));
    renderLogMode();
    refreshRoutineLogOptions();
    refs.routineLogDate.value = workout.date || todayISO();
    refs.routineLogDuration.value = workout.durationMinutes || 0;
    refs.routineLogIntensity.value = workout.intensity || 3;
    refs.routineLogNotes.value = workout.notes || "";
    ui.routineAreas = new Set(workout.loadedAreas || defaultAreasForKind(workout.kind));
    renderChipGroup(refs.routineAreas, ui.routineAreas, "routine");
    loadRoutineTimerFromWorkout(workout);
    populateRoutineExerciseFieldsFromLogs(workout.exerciseLogs || []);
  } else if (workout.routineId && state.routines.some((item) => item.id === workout.routineId)) {
    clearRoutineLogTemplate();
    ui.logMode = "routine";
    renderLogMode();
    refs.routineLogSelect.value = workout.routineId;
    syncRoutineLogForm({ fromSelection: true });
    refs.routineLogDate.value = workout.date || todayISO();
    refs.routineLogDuration.value = workout.durationMinutes || 0;
    refs.routineLogIntensity.value = workout.intensity || 3;
    refs.routineLogNotes.value = workout.notes || "";
    ui.routineAreas = new Set(workout.loadedAreas || []);
    renderChipGroup(refs.routineAreas, ui.routineAreas, "routine");
    loadRoutineTimerFromWorkout(workout);
    populateRoutineExerciseFieldsFromLogs(workout.exerciseLogs || []);
  } else {
    clearRoutineLogTemplate();
    ui.logMode = "quick";
    renderLogMode();
    loadRoutineTimerFromWorkout(workout);
    refs.quickKind.value = workout.kind;
    refs.quickDate.value = workout.date || todayISO();
    refs.quickDuration.value = workout.durationMinutes || 0;
    refs.quickIntensity.value = workout.intensity || 3;
    refs.quickTitle.value = workout.title || "";
    refs.quickMetric.value = workout.primaryMetric || "";
    refs.quickNotes.value = workout.notes || "";
    ui.quickAreas = new Set(workout.loadedAreas || defaultAreasForKind(workout.kind));
    renderChipGroup(refs.quickAreas, ui.quickAreas, "quick");
  }

  updateWorkoutEditUI();
}

function populateRoutineExerciseFieldsFromLogs(exerciseLogs = []) {
  const entriesByName = new Map(exerciseLogs.map((entry) => [entry.name.toLowerCase(), entry]));

  [...refs.routineExerciseFields.querySelectorAll("[data-exercise-name]")].forEach((card) => {
    const entry = entriesByName.get(card.dataset.exerciseName.toLowerCase());
    if (!entry) {
      return;
    }

    const summary = summarizeExerciseLog(entry);
    const repsField = card.querySelector("[data-reps-picker]");
    if (repsField) {
      repsField.value = summary.reps ?? "";
    }
    const effortField = card.querySelector("[data-effort-percent]");
    if (effortField) {
      effortField.value = getExerciseEffortPercent(entry) ?? "";
    }
    card.dataset.defaultEffortPercent = normalizeSelectNumber(getExerciseEffortPercent(entry)) != null
      ? String(normalizeSelectNumber(getExerciseEffortPercent(entry)))
      : "";
    card.querySelector("[data-note]").value = entry.note ?? "";
    const liftWeightField = card.querySelector("[data-lift-weight]");
    if (liftWeightField) {
      liftWeightField.value = entry.keyWeight ?? summary.keyWeight ?? "";
    }
    const setTimeField = card.querySelector("[data-set-seconds]");
    if (setTimeField) {
      setTimeField.value = entry.setSeconds ?? "";
    }
    card.dataset.defaultSetWeight = normalizedWeightValue(liftWeightField?.value);
    const restField = card.querySelector("[data-rest-seconds]");
    if (restField) {
      restField.value = entry.restSeconds ?? "";
    }
    syncExerciseCardSetTime(card);
    const setList = card.querySelector("[data-set-list]");
    if (setList) {
      setList.innerHTML = buildExerciseSetRowsMarkup(
        getExerciseSetLogs(entry, { fallbackReps: card.dataset.targetReps || "" }),
        card.dataset.targetReps || "",
        summary.keyWeight ?? entry.keyWeight ?? null,
        entry.setSeconds ?? "",
        entry.restSeconds ?? "",
        getExerciseEffortPercent(entry) ?? ""
      );
    }
    if (entry.note) {
      setExercisePanelOpen(card, "notes", true);
    }
    if (Array.isArray(entry.setLogs) && entry.setLogs.length) {
      setExercisePanelOpen(card, "details", true);
    }
  });
}

function appendRoutineLogExerciseCard(exercise, sessionKind) {
  if (!refs.routineExerciseFields.querySelector("[data-exercise-name]")) {
    refs.routineExerciseFields.innerHTML = "";
  }

  refs.routineExerciseFields.insertAdjacentHTML("beforeend", buildRoutineLogExerciseCardMarkup(exercise, sessionKind));
  return refs.routineExerciseFields.lastElementChild;
}

function addExerciseToCurrentSession({ jumpToGuidedExercise = false } = {}) {
  const template = ensureEditableRoutineLogTemplate();
  if (!template) {
    showToast("Choose a routine or a planned session first");
    return;
  }

  const name = promptForSessionExerciseName();
  if (!name) {
    return;
  }

  const exercise = buildAdHocExerciseTemplate(name, template.kind);
  template.exercises.push(exercise);

  const card = appendRoutineLogExerciseCard(exercise, template.kind);
  setExercisePanelOpen(card, "details", true);
  renderRoutineTimerUI();

  if (ui.guidedWorkout.active) {
    ui.guidedWorkout.exerciseDrafts.push(buildGuidedWorkoutDraft(exercise, card, template.kind));
    ui.guidedWorkout.renderedExerciseIndex = -1;

    if (jumpToGuidedExercise) {
      goToGuidedExercise(ui.guidedWorkout.exerciseDrafts.length - 1);
    } else {
      renderGuidedWorkoutUI();
    }
  }

  card?.scrollIntoView({ behavior: "smooth", block: "start" });
  card?.querySelector("[data-reps-picker], [data-set-weight], [data-set-reps]")?.focus();
  showToast(`${exercise.name} added to this workout`);
}

function updateRoutineBuilderUI() {
  const routine = ui.editingRoutineId
    ? state.routines.find((item) => item.id === ui.editingRoutineId)
    : null;

  refs.routineBuilderEyebrow.textContent = routine ? "Edit routine" : "Create routine";
  refs.routineBuilderHeading.textContent = routine
    ? "Update the workout template you want to repeat"
    : "Save a session you want to repeat";
  refs.routineBuilderModeNote.textContent = routine
    ? `Editing ${routine.name}. Changes here update the saved workout template you log from.`
    : "";
  refs.routineBuilderModeNote.classList.toggle("hidden", !routine);
  refs.routineBuilderSubmit.textContent = routine ? "Update routine" : "Save routine";
  refs.cancelRoutineEdit.classList.toggle("hidden", !routine);
}

function resetRoutineBuilderForm() {
  ui.editingRoutineId = null;
  refs.routineBuilderForm.reset();
  refs.builderRoutineMinutes.value = 60;
  refs.routineExerciseBuilder.innerHTML = "";
  ensureBuilderRows();
  updateRoutineBuilderUI();
}

function startRoutineCreate() {
  resetRoutineBuilderForm();
  refs.routineBuilder.classList.remove("hidden");
}

function startRoutineEdit(routineId) {
  const routine = state.routines.find((item) => item.id === routineId);
  if (!routine) {
    return;
  }

  ui.editingRoutineId = routineId;
  refs.routineBuilder.classList.remove("hidden");
  refs.builderRoutineName.value = routine.name;
  refs.builderRoutineKind.value = routine.kind;
  refs.builderSessionKind.value = routine.sessionKind;
  refs.builderRoutineMinutes.value = routine.estimatedMinutes || 60;
  refs.builderRoutineNotes.value = routine.notes || "";
  refs.routineExerciseBuilder.innerHTML = "";
  if (routine.exercises.length) {
    routine.exercises.forEach((exercise) => appendRoutineBuilderExerciseRow(exercise));
  } else {
    ensureBuilderRows();
  }
  updateRoutineBuilderUI();
  refs.routineBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateBlockBuilderUI() {
  const block = ui.editingBlockId
    ? state.blocks.find((item) => item.id === ui.editingBlockId)
    : null;

  refs.blockBuilderEyebrow.textContent = block ? "Edit block" : "Create block";
  refs.blockBuilderHeading.textContent = block
    ? "Update your saved training loop"
    : "Build your own weekly loop";
  refs.blockBuilderModeNote.textContent = block
    ? `Editing ${block.name}. Update the weeks, sessions, and exercise details here.`
    : "";
  refs.blockBuilderModeNote.classList.toggle("hidden", !block);
  refs.blockBuilderSubmit.textContent = block ? "Update block" : "Save block";
  refs.cancelBlockEdit.classList.toggle("hidden", !block);
}

function resetBlockBuilderForm() {
  ui.editingBlockId = null;
  refs.blockBuilderForm.reset();
  refs.builderBlockLooping.value = "yes";
  refs.blockWeeksBuilder.innerHTML = "";
  ensureAtLeastOneWeek();
  updateBlockBuilderUI();
}

function startBlockCreate() {
  resetBlockBuilderForm();
  refs.blockBuilder.classList.remove("hidden");
}

function startBlockEdit(blockId) {
  const block = state.blocks.find((item) => item.id === blockId);
  if (!block) {
    return;
  }

  ui.editingBlockId = blockId;
  refs.blockBuilder.classList.remove("hidden");
  refs.builderBlockName.value = block.name;
  refs.builderBlockLooping.value = block.isLooping ? "yes" : "no";
  refs.builderBlockFocus.value = block.focus || "";
  refs.blockWeeksBuilder.innerHTML = "";
  block.weeks.forEach((week) => appendBlockWeek(week));
  ensureAtLeastOneWeek();
  updateBlockBuilderUI();
  refs.blockBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleChipClick(event, setRef, container, groupName) {
  const button = event.target.closest("[data-chip-value]");
  if (!button) {
    return;
  }

  const value = button.dataset.chipValue;
  if (setRef.has(value)) {
    setRef.delete(value);
  } else {
    setRef.add(value);
  }
  renderChipGroup(container, setRef, groupName);
}

function renderChipGroup(container, selectedSet, groupName) {
  container.innerHTML = bodyAreas.map((area) => `
    <button
      class="chip ${selectedSet.has(area.key) ? "is-selected" : ""}"
      type="button"
      data-chip-group="${groupName}"
      data-chip-value="${area.key}"
    >
      ${area.label}
    </button>
  `).join("");
}

function refreshRoutineLogOptions() {
  const template = ui.activeRoutineLogTemplate;
  const activeTemplateOptionValue = "__active_template__";
  const hasLinkedRoutineOption = template?.sourceType && template.sourceType !== "routine"
    && template.routineId
    && state.routines.some((routine) => routine.id === template.routineId);
  const hasActiveTemplateOnlyOption = template?.sourceType && template.sourceType !== "routine" && !hasLinkedRoutineOption;

  if (!state.routines.length && !hasActiveTemplateOnlyOption) {
    refs.routineLogSelect.innerHTML = `<option value="">No routine yet</option>`;
    refs.routineExerciseFields.innerHTML = buildEmptyCard("No routine yet", "Create your first routine in the Routines tab.");
    refs.routineLogNote.textContent = "Start by creating a repeatable gym or conditioning routine.";
    return;
  }

  const previousValue = refs.routineLogSelect.value;
  refs.routineLogSelect.innerHTML = [
    hasActiveTemplateOnlyOption ? `<option value="${activeTemplateOptionValue}">${escapeHtml(template.title)}</option>` : "",
    ...state.routines.map((routine) => `<option value="${routine.id}">${routine.name}</option>`)
  ].join("");

  if (template?.sourceType && template.sourceType !== "routine") {
    refs.routineLogSelect.value = hasLinkedRoutineOption ? template.routineId : activeTemplateOptionValue;
  } else {
    refs.routineLogSelect.value = state.routines.some((routine) => routine.id === previousValue)
      ? previousValue
      : state.routines[0]?.id || activeTemplateOptionValue;
  }

  syncRoutineLogForm({ fromSelection: true });
}

function buildRoutineLogExerciseCardMarkup(exercise, sessionKind) {
  const history = getExerciseHistory(exercise.name, { limit: 4 });
  const latestEntry = history[0];
  const latestSummary = latestEntry ? summarizeExerciseLog(latestEntry) : null;
  const lastWeight = latestSummary?.keyWeight ?? getLastWeight(exercise.name);
  const suggestedWeight = getSuggestedExerciseWeight(exercise, sessionKind, { latestEntry });
  const lastSetSeconds = getLastSetSeconds(exercise.name);
  const lastRestSeconds = getLastRestSeconds(exercise.name);
  const lastEffortPercent = latestEntry ? getExerciseEffortPercent(latestEntry) : null;
  const historyMarkup = history.length
    ? `
      <div class="exercise-history">
        <div class="exercise-history-title">Recent weeks</div>
        ${history.map((entry) => `
          <div class="exercise-history-row">
            <div class="exercise-history-main">${escapeHtml(formatExerciseHistoryLine(entry))}</div>
            ${entry.note ? `<div class="exercise-history-note">${escapeHtml(entry.note)}</div>` : ""}
          </div>
        `).join("")}
      </div>
    `
    : `<div class="helper-text">No previous exercise log yet</div>`;

  return `
    <article class="exercise-card" data-exercise-name="${escapeHtml(exercise.name)}" data-target-reps="${escapeAttribute(exercise.targetReps)}" data-default-set-weight="${escapeAttribute(normalizedWeightValue(suggestedWeight))}" data-default-effort-percent="${escapeAttribute(normalizeSelectNumber(exercise.targetEffortPercent) ?? "")}">
      <div class="exercise-head">
        <div>
          <div class="list-title">${escapeHtml(exercise.name)}</div>
          <div class="exercise-target">${exercise.targetSets} sets • ${escapeHtml(exercise.targetReps)}</div>
          ${exercise.notes ? `<div class="helper-text" style="margin-top:0.35rem">${escapeHtml(exercise.notes)}</div>` : ""}
          ${buildExerciseHistoryHintMarkup({ suggestedWeight, lastWeight, lastSetSeconds, lastRestSeconds, lastEffortPercent })}
        </div>
        <span class="small-tag" style="background:${sessionKinds[sessionKind].color}">
          ${sessionKinds[sessionKind].label}
        </span>
      </div>

      ${buildExerciseRollerFieldsMarkup({
        exercise,
        sessionKind,
        repsValue: exercise.targetLogReps ?? extractPreferredRepValue(exercise),
        effortPercent: exercise.targetEffortPercent ?? "",
        weightValue: suggestedWeight ?? exercise.targetWeight ?? "",
        setSeconds: exercise.targetSetSeconds ?? inferSetSecondsFromExercise(exercise),
        restSeconds: exercise.targetRestSeconds ?? "",
        lastWeight: suggestedWeight ?? exercise.targetWeight ?? lastWeight
      })}

      <div class="exercise-tools">
        <button class="exercise-tool" type="button" data-toggle-exercise-panel="history">History</button>
        <button class="exercise-tool" type="button" data-toggle-exercise-panel="notes">Notes</button>
        <button class="exercise-tool" type="button" data-toggle-exercise-panel="details">Set details</button>
      </div>

      <div class="exercise-panel hidden" data-exercise-panel="history">
        ${historyMarkup}
      </div>

      <label class="field exercise-panel hidden" data-exercise-panel="notes">
        <span>Exercise note</span>
        <textarea rows="2" data-note placeholder="Technique, pain, machine used, strong, ugly..."></textarea>
      </label>

      <div class="exercise-panel hidden" data-exercise-panel="details">
        <div class="helper-text">Leave the workout running and fill these rollers in whenever the exercise is done.</div>
        <div class="exercise-set-list" data-set-list>
          ${buildExerciseSetRowsMarkup(
          buildExerciseSetDraftsFromTemplate(exercise, {
            defaultWeight: suggestedWeight,
            defaultSetSeconds: exercise.targetSetSeconds ?? inferSetSecondsFromExercise(exercise),
            defaultRestSeconds: exercise.targetRestSeconds ?? "",
            defaultEffortPercent: exercise.targetEffortPercent ?? ""
          }),
          exercise.targetReps,
          suggestedWeight,
          exercise.targetSetSeconds ?? inferSetSecondsFromExercise(exercise),
          exercise.targetRestSeconds ?? "",
          exercise.targetEffortPercent ?? ""
        )}
        </div>

        <div class="mini-actions">
          <button class="button button-secondary compact" type="button" data-add-set>Add extra set</button>
        </div>
      </div>
    </article>
  `;
}

function syncRoutineLogForm({ fromSelection = false } = {}) {
  const template = currentRoutineLogTemplate();

  if (!template) {
    refs.routineExerciseFields.innerHTML = buildEmptyCard("No routine selected", "Pick or create a routine first.");
    refs.routineLogNote.textContent = "Choose a routine or start from a planned block session.";
    renderLogPlanner();
    return;
  }

  if (fromSelection) {
    refs.routineLogDuration.value = template.estimatedMinutes || 60;
    ui.routineAreas = new Set(template.routineId
      ? suggestAreasForRoutine(state.routines.find((item) => item.id === template.routineId) || {
        name: template.title,
        notes: template.notes,
        sessionKind: template.kind
      })
      : suggestAreasForRoutine({
        name: template.title,
        notes: template.notes,
        sessionKind: template.kind
      }));
    renderChipGroup(refs.routineAreas, ui.routineAreas, "routine");
  }

  refs.routineLogNote.textContent = template.notes || sessionKinds[template.kind]?.description || "";
  refs.routineExerciseFields.innerHTML = template.exercises.length
    ? template.exercises.map((exercise) => buildRoutineLogExerciseCardMarkup(exercise, template.kind)).join("")
    : buildEmptyCard("This routine is mostly time based", "Use the notes field and loaded areas, then save the session.");

  renderRoutineTimerUI();
  renderLogPlanner();
}

async function handlePhotoImportSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (ui.photoImport.imageUrl) {
    URL.revokeObjectURL(ui.photoImport.imageUrl);
  }

  ui.photoImport.imageUrl = URL.createObjectURL(file);
  ui.photoImport.processing = true;
  ui.photoImport.status = "Preparing the photo for OCR...";
  ui.photoImport.statusTone = "";
  ui.photoImport.recognizedText = "";
  ui.photoImport.draft = null;
  refs.photoImportText.value = "";
  renderPhotoImportUI();

  if (!window.Tesseract) {
    ui.photoImport.processing = false;
    ui.photoImport.status = "Handwriting recognition is not available yet. Open the app online once so the OCR tool can load.";
    ui.photoImport.statusTone = "error";
    renderPhotoImportUI();
    event.target.value = "";
    return;
  }

  try {
    const preparedImage = await prepareImageForOcr(file);
    const result = await window.Tesseract.recognize(preparedImage, "eng", {
      logger: (message) => {
        ui.photoImport.status = formatPhotoImportStatus(message.status, message.progress);
        ui.photoImport.statusTone = "";
        renderPhotoImportUI();
      }
    });

    const recognizedText = cleanRecognizedText(result?.data?.text || "");
    refs.photoImportText.value = recognizedText;
    ui.photoImport.recognizedText = recognizedText;
    ui.photoImport.processing = false;
    updatePhotoImportDraftFromText();
  } catch (error) {
    const heicLike = isHeicLikeFile(file);
    ui.photoImport.processing = false;
    ui.photoImport.status = heicLike
      ? "This browser could not open the HEIC photo. Export or share it as JPEG or PNG, then try the scan again."
      : "The photo could not be read. Try a sharper image with darker pen strokes and good light.";
    ui.photoImport.statusTone = "error";
    ui.photoImport.draft = null;
    renderPhotoImportUI();
  } finally {
    event.target.value = "";
  }
}

function handlePhotoImportTextInput() {
  ui.photoImport.recognizedText = cleanRecognizedText(refs.photoImportText.value);
  updatePhotoImportDraftFromText();
}

function updatePhotoImportDraftFromText() {
  const recognizedText = cleanRecognizedText(refs.photoImportText.value);
  ui.photoImport.recognizedText = recognizedText;

  if (!recognizedText) {
    ui.photoImport.draft = null;
    if (!ui.photoImport.processing) {
      ui.photoImport.status = ui.photoImport.imageUrl
        ? "Add or correct the recognized text so PulseBoard can build the workout."
        : "";
      ui.photoImport.statusTone = "";
    }
    renderPhotoImportUI();
    return;
  }

  ui.photoImport.draft = parseImportedWorkoutText(recognizedText);
  if (!ui.photoImport.processing) {
    ui.photoImport.status = ui.photoImport.draft
      ? "Workout detected. Load it into the log, review anything that looks off, then save."
      : "I could read some text, but not enough structure yet. Edit the text a little more and the workout summary should appear.";
    ui.photoImport.statusTone = ui.photoImport.draft ? "success" : "";
  }
  renderPhotoImportUI();
}

function clearPhotoImport() {
  if (ui.photoImport.imageUrl) {
    URL.revokeObjectURL(ui.photoImport.imageUrl);
  }

  ui.photoImport = createPhotoImportState();
  refs.photoImportInput.value = "";
  refs.photoImportText.value = "";
  renderPhotoImportUI();
}

function applyPhotoImportDraft() {
  const draft = parseImportedWorkoutText(refs.photoImportText.value);
  if (!draft) {
    ui.photoImport.draft = null;
    ui.photoImport.status = "The scan still needs a bit more cleanup before it can become a workout.";
    ui.photoImport.statusTone = "error";
    renderPhotoImportUI();
    return;
  }

  ui.photoImport.draft = draft;
  ui.photoImport.status = "Loaded into the log below. Review the fields, then save it as a workout.";
  ui.photoImport.statusTone = "success";

  if (draft.importMode === "routine") {
    loadImportedRoutineDraft(draft);
    refs.routineLogForm.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    loadImportedQuickDraft(draft);
    refs.quickLogForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderPhotoImportUI();
}

function loadImportedQuickDraft(draft) {
  cancelWorkoutEdit();
  clearRoutineLogTemplate();
  clearGuidedWorkout();
  ui.logMode = "quick";
  renderLogMode();
  openScreen("log");
  resetRoutineTimerState();
  refs.quickKind.value = draft.workout.kind;
  refs.quickDate.value = draft.workout.date || todayISO();
  refs.quickDuration.value = draft.workout.durationMinutes || defaultDurationForKind(draft.workout.kind);
  refs.quickIntensity.value = draft.workout.intensity || 3;
  refs.quickTitle.value = draft.workout.title || sessionKinds[draft.workout.kind]?.label || "Workout";
  refs.quickMetric.value = draft.workout.primaryMetric || "";
  refs.quickNotes.value = draft.workout.notes || "";
  ui.quickAreas = new Set(draft.workout.loadedAreas || defaultAreasForKind(draft.workout.kind));
  renderChipGroup(refs.quickAreas, ui.quickAreas, "quick");
  updateWorkoutEditUI();
}

function loadImportedRoutineDraft(draft) {
  cancelWorkoutEdit();
  clearGuidedWorkout();
  setRoutineLogTemplate(draft.template);
  ui.logMode = "routine";
  renderLogMode();
  openScreen("log");
  refreshRoutineLogOptions();
  resetRoutineTimerState();
  refs.routineLogDate.value = draft.workout.date || todayISO();
  refs.routineLogDuration.value = draft.workout.durationMinutes || draft.template.estimatedMinutes || defaultDurationForKind(draft.workout.kind);
  refs.routineLogIntensity.value = draft.workout.intensity || 3;
  refs.routineLogNotes.value = draft.workout.notes || "";
  ui.routineAreas = new Set(draft.workout.loadedAreas || defaultAreasForKind(draft.workout.kind));
  renderChipGroup(refs.routineAreas, ui.routineAreas, "routine");
  populateRoutineExerciseFieldsFromLogs(draft.workout.exerciseLogs || []);
  updateWorkoutEditUI();
}

function buildPhotoImportSummaryMarkup(draft) {
  const workout = draft.workout;
  const kindLabel = sessionKinds[workout.kind]?.label || "Workout";
  const exerciseMarkup = draft.importMode === "routine" && workout.exerciseLogs.length
    ? `
      <div class="photo-import-list">
        ${workout.exerciseLogs.slice(0, 6).map((entry) => {
          const summary = summarizeExerciseLog(entry);
          const parts = [];
          if (summary.keyWeight != null) {
            parts.push(formatWeight(summary.keyWeight));
          }
          if (summary.reps != null) {
            parts.push(`${summary.reps} reps`);
          }
          if (entry.setLogs?.length) {
            parts.push(`${entry.setLogs.length} sets`);
          }
          return `
            <article class="photo-import-exercise">
              <strong>${escapeHtml(entry.name)}</strong>
              <div class="helper-text">${escapeHtml(parts.join(" • ") || "Notes only")}</div>
            </article>
          `;
        }).join("")}
      </div>
    `
    : "";

  return `
    <div class="photo-import-summary-grid">
      <article class="photo-import-summary-card">
        <span class="eyebrow">Detected</span>
        <strong>${escapeHtml(kindLabel)}</strong>
        <div class="helper-text">${escapeHtml(workout.title || kindLabel)}</div>
      </article>

      <article class="photo-import-summary-card">
        <span class="eyebrow">When</span>
        <strong>${escapeHtml(formatDate(workout.date, { weekday: "short", day: "numeric", month: "short" }))}</strong>
        <div class="helper-text">${escapeHtml(`${workout.durationMinutes || 0} min • Intensity ${workout.intensity || 3}/5`)}</div>
      </article>

      <article class="photo-import-summary-card">
        <span class="eyebrow">Saved As</span>
        <strong>${draft.importMode === "routine" ? "Detailed workout" : "Quick session"}</strong>
        <div class="helper-text">${escapeHtml(draft.importMode === "routine" ? "Exercise logs will feed progress tracking." : "Notes and metrics will be kept in the quick log.")}</div>
      </article>

      <article class="photo-import-summary-card">
        <span class="eyebrow">Loaded Areas</span>
        <strong>${escapeHtml(areaLabels(workout.loadedAreas || []))}</strong>
        <div class="helper-text">${escapeHtml(draft.importMode === "routine" ? `${workout.exerciseLogs.length} exercise${workout.exerciseLogs.length === 1 ? "" : "s"} detected` : (workout.primaryMetric || "No extra metric detected"))}</div>
      </article>
    </div>
    ${exerciseMarkup}
  `;
}

function formatPhotoImportStatus(status = "", progress = 0) {
  const labels = {
    loading: "Loading OCR engine",
    initializing: "Starting OCR",
    recognizing: "Reading the handwriting",
    loading_language_model: "Loading language model",
    loading_tesseract_core: "Loading OCR core"
  };
  const label = labels[status] || "Reading the notes";
  const percent = Number.isFinite(progress) && progress > 0 && progress < 1
    ? ` ${Math.round(progress * 100)}%`
    : "";
  return `${label}${percent}`;
}

async function prepareImageForOcr(file) {
  const image = await loadImageFromFile(file);
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let index = 0; index < data.length; index += 4) {
    const gray = (data[index] * 0.299) + (data[index + 1] * 0.587) + (data[index + 2] * 0.114);
    const contrasted = clamp(Math.round(((gray - 128) * 1.45) + 136), 0, 255);
    data[index] = contrasted;
    data[index + 1] = contrasted;
    data[index + 2] = contrasted;
  }
  context.putImageData(imageData, 0, 0);

  return canvas;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };
    image.src = objectUrl;
  });
}

function isHeicLikeFile(file) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  return type === "image/heic"
    || type === "image/heif"
    || name.endsWith(".heic")
    || name.endsWith(".heif");
}

function parseImportedWorkoutText(text) {
  const cleanedText = cleanRecognizedText(text);
  if (!cleanedText) {
    return null;
  }

  const lines = extractMeaningfulImportLines(cleanedText);
  if (!lines.length) {
    return null;
  }

  const strengthEntries = mergeImportedExerciseLogs(parseImportedStrengthExerciseLogs(lines));
  let kind = detectImportedWorkoutKind(cleanedText, lines, strengthEntries);
  if (strengthEntries.length && !["strength", "explosive", "functional"].includes(kind)) {
    kind = "strength";
  }

  const importMode = strengthEntries.length && ["strength", "explosive", "functional"].includes(kind)
    ? "routine"
    : "quick";
  const date = parseImportedWorkoutDate(cleanedText) || todayISO();
  const durationMinutes = parseImportedWorkoutDuration(cleanedText, kind);
  const intensity = parseImportedWorkoutIntensity(cleanedText);
  const title = deriveImportedWorkoutTitle(lines, kind, strengthEntries);
  const primaryMetric = importMode === "quick" ? extractImportedPrimaryMetric(cleanedText, lines, kind) : "";
  const loadedAreas = deriveImportedWorkoutAreas(kind, strengthEntries, cleanedText);
  const notes = cleanedText;

  const workout = {
    date,
    title,
    kind,
    durationMinutes,
    intensity,
    notes,
    primaryMetric,
    loadedAreas,
    exerciseLogs: importMode === "routine" ? strengthEntries : []
  };

  return {
    importMode,
    workout,
    template: importMode === "routine" ? buildImportedRoutineTemplate(workout) : null
  };
}

function cleanRecognizedText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[×✕]/g, "x")
    .replace(/[•·]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractMeaningfulImportLines(text) {
  return cleanRecognizedText(text)
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function detectImportedWorkoutKind(text, lines, strengthEntries = []) {
  const normalized = text.toLowerCase();
  const scores = Object.fromEntries(Object.keys(sessionKinds).map((key) => [key, 0]));

  Object.entries(workoutImportKeywords).forEach(([kind, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalized.includes(keyword)) {
        scores[kind] += keyword.length > 3 ? 2 : 1;
      }
    });
  });

  if (/\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|lb|lbs)\b/i.test(normalized) || strengthEntries.length >= 2) {
    scores.strength += 4;
  }
  if (/\b\d+\s*x\s*\d+\b/i.test(normalized)) {
    scores.strength += 2;
  }
  if (/\b(?:zone\s*[12]|tempo|interval|long run)\b/i.test(normalized)) {
    scores.run += 2;
  }
  if (/\b(?:watts?|trainer|cadence)\b/i.test(normalized)) {
    scores.bike += 3;
  }
  if (/\b(?:laps?|freestyle|pool)\b/i.test(normalized)) {
    scores.swim += 3;
  }
  if (/\b(?:waves?|paddle)\b/i.test(normalized)) {
    scores.surf += 3;
  }
  if (/\b(?:trail|elevation|ascent)\b/i.test(normalized)) {
    scores.hike += 3;
  }
  if (/\b(?:stretch|mobility|flow|yoga)\b/i.test(normalized)) {
    scores.mobility += 3;
  }
  if (/\b(?:recovery|walk|easy)\b/i.test(normalized)) {
    scores.recovery += 1;
  }

  if (lines.some((line) => /(?:amrap|emom|circuit|metcon|wod)/i.test(line))) {
    scores.functional += 4;
  }
  if (lines.some((line) => /(?:sprint|jump|bounds?|throw|slam)/i.test(line))) {
    scores.explosive += 4;
  }

  return Object.entries(scores)
    .sort((left, right) => right[1] - left[1])[0]?.[0] || "strength";
}

function parseImportedWorkoutDate(text) {
  const isoMatch = text.match(/\b(20\d{2})[./-](\d{1,2})[./-](\d{1,2})\b/);
  if (isoMatch) {
    return normalizeDateString(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
  }

  const shortMatch = text.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/);
  if (!shortMatch) {
    return null;
  }

  const day = Number(shortMatch[1]);
  const month = Number(shortMatch[2]);
  const year = shortMatch[3]
    ? Number(shortMatch[3].length === 2 ? `20${shortMatch[3]}` : shortMatch[3])
    : new Date().getFullYear();

  if (!day || !month || month > 12 || day > 31) {
    return null;
  }

  return normalizeDateString(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
}

function parseImportedWorkoutDuration(text, kind) {
  const hoursAndMinutes = text.match(/\b(\d{1,2})\s*h(?:ours?)?(?:\s*(\d{1,2})\s*(?:m|min|mins|minutes?))?\b/i);
  if (hoursAndMinutes) {
    return (Number(hoursAndMinutes[1]) * 60) + Number(hoursAndMinutes[2] || 0);
  }

  const minutesMatch = text.match(/\b(\d{1,3})\s*(?:m|min|mins|minutes?)\b/i);
  if (minutesMatch) {
    const minutes = Number(minutesMatch[1]);
    if (minutes >= 10 && minutes <= 360) {
      return minutes;
    }
  }

  return defaultDurationForKind(kind);
}

function defaultDurationForKind(kind) {
  switch (kind) {
    case "explosive":
      return 40;
    case "mobility":
    case "recovery":
      return 30;
    case "run":
    case "bike":
    case "swim":
    case "surf":
    case "hike":
      return 60;
    default:
      return 60;
  }
}

function parseImportedWorkoutIntensity(text) {
  const intensityMatch = text.match(/\bintensity\b[^0-9]{0,4}(\d)(?:\/5)?/i);
  if (intensityMatch) {
    return clamp(Number(intensityMatch[1]), 1, 5);
  }

  const rpeMatch = text.match(/\brpe\b[^0-9]{0,4}(\d{1,2})/i);
  if (rpeMatch) {
    return clamp(Math.round(Number(rpeMatch[1]) / 2), 1, 5);
  }

  if (/\b(?:max|brutal|very hard|all out)\b/i.test(text)) {
    return 5;
  }
  if (/\b(?:hard|strong)\b/i.test(text)) {
    return 4;
  }
  if (/\b(?:easy|recovery)\b/i.test(text)) {
    return 2;
  }

  return 3;
}

function deriveImportedWorkoutTitle(lines, kind, exerciseLogs = []) {
  const titleLine = lines.find((line) => {
    const plain = line.trim();
    if (plain.length < 4) {
      return false;
    }
    if (/^\d/.test(plain)) {
      return false;
    }
    if (parseExerciseLineNameAndData(plain)) {
      return false;
    }
    return /\b(?:day|session|workout|run|bike|ride|swim|surf|hike|mobility|recovery|strength|upper|lower|push|pull|legs?)\b/i.test(plain);
  });

  if (titleLine) {
    return titleLine.trim();
  }

  if (exerciseLogs.length) {
    return exerciseLogs.length === 1
      ? exerciseLogs[0].name
      : `${exerciseLogs[0].name} + ${exerciseLogs.length - 1} more`;
  }

  return sessionKinds[kind]?.label || "Workout";
}

function extractImportedPrimaryMetric(text, lines, kind) {
  const matches = [
    ...text.matchAll(/\b\d+(?:[.,]\d+)?\s*(?:km|kms|kilometers?|mi|miles?|m|meters?|metres?|watts?|w|laps?)\b/gi)
  ].map((match) => match[0]);

  const intervalLine = lines.find((line) => /\b\d+\s*x\s*\d+\s*(?:m|min|mins|seconds?|sec|s)\b/i.test(line));
  if (intervalLine) {
    matches.unshift(intervalLine.trim());
  }

  const unique = [...new Set(matches.map((value) => value.trim()))].filter(Boolean);
  if (unique.length) {
    return unique.slice(0, 2).join(" • ");
  }

  if (kind === "run" || kind === "bike" || kind === "swim" || kind === "hike" || kind === "surf") {
    const metricLine = lines.find((line) => /(?:pace|easy|tempo|steady|interval|zone|open water|trainer)/i.test(line));
    return metricLine || "";
  }

  return "";
}

function deriveImportedWorkoutAreas(kind, exerciseLogs = [], text = "") {
  const selected = new Set(defaultAreasForKind(kind));

  exerciseLogs.forEach((entry) => {
    inferAreasFromImportedExercise(entry.name).forEach((area) => selected.add(area));
  });

  if (selected.size === 0 && /\bcore\b/i.test(text)) {
    selected.add("core");
  }

  return [...selected];
}

function parseImportedStrengthExerciseLogs(lines) {
  return buildImportedExerciseBlocks(lines).flatMap(({ namePart, dataPart }) => {
    const names = splitImportedExerciseNames(namePart);
    const dataParts = splitImportedExerciseDataParts(dataPart, names.length);
    const blocks = names.length > 1 && dataParts.length === names.length
      ? names.map((name, index) => ({ name, data: dataParts[index] }))
      : [{ name: namePart, data: dataPart }];

    return blocks.map(({ name, data }) => {
      const setLogs = parseImportedSetLogs(data);
      if (!setLogs.length) {
        return null;
      }

      const summary = summarizeExerciseSetLogs(setLogs);
      return {
        id: uid(),
        name: canonicalizeImportedExerciseName(name),
        keyWeight: summary.keyWeight,
        reps: summary.reps,
        effort: null,
        effortPercent: parseImportedEffortPercent(data),
        note: "",
        setSeconds: null,
        restSeconds: inferRestSecondsFromText(data),
        plannedRestSeconds: inferRestSecondsFromText(data),
        setLogs
      };
    }).filter(Boolean);
  });
}

function buildImportedExerciseBlocks(lines) {
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }

    const directLine = parseExerciseLineNameAndData(line);
    if (directLine) {
      blocks.push(directLine);
      continue;
    }

    if (!looksLikeExerciseLabel(line)) {
      continue;
    }

    const dataLines = [];
    let cursor = index + 1;

    while (cursor < lines.length) {
      const nextLine = lines[cursor].trim();
      if (!nextLine) {
        break;
      }
      if (looksLikeWorkoutHeader(nextLine)) {
        break;
      }
      if (parseExerciseLineNameAndData(nextLine)) {
        break;
      }
      if (looksLikeExerciseLabel(nextLine) && !looksLikeExerciseData(nextLine)) {
        break;
      }
      if (looksLikeExerciseData(nextLine)) {
        dataLines.push(nextLine);
        cursor += 1;
        continue;
      }
      if (dataLines.length) {
        break;
      }
      break;
    }

    if (dataLines.length) {
      blocks.push({
        namePart: line,
        dataPart: dataLines.join(" ")
      });
      index = cursor - 1;
    }
  }

  return blocks;
}

function looksLikeWorkoutHeader(line) {
  const normalized = String(line || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (/^\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?(?:\s*-\s*[a-z]+)?$/i.test(normalized)) {
    return true;
  }

  return /^(?:nxt\s+)?(?:upper|lower|legs|leg day|pull(?!\s*(?:ups?|downs?)\b)(?:\s+day)?|push(?!\s*(?:ups?|backs?)\b)(?:\s+day)?|full body|cali|session|workout|pwr|dd)\b/i.test(normalized)
    && normalized.split(/\s+/).length <= 6;
}

function looksLikeExerciseLabel(line) {
  const normalized = String(line || "").trim();
  if (!normalized || /\d/.test(normalized) || looksLikeWorkoutHeader(normalized)) {
    return false;
  }
  if (/\b(?:post|pancakes|banana|yoghurt|yogurt|bowl|muesli|breakfast|lunch|dinner)\b/i.test(normalized)) {
    return false;
  }
  if (normalized.split(/\s+/).length > 8) {
    return false;
  }

  return /\b(?:squat|lunges?|press|row|curl|bench|thrust|trust|extension|raises?|raise|dips?|pull|lat|ham|leg|hip|calf|shoulder|rdl|bgss|bss|db|pb|hang|flag|handstand|goblet|hack|step[\s-]*up|kickback|bootie|back\s*ex)\b/i.test(normalized);
}

function looksLikeExerciseData(line) {
  const normalized = String(line || "").trim();
  if (!normalized || !/\d/.test(normalized)) {
    return false;
  }

  return /(?:kg|bw|fail|reps?|sets?|range|motion|x|->|→|\/|\+|\bp\b|plates?)/i.test(normalized);
}

function splitImportedExerciseNames(namePart) {
  const normalized = String(namePart || "").replace(/\s+/g, " ").trim();
  const parts = normalized.split(/\s+(?:x|×|\+|\/|into|->|→|and)\s+/).map((part) => part.trim()).filter(Boolean);

  if (parts.length > 1 && parts.every((part) => looksLikeExerciseLabel(part))) {
    return parts;
  }

  return [normalized];
}

function splitImportedExerciseDataParts(dataPart, expectedCount) {
  if (expectedCount <= 1) {
    return [String(dataPart || "").trim()];
  }

  const slashParts = String(dataPart || "")
    .split(/\s*\/+\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return slashParts.length === expectedCount ? slashParts : [String(dataPart || "").trim()];
}

function parseExerciseLineNameAndData(line) {
  const trimmed = line.trim().replace(/\s+/g, " ");
  if (!/[a-z]/i.test(trimmed) || !/\d/.test(trimmed)) {
    return null;
  }
  if (/\b(?:date|duration|time|intensity|rpe|notes?)\b/i.test(trimmed)) {
    return null;
  }
  if (looksLikeWorkoutHeader(trimmed)) {
    return null;
  }

  const firstDigitIndex = trimmed.search(/\d/);
  if (firstDigitIndex < 2) {
    return null;
  }

  const namePart = trimmed.slice(0, firstDigitIndex).replace(/[:\-–]+$/, "").trim();
  const dataPart = trimmed.slice(firstDigitIndex).trim();
  if (!namePart || namePart.length < 2) {
    return null;
  }
  if (/\b(?:run|bike|ride|swim|surf|hike|pace|zone|interval|tempo|distance)\b/i.test(namePart)) {
    return null;
  }

  return { namePart, dataPart };
}

function parseImportedSetLogs(dataPart) {
  const compact = dataPart
    .replace(/[()]/g, " ")
    .replace(/[xX×✕]/g, "x")
    .replace(/\s+/g, " ")
    .trim();

  if (/\b(?:km|mile|miles|min|mins|minutes|sec|secs|seconds|meters?|metres?)\b/i.test(compact) && !/\bkg\b/i.test(compact)) {
    return [];
  }

  const expanded = expandImportedRepeatingSegments(compact);
  const segments = expanded
    .split(/\s*(?:->|→|\s+\+\s+)\s*/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const setLogs = segments.flatMap((segment) => parseImportedSegmentSetLogs(segment));

  return setLogs.map((setLog, index) => normalizeExerciseSetLog({
    ...setLog,
    rowType: "main",
    setIndex: index + 1
  }));
}

function expandImportedRepeatingSegments(text) {
  let expanded = String(text || "");
  let previous = "";

  while (expanded !== previous) {
    previous = expanded;
    expanded = expanded
      .replace(/(\d{1,2})\s*x\s*\(([^()]+)\)/gi, (_, count, inner) => (
        Array.from({ length: Number(count) }, () => inner.trim()).join(" -> ")
      ))
      .replace(/\(([^()]+)\)\s*x\s*(\d{1,2})/gi, (_, inner, count) => (
        Array.from({ length: Number(count) }, () => inner.trim()).join(" -> ")
      ));
  }

  return expanded;
}

function parseImportedSegmentSetLogs(segment) {
  const cleaned = String(segment || "")
    .replace(/[()]/g, " ")
    .replace(/\b(?:first|last)\s+set\b.*$/i, "")
    .replace(/\b(?:for range of motion|range of motion)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || !/\d/.test(cleaned)) {
    return [];
  }

  const setsRepsWeight = cleaned.match(/\b(\d{1,2})\s*x\s*(\d{1,2})\s*x\s*([+-]?\d+(?:[.,]\d+)?)\s*(?:kg|kgs|lb|lbs)?\b/i);
  if (setsRepsWeight) {
    const setCount = Number(setsRepsWeight[1]);
    const reps = Number(setsRepsWeight[2]);
    const weight = parseImportedNumber(setsRepsWeight[3]);

    return Array.from({ length: setCount }, () => ({
      weight,
      reps
    }));
  }

  const weightRepsSets = cleaned.match(/\b([+-]?\d+(?:[.,]\d+)?)\s*(kg|kgs|lb|lbs)?\s*x\s*(\d{1,2})\s*x\s*(\d{1,2})\b/i);
  if (weightRepsSets) {
    const weight = parseImportedNumber(weightRepsSets[1]);
    const reps = Number(weightRepsSets[3]);
    const setCount = Number(weightRepsSets[4]);

    if (weightRepsSets[2] || weight > 15 || String(weightRepsSets[1]).includes(".") || String(weightRepsSets[1]).includes(",")) {
      return Array.from({ length: setCount }, () => ({
        weight,
        reps
      }));
    }
  }

  const platesRepsSets = cleaned.match(/\b([+-]?\d+(?:[.,]\d+)?)\s*p\s*x\s*(\d{1,2})\s*x\s*(\d{1,2})\b/i);
  if (platesRepsSets) {
    const reps = Number(platesRepsSets[2]);
    const setCount = Number(platesRepsSets[3]);

    return Array.from({ length: setCount }, () => ({
      weight: null,
      reps
    }));
  }

  const fixedWeightRepList = cleaned.match(/\b([+-]?\d+(?:[.,]\d+)?)\s*(kg|kgs|lb|lbs)?\s*x\s*(\d{1,2}(?:\s*[/,]\s*\d{1,2})+)\b/i);
  if (fixedWeightRepList) {
    const weight = parseImportedNumber(fixedWeightRepList[1]);
    if (fixedWeightRepList[2] || weight > 15 || String(fixedWeightRepList[1]).includes(".") || String(fixedWeightRepList[1]).includes(",")) {
      return fixedWeightRepList[3]
        .split(/[/,]/)
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((reps) => ({ weight, reps }));
    }
  }

  const platesRepList = cleaned.match(/\b([+-]?\d+(?:[.,]\d+)?)\s*p\s*x\s*(\d{1,2}(?:\s*[/,]\s*\d{1,2})+)\b/i);
  if (platesRepList) {
    return platesRepList[2]
      .split(/[/,]/)
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0)
      .map((reps) => ({ weight: null, reps }));
  }

  const repsByWeight = cleaned.match(/\b(\d{1,2})\s*x\s*([+-]?\d+(?:[.,]\d+)?)\s*(kg|kgs|lb|lbs)\b/i);
  if (repsByWeight) {
    return [{
      weight: parseImportedNumber(repsByWeight[2]),
      reps: Number(repsByWeight[1])
    }];
  }

  const repsByPlates = cleaned.match(/\b(\d{1,2})\s*x\s*([+-]?\d+(?:[.,]\d+)?)\s*p\b/i);
  if (repsByPlates) {
    return [{
      weight: null,
      reps: Number(repsByPlates[1])
    }];
  }

  const weightByReps = cleaned.match(/\b([+-]?\d+(?:[.,]\d+)?)\s*(kg|kgs|lb|lbs)?\s*x\s*(\d{1,2})\b/i);
  if (weightByReps) {
    const weight = parseImportedNumber(weightByReps[1]);
    if (weightByReps[2] || weight > 15 || String(weightByReps[1]).includes(".") || String(weightByReps[1]).includes(",")) {
      return [{
        weight,
        reps: Number(weightByReps[3])
      }];
    }
  }

  const bodyweight = cleaned.match(/\b(\d{1,2})\s*bw\b/i);
  if (bodyweight) {
    return [{
      weight: 0,
      reps: Number(bodyweight[1])
    }];
  }

  const setsByReps = cleaned.match(/\b(\d{1,2})\s*x\s*(\d{1,2})\b/i);
  if (setsByReps) {
    return Array.from({ length: Number(setsByReps[1]) }, () => ({
      weight: null,
      reps: Number(setsByReps[2])
    }));
  }

  return [];
}

function mergeImportedExerciseLogs(entries = []) {
  const merged = new Map();

  entries.forEach((entry) => {
    const key = entry.name.toLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        ...entry,
        setLogs: [...(entry.setLogs || [])]
      });
      return;
    }

    const setLogs = [...(existing.setLogs || []), ...(entry.setLogs || [])]
      .map((setLog, index) => normalizeExerciseSetLog({
        ...setLog,
        setIndex: setLog.rowType === "main" ? index + 1 : setLog.setIndex
      }));
    const summary = summarizeExerciseSetLogs(setLogs);
    existing.setLogs = setLogs;
    existing.keyWeight = summary.keyWeight;
    existing.reps = summary.reps;
    existing.effortPercent = existing.effortPercent || entry.effortPercent || null;
    existing.restSeconds = existing.restSeconds || entry.restSeconds || null;
    existing.plannedRestSeconds = existing.plannedRestSeconds || entry.plannedRestSeconds || null;
  });

  return [...merged.values()];
}

function parseImportedEffortPercent(line) {
  const explicitPercent = line.match(/\b(\d{2,3})\s*%/);
  if (explicitPercent) {
    return clamp(Number(explicitPercent[1]), 40, 100);
  }

  const rpeMatch = line.match(/\brpe\b[^0-9]{0,4}(\d{1,2})/i);
  if (!rpeMatch) {
    return null;
  }

  return clamp(Math.round((Number(rpeMatch[1]) / 10) * 100), 40, 100);
}

function parseImportedNumber(value) {
  return Number(String(value).replace(",", "."));
}

function canonicalizeImportedExerciseName(rawName) {
  const trimmed = String(rawName || "").trim();
  const alias = importedExerciseAliases.find((entry) => entry.pattern.test(trimmed));
  if (alias) {
    return alias.name;
  }

  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function inferAreasFromImportedExercise(name) {
  const alias = importedExerciseAliases.find((entry) => entry.pattern.test(name));
  if (alias) {
    return alias.areas;
  }

  const normalized = String(name || "").toLowerCase();
  const selected = new Set();
  if (/\b(?:squat|deadlift|lunge|split squat|leg|calf|hip thrust)\b/.test(normalized)) {
    selected.add("legs");
    selected.add("glutes");
  }
  if (/\b(?:bench|press|push|landmine|dip)\b/.test(normalized)) {
    selected.add("chest");
    selected.add("shoulders");
    selected.add("arms");
  }
  if (/\b(?:row|pull|chin|lat|face pull)\b/.test(normalized)) {
    selected.add("back");
    selected.add("arms");
  }
  if (/\b(?:plank|core|carry|slam|throw|jump|sprint)\b/.test(normalized)) {
    selected.add("core");
  }

  return [...selected];
}

function buildImportedRoutineTemplate(workout) {
  return {
    sourceType: "photo",
    routineId: null,
    sessionId: null,
    blockId: null,
    weekId: null,
    title: workout.title,
    kind: workout.kind,
    notes: "Imported from handwritten notes",
    estimatedMinutes: workout.durationMinutes || defaultDurationForKind(workout.kind),
    exercises: workout.exerciseLogs.map((entry) => {
      const summary = summarizeExerciseLog(entry);
      const repValues = (entry.setLogs || [])
        .map((setLog) => normalizeSelectNumber(setLog.reps))
        .filter((value) => value != null);
      const targetReps = repValues.length
        ? String(repValues.length > 1 && new Set(repValues).size > 1
          ? `${Math.min(...repValues)}-${Math.max(...repValues)}`
          : repValues[0])
        : String(summary.reps || "");

      return hydrateExerciseTemplate({
        id: uid(),
        name: entry.name,
        targetSets: Math.max(1, entry.setLogs?.length || 1),
        targetReps,
        notes: entry.note || "",
        targetLogReps: summary.reps,
        targetEffortPercent: getExerciseEffortPercent(entry),
        targetWeight: summary.keyWeight,
        targetRestSeconds: entry.plannedRestSeconds || entry.restSeconds || null
      }, workout.kind);
    }),
    sourceLabel: "Handwritten notes import"
  };
}

function handleQuickLogSubmit(event) {
  event.preventDefault();

  const kind = refs.quickKind.value;
  const editingId = ui.editingWorkoutId;
  const measuredElapsedSeconds = currentWorkoutElapsedSeconds();
  const measuredRestSeconds = ui.routineTimer.totalRestSeconds + currentRestElapsedSeconds();
  const hasMeasuredWorkoutTime = ui.routineTimer.hasMeasuredWorkoutTime || measuredElapsedSeconds > 0;
  const workout = {
    id: editingId || uid(),
    date: refs.quickDate.value || todayISO(),
    title: refs.quickTitle.value.trim() || sessionKinds[kind].label,
    kind,
    durationMinutes: hasMeasuredWorkoutTime
      ? Math.max(1, Math.round(measuredElapsedSeconds / 60))
      : toNumber(refs.quickDuration.value),
    intensity: clamp(toNumber(refs.quickIntensity.value) || 3, 1, 5),
    notes: refs.quickNotes.value.trim(),
    primaryMetric: refs.quickMetric.value.trim(),
    routineId: null,
    elapsedSeconds: hasMeasuredWorkoutTime ? measuredElapsedSeconds : null,
    restSeconds: measuredRestSeconds || null,
    restPresetSeconds: ui.routineTimer.restPresetSeconds,
    loadedAreas: [...ui.quickAreas],
    exerciseLogs: []
  };

  if (editingId) {
    state.workouts = state.workouts.map((item) => item.id === editingId ? workout : item);
  } else {
    state.workouts.unshift(workout);
  }
  sortState();
  persistState();
  const workoutSummary = buildWorkoutProgressSummary(workout);

  ui.editingWorkoutId = null;
  resetQuickLogForm();
  resetRoutineTimerState();
  updateWorkoutEditUI();
  renderDataViews();
  showToast(editingId ? "Quick session updated" : "Quick session saved");
  openScreen("today");
  openWorkoutSummary(workoutSummary);
}

function handleRoutineLogSubmit(event) {
  event.preventDefault();

  const template = currentRoutineLogTemplate();
  if (!template) {
    showToast("Choose a routine or a planned session first");
    return;
  }

  const exerciseLogs = [...refs.routineExerciseFields.querySelectorAll("[data-exercise-name]")].map((card, index) => {
    const name = card.dataset.exerciseName;
    const guidedDraft = ui.guidedWorkout.exerciseDrafts[index] || null;
    const repsPickerValue = card.querySelector("[data-reps-picker]")?.value;
    const effortPercentValue = card.querySelector("[data-effort-percent]")?.value;
    const noteValue = card.querySelector("[data-note]")?.value.trim() || "";
    const liftWeightValue = card.querySelector("[data-lift-weight]")?.value;
    const setSecondsValue = card.querySelector("[data-set-seconds]")?.value;
    const restSecondsValue = card.querySelector("[data-rest-seconds]")?.value;
    const repsPicker = repsPickerValue === "" || repsPickerValue == null ? null : Number(repsPickerValue);
    const effortPercent = effortPercentValue === "" || effortPercentValue == null ? null : Number(effortPercentValue);
    const liftWeight = liftWeightValue === "" || liftWeightValue == null ? null : Number(liftWeightValue);
    const setSeconds = setSecondsValue === "" || setSecondsValue == null ? null : Number(setSecondsValue);
    const restSeconds = restSecondsValue === "" || restSecondsValue == null ? null : Number(restSecondsValue);
    const plannedRestSeconds = normalizeSelectNumber(guidedDraft?.restTargetSecondsValue)
      ?? template.exercises[index]?.targetRestSeconds
      ?? restSeconds;
    const setLogs = collectExerciseSetLogsFromContainer(card.querySelector("[data-set-list]"));
    const summary = summarizeExerciseSetLogs(setLogs);

    if (!setLogs.length && repsPicker == null && effortPercent == null && !noteValue && liftWeight == null && setSeconds == null && restSeconds == null) {
      return null;
    }

    return {
      id: uid(),
      name,
      keyWeight: Number.isFinite(liftWeight) ? liftWeight : summary.keyWeight,
      reps: Number.isFinite(repsPicker) ? repsPicker : summary.reps,
      effort: null,
      effortPercent: Number.isFinite(effortPercent) ? effortPercent : null,
      note: noteValue,
      setSeconds: Number.isFinite(setSeconds) ? setSeconds : null,
      restSeconds: Number.isFinite(restSeconds) ? restSeconds : null,
      plannedRestSeconds: Number.isFinite(plannedRestSeconds) ? plannedRestSeconds : null,
      setLogs
    };
  }).filter(Boolean);

  const editingId = ui.editingWorkoutId;
  const measuredElapsedSeconds = currentWorkoutElapsedSeconds();
  const guidedRestSeconds = totalGuidedTrackedRestSeconds();
  const measuredRestSeconds = Math.max(
    ui.routineTimer.totalRestSeconds + currentRestElapsedSeconds(),
    guidedRestSeconds
  );
  const hasMeasuredWorkoutTime = ui.routineTimer.hasMeasuredWorkoutTime || measuredElapsedSeconds > 0;
  const shouldPersistTemplate = template.sourceType === "planned"
    || (template.sourceType === "photo")
    || Boolean(ui.activeRoutineLogTemplate?.exercises?.length)
    || (!template.routineId && template.exercises.length);
  const workout = {
    id: editingId || uid(),
    date: refs.routineLogDate.value || todayISO(),
    title: template.title,
    kind: template.kind,
    durationMinutes: hasMeasuredWorkoutTime
      ? Math.max(1, Math.round(measuredElapsedSeconds / 60))
      : toNumber(refs.routineLogDuration.value),
    intensity: clamp(toNumber(refs.routineLogIntensity.value) || 3, 1, 5),
    notes: refs.routineLogNotes.value.trim(),
    primaryMetric: "",
    routineId: template.routineId,
    plannedSessionId: template.sourceType === "planned" ? template.sessionId : null,
    plannedBlockId: template.sourceType === "planned" ? template.blockId : null,
    plannedWeekId: template.sourceType === "planned" ? template.weekId : null,
    templateSourceType: shouldPersistTemplate ? template.sourceType : null,
    templateTitle: shouldPersistTemplate ? template.title : null,
    templateKind: shouldPersistTemplate ? template.kind : null,
    templateNotes: shouldPersistTemplate ? template.notes : null,
    templateExercises: shouldPersistTemplate ? cloneExerciseTemplates(template.exercises) : null,
    templateSourceLabel: shouldPersistTemplate ? template.sourceLabel : null,
    elapsedSeconds: hasMeasuredWorkoutTime ? measuredElapsedSeconds : null,
    restSeconds: measuredRestSeconds || null,
    restPresetSeconds: ui.routineTimer.restPresetSeconds,
    loadedAreas: [...ui.routineAreas],
    exerciseLogs
  };

  if (editingId) {
    state.workouts = state.workouts.map((item) => item.id === editingId ? workout : item);
  } else {
    state.workouts.unshift(workout);
  }
  sortState();
  persistState();
  const workoutSummary = buildWorkoutProgressSummary(workout, { templateExerciseCount: template.exercises.length });

  ui.editingWorkoutId = null;
  resetRoutineLogForm();
  updateWorkoutEditUI();
  renderDataViews();
  const prCount = countExercisePersonalBests(exerciseLogs, { excludeWorkoutId: workout.id });
  const savedLabel = template.sourceType === "planned" ? "Planned session" : "Routine session";
  const actionLabel = editingId ? "updated" : "saved";
  showToast(
    prCount
      ? `${savedLabel} ${actionLabel} • ${prCount} new PR${prCount === 1 ? "" : "s"}`
      : `${savedLabel} ${actionLabel}`
  );
  openScreen("today");
  openWorkoutSummary(workoutSummary);
}

function handleBodySubmit(event) {
  event.preventDefault();

  const checkIn = {
    id: uid(),
    date: refs.bodyDate.value || todayISO(),
    sleepHours: Number(refs.bodySleep.value) || 0,
    energy: clamp(toNumber(refs.bodyEnergy.value) || 3, 1, 5),
    soreness: clamp(toNumber(refs.bodySoreness.value) || 2, 1, 5),
    stress: clamp(toNumber(refs.bodyStress.value) || 2, 1, 5),
    fatiguedAreas: [...ui.bodyAreas],
    notes: refs.bodyNotes.value.trim()
  };

  state.bodyCheckIns = state.bodyCheckIns.filter((item) => item.date !== checkIn.date);
  state.bodyCheckIns.unshift(checkIn);
  sortState();
  persistState();
  renderDataViews();
  showToast("Body check-in saved");
  openScreen("today");
}

function handleRoutineBuilderSubmit(event) {
  event.preventDefault();

  const name = refs.builderRoutineName.value.trim();
  if (!name) {
    showToast("Routine needs a name");
    return;
  }

  const exercises = readExerciseBuilderRows(refs.routineExerciseBuilder);

  const editingId = ui.editingRoutineId;
  const previousRoutine = editingId ? state.routines.find((item) => item.id === editingId) : null;
  const routine = {
    id: editingId || uid(),
    systemKey: previousRoutine?.systemKey,
    name,
    kind: refs.builderRoutineKind.value,
    sessionKind: refs.builderSessionKind.value,
    notes: refs.builderRoutineNotes.value.trim(),
    estimatedMinutes: toNumber(refs.builderRoutineMinutes.value) || 60,
    exercises
  };

  if (editingId) {
    state.routines = state.routines.map((item) => item.id === editingId ? routine : item);
  } else {
    state.routines.unshift(routine);
  }
  persistState();

  resetRoutineBuilderForm();
  refs.routineBuilder.classList.add("hidden");
  refreshRoutineLogOptions();
  rerenderBlockBuilderRoutineSelects();
  renderDataViews();
  showToast(editingId ? "Routine updated" : "Routine saved");
}

function handleBlockBuilderSubmit(event) {
  event.preventDefault();

  const name = refs.builderBlockName.value.trim();
  if (!name) {
    showToast("Block needs a name");
    return;
  }

  const weeks = [...refs.blockWeeksBuilder.querySelectorAll(".week-builder")].map((weekCard) => {
    const title = weekCard.querySelector("[data-week-title]").value.trim() || "Week";
    const note = weekCard.querySelector("[data-week-note]").value.trim();
    const plannedSessions = [...weekCard.querySelectorAll(".session-builder")].map((row) => ({
      id: row.dataset.sessionId || uid(),
      dayLabel: row.querySelector("[data-planned-day]").value.trim() || "Day",
      routineId: row.querySelector("[data-planned-routine]").value || null,
      sessionTitle: row.querySelector("[data-planned-title]").value.trim() || "Planned session",
      kind: row.querySelector("[data-planned-kind]").value,
      details: row.querySelector("[data-planned-details]").value.trim(),
      exercises: readExerciseBuilderRows(row.querySelector("[data-session-exercise-list]"))
    }));

    return {
      id: weekCard.dataset.weekId || uid(),
      title,
      note,
      plannedSessions
    };
  }).filter((week) => week.plannedSessions.length);

  if (!weeks.length) {
    showToast("Add at least one week");
    return;
  }

  const editingId = ui.editingBlockId;
  const previousBlock = editingId ? state.blocks.find((item) => item.id === editingId) : null;
  const block = {
    id: editingId || uid(),
    name,
    focus: refs.builderBlockFocus.value.trim(),
    weeks,
    currentWeekIndex: clamp(previousBlock?.currentWeekIndex ?? 0, 0, Math.max(weeks.length - 1, 0)),
    isLooping: refs.builderBlockLooping.value === "yes"
  };

  if (editingId) {
    state.blocks = state.blocks.map((item) => item.id === editingId ? block : item);
  } else {
    state.blocks.unshift(block);
  }
  if (!state.activeBlockId) {
    state.activeBlockId = block.id;
  } else if (editingId && state.activeBlockId === editingId) {
    state.activeBlockId = block.id;
  }
  persistState();

  resetBlockBuilderForm();
  refs.blockBuilder.classList.add("hidden");
  renderDataViews();
  showToast(editingId ? "Block updated" : "Block saved");
}

function renderDataViews() {
  renderToday();
  renderRoutines();
  renderProgress();
  renderBodyHistory();
  renderCoachChatPage();
  renderPlannerPanels();
  refreshRoutineLogOptions();
}

function renderToday() {
  const summary = buildSummary();
  const primaryGuidance = summary.guidance[0];
  const readinessClass = primaryGuidance ? emphasisClass(primaryGuidance.emphasis) : "emphasis-mixed";

  refs.todayHeadline.textContent = primaryGuidance ? primaryGuidance.title : "Train with direction";
  refs.readinessScore.textContent = `${summary.readiness.value}%`;
  refs.readinessLabel.textContent = summary.readiness.label;
  refs.readinessLabel.className = `hero-score-label ${readinessClass}`;
  refs.todaySummary.textContent = primaryGuidance
    ? primaryGuidance.nextBestOption
    : "Once you log a few sessions and body reads, the app will get more specific.";
  refs.todayAdvanceWeek.disabled = !getActiveBlock();

  refs.metricGrid.innerHTML = summary.metrics.map((metric) => `
    <article class="metric-card">
      <div class="metric-label">${escapeHtml(metric.label)}</div>
      <div class="metric-value">${escapeHtml(metric.value)}</div>
      <div class="metric-detail">${escapeHtml(metric.detail)}</div>
    </article>
  `).join("");

  refs.guidanceList.innerHTML = summary.guidance.length
    ? summary.guidance.map((card) => `
      <article class="guidance-card">
        <div class="list-row-top">
          <div>
            <div class="list-title">${escapeHtml(card.title)}</div>
            <div class="list-meta">${escapeHtml(card.summary)}</div>
          </div>
          <span class="emphasis-badge ${emphasisClass(card.emphasis)}">${escapeHtml(capitalize(card.emphasis))}</span>
        </div>
        <div class="body-copy">${escapeHtml(card.nextBestOption)}</div>
      </article>
    `).join("")
    : buildEmptyCard("No guidance yet", "Log a workout or body check-in to start getting suggestions.");

  const activeBlock = getActiveBlock();
  refs.activeBlockCard.innerHTML = activeBlock
    ? `
      <article class="list-card">
        <div class="list-row-top">
          <div>
            <div class="list-title">${escapeHtml(activeBlock.name)}</div>
            <div class="list-meta">${escapeHtml(activeBlock.focus || "Use your block to remove decision fatigue.")}</div>
          </div>
          <button class="button button-secondary compact" type="button" data-today-advance>Advance</button>
        </div>
        <div class="helper-text" style="margin-top:0.75rem">${escapeHtml(activeWeekLabel(activeBlock))}</div>
        <div class="helper-text" style="margin-top:0.45rem">Tap any session to start it now, even if you move it away from its planned day.</div>
        <div class="stack-list" style="margin-top:0.8rem">
          ${currentBlockWeek(activeBlock).plannedSessions.map((session) => renderPlannedSessionCard(session)).join("")}
        </div>
      </article>
    `
    : buildEmptyCard("No block yet", "Create a weekly loop in the Routines tab when you are ready.");

  refs.recentWorkouts.innerHTML = summary.recent.length
    ? summary.recent.map((workout) => renderWorkoutCard(workout)).join("")
    : buildEmptyCard("Nothing logged yet", "Open Log and add your first session.");
}

function renderRoutines() {
  refs.blockList.innerHTML = state.blocks.length
    ? state.blocks.map((block) => {
      const active = state.activeBlockId === block.id;
      const week = currentBlockWeek(block);
      return `
        <article class="list-card">
          <div class="list-row-top">
            <div>
              <div class="list-title">${escapeHtml(block.name)}</div>
              <div class="list-meta">${escapeHtml(block.focus || "Structured block")}</div>
            </div>
            ${active ? '<span class="emphasis-badge emphasis-power">Active</span>' : ""}
          </div>
          <div class="helper-text" style="margin-top:0.75rem">${escapeHtml(activeWeekLabel(block))}</div>
          <div class="stack-list" style="margin-top:0.8rem">
            ${week.plannedSessions.map((session) => renderPlannedSessionCard(session)).join("")}
          </div>
          <div class="quick-actions tight" style="margin-top:0.8rem">
            <button class="button button-secondary compact" type="button" data-set-active-block="${block.id}" ${active ? "disabled" : ""}>Use this block</button>
            <button class="button button-primary compact" type="button" data-advance-block="${block.id}">Advance week</button>
            <button class="button button-secondary compact" type="button" data-edit-block="${block.id}">Edit</button>
            <button class="button button-danger compact" type="button" data-delete-block="${block.id}">Delete</button>
          </div>
        </article>
      `;
    }).join("")
    : buildEmptyCard("No blocks yet", "Add a block when you want a 4 to 6 week loop or any custom circuit.");

  refs.routineList.innerHTML = state.routines.length
    ? state.routines.map((routine) => `
      <article class="list-card">
        <div class="list-row-top">
          <div>
            <div class="list-title">${escapeHtml(routine.name)}</div>
            <div class="list-meta">${escapeHtml(routineKinds[routine.kind] || routine.kind)} • ${routine.estimatedMinutes} min</div>
          </div>
          <span class="small-tag" style="background:${sessionKinds[routine.sessionKind].color}">
            ${escapeHtml(sessionKinds[routine.sessionKind].label)}
          </span>
        </div>
        <div class="helper-text" style="margin-top:0.75rem">${escapeHtml(routine.notes || sessionKinds[routine.sessionKind].description)}</div>
        <div class="stack-list" style="margin-top:0.8rem">
          ${routine.exercises.length
            ? routine.exercises.map((exercise) => `
              <div class="list-card">
                <div class="list-title">${escapeHtml(exercise.name)}</div>
                <div class="list-meta">${exercise.targetSets} sets • ${escapeHtml(exercise.targetReps)}</div>
                ${exerciseTemplateDefaultsSummary(exercise) ? `<div class="list-meta" style="margin-top:0.35rem">${escapeHtml(exerciseTemplateDefaultsSummary(exercise))}</div>` : ""}
                ${exercise.notes ? `<div class="helper-text" style="margin-top:0.4rem">${escapeHtml(exercise.notes)}</div>` : ""}
              </div>
            `).join("")
            : `<div class="empty-card">This routine is mostly duration and effort based.</div>`
          }
        </div>
        <div class="quick-actions tight card-actions">
          <button class="button button-primary compact" type="button" data-log-routine="${routine.id}">Log this routine</button>
          <button class="button button-secondary compact" type="button" data-edit-routine="${routine.id}">Edit routine</button>
          <button class="button button-danger compact" type="button" data-delete-routine="${routine.id}">Delete routine</button>
        </div>
      </article>
    `).join("")
    : buildEmptyCard("No routines yet", "Create your first repeatable gym or conditioning session above.");
}

function renderPlannerPanels() {
  if (!refs.surfPlanSummary) {
    return;
  }

  const installedBlock = getSurfFirstBlock();
  const planner = plannerSettings();
  const googleCalendar = planner.googleCalendar;
  const profile = buildTrainingHistoryProfile();
  const strategy = buildSurfFirstPlanStrategy(profile);
  const needsHostedOrigin = location.protocol === "file:";
  const linkedCalendarLabel = googleCalendar.calendarId
    ? `${googleCalendar.calendarName || "PulseBoard Surf-First Base"} linked`
    : "Not linked yet";
  const lastSyncLabel = googleCalendar.lastSyncedAt
    ? formatDate(googleCalendar.lastSyncedAt, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Not synced yet";

  refs.surfPlanSummary.innerHTML = buildSurfFirstPlanSummaryMarkup(installedBlock, profile, strategy);
  refs.installSurfPlan.textContent = installedBlock ? "Refresh surf-first base plan" : "Install surf-first base plan";
  renderInlinePanelStatus(refs.surfPlanStatus, ui.surfPlanStatus.message, ui.surfPlanStatus.tone);

  refs.googleCalendarClientId.value = googleCalendar.clientId || "";
  refs.googleCalendarName.value = googleCalendar.calendarName || "PulseBoard Surf-First Base";
  refs.googleCalendarStartDate.value = googleCalendar.syncStartDate || CAFE_SEASON_START;
  refs.googleCalendarWeeks.value = googleCalendar.weeksToSync || 6;
  refs.googleCalendarCafeShifts.checked = googleCalendar.includeCafeShifts;
  refs.googleCalendarAuthorize.disabled = ui.calendarSync.processing || needsHostedOrigin || !googleCalendar.clientId.trim();
  refs.googleCalendarSync.disabled = ui.calendarSync.processing || needsHostedOrigin || !googleCalendar.clientId.trim();
  refs.googleCalendarClear.disabled = ui.calendarSync.processing || (!googleCalendar.calendarId && !googleCalendar.clientId);

  const calendarStatus = ui.calendarSync.status
    || (needsHostedOrigin
      ? "Google Calendar sync needs the app on a real web address because Google OAuth does not work from file://."
      : `${linkedCalendarLabel}. Last sync: ${lastSyncLabel}.`);
  const calendarTone = ui.calendarSync.status
    ? ui.calendarSync.tone
    : (needsHostedOrigin ? "error" : (googleCalendar.calendarId ? "success" : ""));
  renderInlinePanelStatus(refs.googleCalendarStatus, calendarStatus, calendarTone);
}

function buildSurfFirstPlanSummaryMarkup(installedBlock, profile = buildTrainingHistoryProfile(), strategy = buildSurfFirstPlanStrategy(profile)) {
  const metrics = [
    {
      label: "History read",
      value: profile.sampleWorkouts
        ? `${profile.sampleWorkouts} workouts / ${profile.weekCount} weeks`
        : "Starter profile",
      detail: profile.sampleWorkouts
        ? "The base now reads your logged patterns instead of assuming one generic split fits everything."
        : "Log more training and the plan will swap more of the defaults for your real anchors."
    },
    {
      label: "Observed strength",
      value: `${formatNumber(profile.observedLowerPerWeek)} lower / ${formatNumber(profile.observedUpperPerWeek)} upper`,
      detail: "Average weekly strength touches from the history sample. This is the pattern the planner now tries to respect."
    },
    {
      label: "Planned dose",
      value: `${strategy.lowerSessions} lower + ${strategy.upperSessions} upper`,
      detail: strategy.useLowerSupportReset
        ? "The second lower touch stays short so strength holds without turning the week into a heavy two-leg-day grind."
        : "One lower anchor stays in place when the current history does not clearly justify a second touch yet."
    },
    {
      label: "Exercise anchors",
      value: plannerAnchorLabel(
        [
          profile.preferredExercises.lowerSquat,
          profile.preferredExercises.upperPullMain,
          profile.preferredExercises.lowerPosteriorMain,
          profile.preferredExercises.upperGymPull
        ],
        "Back Squat • Pull-Up • Romanian Deadlift • Lat Pulldown",
        4
      ),
      detail: "These recurring lifts now shape the suggested routines instead of the plan starting from a blank template."
    }
  ];

  const days = surfFirstWeekBlueprint(profile, strategy);

  return `
    <div class="coach-plan-metrics">
      ${metrics.map((item) => `
        <article class="coach-plan-card">
          <p class="eyebrow">${escapeHtml(item.label)}</p>
          <div class="list-title">${escapeHtml(item.value)}</div>
          <div class="helper-text">${escapeHtml(item.detail)}</div>
        </article>
      `).join("")}
    </div>

    <div class="coach-plan-card">
      <p class="eyebrow">${installedBlock ? "Installed" : "What the week looks like"}</p>
      <div class="list-title">${installedBlock ? `${installedBlock.name} is active` : "Low-cost land training around surf"}</div>
      <div class="helper-text">
        Built around your logged patterns instead of only a preset: surf still stays first, upper work stays present as one cali touch plus one gym-balance touch, the second lower touch stays in, and a weekly long run now has a clear place before the later speed run.
      </div>
    </div>

    <div class="coach-plan-week">
      ${days.map((item) => `
        <article class="coach-plan-day">
          <div class="coach-plan-dayhead">
            <div class="list-title">${escapeHtml(item.dayLabel)}</div>
            <span class="small-tag" style="background:${sessionKinds[item.kind].color}">${escapeHtml(sessionKinds[item.kind].label)}</span>
          </div>
          <div>${escapeHtml(item.focus)}</div>
          <div class="helper-text">${escapeHtml(item.detail)}</div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderInlinePanelStatus(element, message = "", tone = "") {
  if (!element) {
    return;
  }

  element.classList.toggle("hidden", !message);
  element.classList.toggle("is-error", tone === "error");
  element.classList.toggle("is-success", tone === "success");
  element.textContent = message || "";
}

function plannerSettings() {
  if (!state.planner) {
    state.planner = defaultPlannerState();
  }
  return state.planner;
}

function googleCalendarSettings() {
  return plannerSettings().googleCalendar;
}

function defaultPlannerState() {
  return {
    surfFirstBlockId: null,
    googleCalendar: {
      clientId: "",
      calendarId: "",
      calendarName: "PulseBoard Surf-First Base",
      syncStartDate: CAFE_SEASON_START,
      weeksToSync: 6,
      includeCafeShifts: true,
      lastSyncedAt: ""
    }
  };
}

function normalizePlannerState(rawPlanner = {}, fallbackPlanner = defaultPlannerState()) {
  return {
    surfFirstBlockId: typeof rawPlanner?.surfFirstBlockId === "string" ? rawPlanner.surfFirstBlockId : fallbackPlanner.surfFirstBlockId,
    googleCalendar: {
      clientId: typeof rawPlanner?.googleCalendar?.clientId === "string" ? rawPlanner.googleCalendar.clientId : fallbackPlanner.googleCalendar.clientId,
      calendarId: typeof rawPlanner?.googleCalendar?.calendarId === "string" ? rawPlanner.googleCalendar.calendarId : fallbackPlanner.googleCalendar.calendarId,
      calendarName: typeof rawPlanner?.googleCalendar?.calendarName === "string" && rawPlanner.googleCalendar.calendarName.trim()
        ? rawPlanner.googleCalendar.calendarName.trim()
        : fallbackPlanner.googleCalendar.calendarName,
      syncStartDate: normalizeDateString(rawPlanner?.googleCalendar?.syncStartDate || fallbackPlanner.googleCalendar.syncStartDate),
      weeksToSync: clamp(Math.round(Number(rawPlanner?.googleCalendar?.weeksToSync || fallbackPlanner.googleCalendar.weeksToSync)), 1, 12),
      includeCafeShifts: typeof rawPlanner?.googleCalendar?.includeCafeShifts === "boolean"
        ? rawPlanner.googleCalendar.includeCafeShifts
        : fallbackPlanner.googleCalendar.includeCafeShifts,
      lastSyncedAt: typeof rawPlanner?.googleCalendar?.lastSyncedAt === "string" ? rawPlanner.googleCalendar.lastSyncedAt : fallbackPlanner.googleCalendar.lastSyncedAt
    }
  };
}

function persistPlannerSettingsFromInputs() {
  const settings = googleCalendarSettings();
  settings.clientId = refs.googleCalendarClientId.value.trim();
  settings.calendarName = refs.googleCalendarName.value.trim() || "PulseBoard Surf-First Base";
  settings.syncStartDate = normalizeDateString(refs.googleCalendarStartDate.value || CAFE_SEASON_START);
  settings.weeksToSync = clamp(Math.round(Number(refs.googleCalendarWeeks.value) || 6), 1, 12);
  settings.includeCafeShifts = refs.googleCalendarCafeShifts.checked;
  persistState();
  renderPlannerPanels();
}

function plannerWeekKey(dateString) {
  const monday = localDate(dateString);
  const weekdayIndex = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - weekdayIndex);
  return normalizeDateString(monday.toISOString());
}

function createAreaScoreMap() {
  return Object.fromEntries(bodyAreas.map((area) => [area.key, 0]));
}

function workoutExerciseText(workout = {}) {
  return (workout.exerciseLogs || [])
    .map((entry) => entry?.name || "")
    .join(" ")
    .toLowerCase();
}

function workoutAreaScores(workout = {}) {
  const scores = createAreaScoreMap();

  (workout.loadedAreas || []).forEach((area) => {
    if (scores[area] != null) {
      scores[area] += 2;
    }
  });

  (workout.exerciseLogs || []).forEach((entry) => {
    inferAreasFromImportedExercise(entry?.name || "").forEach((area) => {
      if (scores[area] != null) {
        scores[area] += 1;
      }
    });
  });

  const text = `${workout.title || ""} ${workout.notes || ""}`.toLowerCase();

  if (/\b(?:lower|leg day|legs?|squat|deadlift|hinge|posterior|glute|hamstring)\b/.test(text)) {
    scores.legs += 1;
    scores.glutes += 1;
  }

  if (/\b(?:upper|bench|press|row|pull|push|dip|chin|shoulder)\b/.test(text)) {
    scores.chest += 1;
    scores.back += 1;
    scores.shoulders += 1;
    scores.arms += 1;
  }

  return scores;
}

function isStrengthLikeWorkout(workout = {}) {
  const emphasis = sessionKinds[workout.kind]?.emphasis;
  const text = `${workout.title || ""} ${workout.notes || ""} ${workoutExerciseText(workout)}`.toLowerCase();

  return emphasis === "strength"
    || emphasis === "power"
    || (
      workout.kind === "functional"
      && (
        (workout.exerciseLogs || []).length > 0
        || /\b(?:upper|lower|strength|gym|pull|push|calisthenics|skill)\b/.test(text)
      )
    );
}

function workoutHasLowerLiftPattern(workout = {}) {
  const text = `${workout.title || ""} ${workout.notes || ""} ${workoutExerciseText(workout)}`.toLowerCase();
  return /\b(?:front squat|back squat|squat|deadlift|rdl|romanian deadlift|lunge|split squat|leg press|hip thrust|leg curl|leg extension|calf raise|step up)\b/.test(text);
}

function workoutHasUpperLiftPattern(workout = {}) {
  const text = `${workout.title || ""} ${workout.notes || ""} ${workoutExerciseText(workout)}`.toLowerCase();
  return /\b(?:bench|press|row|pull[\s-]*up|chin[\s-]*up|lat pull|dip|curl|pushdown|lateral raise|face pull|landmine)\b/.test(text);
}

function workoutTargetsLowerStrength(workout = {}) {
  if (!isStrengthLikeWorkout(workout)) {
    return false;
  }

  const scores = workoutAreaScores(workout);
  const lowerScore = scores.legs + scores.glutes;
  return lowerScore >= 3 && (workout.kind === "strength" || workoutHasLowerLiftPattern(workout));
}

function workoutTargetsUpperStrength(workout = {}) {
  if (!isStrengthLikeWorkout(workout)) {
    return false;
  }

  const scores = workoutAreaScores(workout);
  const upperScore = scores.chest + scores.back + scores.shoulders + scores.arms;
  return upperScore >= 4 && (workout.kind === "strength" || workoutHasUpperLiftPattern(workout));
}

function favoriteHistoryExercise(workouts = [], patterns = [], fallbackName = "", workoutFilter = () => true) {
  const counts = new Map();

  workouts.forEach((workout) => {
    if (!workoutFilter(workout)) {
      return;
    }

    (workout.exerciseLogs || []).forEach((entry) => {
      const name = entry?.name?.trim();
      if (!name) {
        return;
      }

      if (patterns.some((pattern) => pattern.test(name))) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    });
  });

  if (!counts.size) {
    return fallbackName;
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    [0][0];
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function plannerAnchorLabel(values = [], fallback = "", limit = 3) {
  const selected = uniqueValues(values).slice(0, limit);
  return selected.length ? selected.join(" • ") : fallback;
}

function getPreviousExerciseEntryFromWorkouts(exerciseName, workouts = [], { excludeWorkoutId = null } = {}) {
  for (const workout of [...(Array.isArray(workouts) ? workouts : [])].sort((a, b) => compareDates(b.date, a.date))) {
    if (excludeWorkoutId && workout.id === excludeWorkoutId) {
      continue;
    }

    for (const entry of workout.exerciseLogs || []) {
      if (entry.name?.toLowerCase() !== exerciseName.toLowerCase()) {
        continue;
      }

      return {
        ...entry,
        workoutId: workout.id,
        workoutDate: workout.date,
        workoutTitle: workout.title
      };
    }
  }

  return null;
}

function personalizeRoutineExercise(baseExercise, preferredName, { workouts = null } = {}) {
  const name = preferredName || baseExercise.name;
  const latestEntry = Array.isArray(workouts)
    ? getPreviousExerciseEntryFromWorkouts(name, workouts)
    : getPreviousExerciseEntry(name);
  const summary = latestEntry ? summarizeExerciseLog(latestEntry) : null;

  return {
    ...baseExercise,
    id: uid(),
    name,
    targetWeight: summary?.keyWeight ?? baseExercise.targetWeight ?? null,
    targetLogReps: summary?.reps ?? baseExercise.targetLogReps ?? null
  };
}

function buildTrainingHistoryProfile(workouts = state.workouts) {
  const fallbackExercises = PERSONAL_HISTORY_BASELINE.fallbackExercises;
  const sorted = [...(Array.isArray(workouts) ? workouts : [])].sort((a, b) => compareDates(b.date, a.date));
  if (!sorted.length) {
    return {
      sampleWorkouts: 0,
      weekCount: 0,
      observedLowerPerWeek: 0,
      observedUpperPerWeek: 0,
      observedQualityRunsPerWeek: 0,
      baseline: PERSONAL_HISTORY_BASELINE,
      preferredExercises: {
        lowerSquat: fallbackExercises.lowerSquat,
        lowerQuadPress: fallbackExercises.lowerQuadPress,
        lowerPosteriorMain: fallbackExercises.lowerPosteriorMain,
        lowerPosteriorSupport: fallbackExercises.lowerPosteriorSupport,
        lowerSingle: fallbackExercises.lowerSingle,
        lowerQuadAccessory: fallbackExercises.lowerQuadAccessory,
        lowerHamAccessory: fallbackExercises.lowerHamAccessory,
        lowerCalves: fallbackExercises.lowerCalves,
        upperPullMain: fallbackExercises.upperPullMain,
        upperGymPull: fallbackExercises.upperGymPull,
        upperRow: fallbackExercises.upperRow,
        upperPressMain: fallbackExercises.upperPressMain,
        upperDip: fallbackExercises.upperDip,
        upperVerticalPress: fallbackExercises.upperVerticalPress,
        upperAccessory: fallbackExercises.upperAccessory,
        upperScap: fallbackExercises.upperScap,
        core: fallbackExercises.core
      },
      signatureExercises: {
        lower: [fallbackExercises.lowerSquat, fallbackExercises.lowerSingle, fallbackExercises.lowerPosteriorMain],
        upper: [fallbackExercises.upperPullMain, fallbackExercises.upperGymPull, fallbackExercises.upperPressMain]
      }
    };
  }

  const recent = sorted.filter((workout) => daysAgo(workout.date) <= PERSONAL_PLAN_LOOKBACK_DAYS - 1);
  const fallbackCount = Math.min(sorted.length, Math.max(PERSONAL_PLAN_MIN_HISTORY_WORKOUTS, 40));
  const sample = recent.length >= PERSONAL_PLAN_MIN_HISTORY_WORKOUTS ? recent : sorted.slice(0, fallbackCount);
  const weekCount = Math.max(1, new Set(sample.map((workout) => plannerWeekKey(workout.date))).size);

  const observedLowerPerWeek = sample.filter((workout) => workoutTargetsLowerStrength(workout)).length / weekCount;
  const observedUpperPerWeek = sample.filter((workout) => workoutTargetsUpperStrength(workout)).length / weekCount;
  const observedQualityRunsPerWeek = sample.filter((workout) => isQualityRunSession(workout)).length / weekCount;

  const preferredExercises = {
    lowerSquat: favoriteHistoryExercise(sample, [/\bfront squat\b/i, /\bback squat\b/i, /\bsquat\b/i], fallbackExercises.lowerSquat, workoutTargetsLowerStrength),
    lowerQuadPress: favoriteHistoryExercise(sample, [/\bhack squat\b/i, /\bleg press\b/i, /\bgoblet squat\b/i], fallbackExercises.lowerQuadPress, workoutTargetsLowerStrength),
    lowerPosteriorMain: favoriteHistoryExercise(sample, [/\bromanian deadlift\b/i, /\brdl\b/i, /\bdeadlift\b/i], fallbackExercises.lowerPosteriorMain, workoutTargetsLowerStrength),
    lowerPosteriorSupport: favoriteHistoryExercise(sample, [/\bhip thrust\b/i, /\bglute bridge\b/i, /\bback extension\b/i], fallbackExercises.lowerPosteriorSupport, workoutTargetsLowerStrength),
    lowerSingle: favoriteHistoryExercise(sample, [/\bbulgarian\b/i, /\bsplit squat\b/i, /\blunge\b/i, /\bstep up\b/i], fallbackExercises.lowerSingle, workoutTargetsLowerStrength),
    lowerQuadAccessory: favoriteHistoryExercise(sample, [/\bleg extension\b/i, /\bsissy squat\b/i, /\bquad raise\b/i], fallbackExercises.lowerQuadAccessory, workoutTargetsLowerStrength),
    lowerHamAccessory: favoriteHistoryExercise(sample, [/\bham(?:string)?\s*curl\b/i, /\bleg curl\b/i, /\blower back\b/i, /\bsquize\b/i], fallbackExercises.lowerHamAccessory, workoutTargetsLowerStrength),
    lowerCalves: favoriteHistoryExercise(sample, [/\bcalf raise\b/i, /\btibialis\b/i], fallbackExercises.lowerCalves, workoutTargetsLowerStrength),
    upperPullMain: favoriteHistoryExercise(sample, [/\bpull[\s-]*up\b/i, /\bchin[\s-]*up\b/i], fallbackExercises.upperPullMain, workoutTargetsUpperStrength),
    upperGymPull: favoriteHistoryExercise(sample, [/\blat pull/i, /\bpull[\s-]*down\b/i, /\blat pd\b/i, /\bchin machine\b/i], fallbackExercises.upperGymPull, workoutTargetsUpperStrength),
    upperRow: favoriteHistoryExercise(sample, [/\brow\b/i, /\bseated row\b/i, /\bt-bar row\b/i], fallbackExercises.upperRow, workoutTargetsUpperStrength),
    upperPressMain: favoriteHistoryExercise(sample, [/\bbench\b/i, /\bincline\b/i, /\bchest press\b/i], fallbackExercises.upperPressMain, workoutTargetsUpperStrength),
    upperDip: favoriteHistoryExercise(sample, [/\bdips?\b/i, /\btricep push up\b/i], fallbackExercises.upperDip, workoutTargetsUpperStrength),
    upperVerticalPress: favoriteHistoryExercise(sample, [/\boverhead press\b/i, /\bshoulder press\b/i, /\bmilitary press\b/i, /\bhspu\b/i], fallbackExercises.upperVerticalPress, workoutTargetsUpperStrength),
    upperAccessory: favoriteHistoryExercise(sample, [/\blateral raise\b/i, /\bfront raise\b/i, /\brear delt\b/i], fallbackExercises.upperAccessory, workoutTargetsUpperStrength),
    upperScap: favoriteHistoryExercise(sample, [/\bface pull\b/i, /\bstraight-arm lat\b/i, /\breverse pec deck\b/i], fallbackExercises.upperScap, workoutTargetsUpperStrength),
    core: favoriteHistoryExercise(sample, [/\bplank\b/i, /\bleg raise\b/i, /\bhang(?:ing)?\b/i, /\bdragon flag\b/i], fallbackExercises.core, () => true)
  };

  return {
    sampleWorkouts: sample.length,
    weekCount,
    observedLowerPerWeek,
    observedUpperPerWeek,
    observedQualityRunsPerWeek,
    baseline: PERSONAL_HISTORY_BASELINE,
    preferredExercises,
    signatureExercises: {
      lower: uniqueValues([preferredExercises.lowerSquat, preferredExercises.lowerSingle, preferredExercises.lowerPosteriorMain]),
      upper: uniqueValues([preferredExercises.upperPullMain, preferredExercises.upperGymPull, preferredExercises.upperPressMain])
    }
  };
}

function buildSurfFirstPlanStrategy(profile = buildTrainingHistoryProfile()) {
  const lowerSessions = Math.max(PERSONAL_HISTORY_BASELINE.minimumLowerSessions, profile.observedLowerPerWeek >= 1.6 ? 2 : 1);
  const upperSessions = Math.max(PERSONAL_HISTORY_BASELINE.minimumUpperSessions, profile.observedUpperPerWeek >= 1.6 ? 2 : 1);
  const qualityRuns = Math.max(PERSONAL_HISTORY_BASELINE.minimumQualityRuns, profile.observedQualityRunsPerWeek >= 1.35 ? 2 : 1);

  return {
    lowerSessions,
    upperSessions,
    qualityRuns,
    useLowerSupportReset: lowerSessions > 1,
    supportsOptionalLongRun: PERSONAL_HISTORY_BASELINE.supportsOptionalLongRun,
    preferredLowerSplit: PERSONAL_HISTORY_BASELINE.preferredLowerSplit,
    preferredUpperSplit: PERSONAL_HISTORY_BASELINE.preferredUpperSplit
  };
}

function getSurfFirstBlock() {
  return state.blocks.find((block) => block.id === plannerSettings().surfFirstBlockId)
    || state.blocks.find((block) => block.systemKey === SURF_FIRST_BLOCK_KEY)
    || null;
}

function installSurfFirstBasePlan({ silent = false } = {}) {
  const profile = buildTrainingHistoryProfile();
  const strategy = buildSurfFirstPlanStrategy(profile);
  const routineIds = {};

  surfFirstPlanRoutines(profile, strategy).forEach((routine) => {
    routineIds[routine.systemKey] = upsertSystemRoutine(routine);
  });

  const block = buildSurfFirstPlanBlock(routineIds, profile, strategy);
  const blockId = upsertSystemBlock(block);
  plannerSettings().surfFirstBlockId = blockId;
  state.activeBlockId = blockId;
  persistState();
  renderDataViews();
  if (!silent) {
    ui.surfPlanStatus = {
      message: `Surf-first base plan installed and set active. The week now prioritizes daily surf windows, ${strategy.lowerSessions} lower-body touch${strategy.lowerSessions === 1 ? "" : "es"}, ${strategy.upperSessions} upper sessions, 1 weekly long run, ${strategy.qualityRuns} sharper run anchor${strategy.qualityRuns === 1 ? "" : "s"}, and protected grocery / meal-prep anchors.`,
      tone: "success"
    };
  }
  renderPlannerPanels();
  if (!silent) {
    showToast("Surf-first base plan installed");
  }
}

function surfFirstPlanRoutines(profile = buildTrainingHistoryProfile(), strategy = buildSurfFirstPlanStrategy(profile)) {
  const preferred = profile.preferredExercises;

  return [
    {
      systemKey: "surf-first-lower-hold-v1",
      name: "Surf-First Lower A: Squat + Quads",
      kind: "strength",
      sessionKind: "strength",
      estimatedMinutes: 55,
      notes: `Main goal: keep ${preferred.lowerSquat.toLowerCase()} and your quad pattern alive without letting the session eat the whole day. This is the main squat-biased lower anchor.`,
      exercises: [
        personalizeRoutineExercise({ name: "Back Squat", targetSets: 3, targetReps: "4-6", targetLogReps: 5, targetWeight: 60, targetEffortPercent: 85, targetRestSeconds: 150, notes: "Controlled. Stop before the grind." }, preferred.lowerSquat),
        personalizeRoutineExercise({ name: "Hack Squat", targetSets: 3, targetReps: "6-10", targetLogReps: 8, targetWeight: null, targetEffortPercent: 82, targetRestSeconds: 120, notes: "Use a machine press pattern to feed quads without needing another heavy barbell slot." }, preferred.lowerQuadPress),
        personalizeRoutineExercise({ name: "Bulgarian Split Squat", targetSets: 3, targetReps: "6-8 each", targetLogReps: 8, targetWeight: 22, targetEffortPercent: 85, targetRestSeconds: 105, notes: "Single-leg control matters more than extra volume." }, preferred.lowerSingle),
        personalizeRoutineExercise({ name: "Leg Extension", targetSets: 2, targetReps: "10-15", targetLogReps: 12, targetWeight: null, targetEffortPercent: 78, targetRestSeconds: 60, notes: "Simple quad finish." }, preferred.lowerQuadAccessory),
        personalizeRoutineExercise({ name: "Calf Raise", targetSets: 2, targetReps: "10-12", targetLogReps: 12, targetWeight: 90, targetEffortPercent: 80, targetRestSeconds: 75, notes: "Smooth tempo." }, preferred.lowerCalves)
      ]
    },
    {
      systemKey: "surf-first-lower-support-v1",
      name: "Surf-First Lower B: Posterior Support",
      kind: "strength",
      sessionKind: "strength",
      estimatedMinutes: 40,
      notes: `Short second lower-body touch for weeks where one leg session is not enough. This one is hinge / glute / ham biased so you keep two lower exposures without turning both into quad-smashers.`,
      exercises: [
        personalizeRoutineExercise({ name: "Romanian Deadlift", targetSets: 3, targetReps: "6-8", targetLogReps: 6, targetWeight: 75, targetEffortPercent: 80, targetRestSeconds: 105, notes: "Leave a little in reserve." }, preferred.lowerPosteriorMain),
        personalizeRoutineExercise({ name: "Hip Thrust", targetSets: 3, targetReps: "8-10", targetLogReps: 10, targetWeight: 90, targetEffortPercent: 82, targetRestSeconds: 90, notes: "Glute support without another huge fatigue bill." }, preferred.lowerPosteriorSupport),
        personalizeRoutineExercise({ name: "Bulgarian Split Squat", targetSets: 2, targetReps: "6 each", targetLogReps: 6, targetWeight: 20, targetEffortPercent: 80, targetRestSeconds: 90, notes: "Keep the single-leg pattern alive." }, preferred.lowerSingle),
        personalizeRoutineExercise({ name: "Hamstring Curl", targetSets: 2, targetReps: "10-12", targetLogReps: 10, targetWeight: null, targetEffortPercent: 78, targetRestSeconds: 60, notes: "Easy to recover from, useful to keep." }, preferred.lowerHamAccessory)
      ]
    },
    {
      systemKey: "surf-first-upper-skill-v1",
      name: "Surf-First Upper A: Cali Pull Skill",
      kind: "mixed",
      sessionKind: "functional",
      estimatedMinutes: 50,
      notes: `Outdoor calisthenics first choice. ${preferred.upperPullMain}, ${preferred.upperDip.toLowerCase()}, hanging work, and trunk control matter more than bodybuilding fatigue right now. Bare tag en masse reps, keep volume over pauser, and make it faster and more useful for what you actually need.`,
      exercises: [
        personalizeRoutineExercise({ name: "Pull-Up", targetSets: 4, targetReps: "4-6", targetLogReps: 5, targetEffortPercent: 85, targetRestSeconds: 120, notes: "Stay strict." }, preferred.upperPullMain),
        personalizeRoutineExercise({ name: "Dips", targetSets: 3, targetReps: "6-8", targetLogReps: 8, targetWeight: 5, targetEffortPercent: 85, targetRestSeconds: 120, notes: "Clean reps first." }, preferred.upperDip),
        personalizeRoutineExercise({ name: "Row", targetSets: 3, targetReps: "6-10", targetLogReps: 8, targetWeight: 40, targetEffortPercent: 80, targetRestSeconds: 90, notes: "One row pattern keeps the session useful if skill quality drops." }, preferred.upperRow),
        personalizeRoutineExercise({ name: "Weighted Plank", targetSets: 3, targetReps: "30-45 s", targetSetSeconds: 40, targetRestSeconds: 75, notes: "Trunk tension." }, preferred.core),
        { id: uid(), name: "Human Flag / HSPU Skill", targetSets: 3, targetReps: "2-4 quality reps", targetRestSeconds: 120, notes: "Only if the shoulders feel good." }
      ]
    },
    {
      systemKey: "surf-first-long-run-v1",
      name: "Weekly Long Run / Engine Hold",
      kind: "conditioning",
      sessionKind: "run",
      estimatedMinutes: 70,
      notes: "Weekly long-run anchor placed earlier in the week. This protects the aerobic engine and lets the sharper speed touch wait until later instead of landing too close to heavy lower-body work.",
      exercises: []
    },
    {
      systemKey: "surf-first-upper-pull-v1",
      name: "Surf-First Upper B: Gym Upper Balance",
      kind: "strength",
      sessionKind: "strength",
      estimatedMinutes: 55,
      notes: `Gym-first upper touch. Your notebook pages keep circling back to one mixed upper day with a vertical pull, a row, one press anchor, and a little shoulder support instead of a pure push split.`,
      exercises: [
        personalizeRoutineExercise({ name: "Lat Pulldown", targetSets: 3, targetReps: "6-10", targetLogReps: 8, targetEffortPercent: 82, targetRestSeconds: 90, notes: "Vertical pull anchor for the gym-based upper touch." }, preferred.upperGymPull),
        personalizeRoutineExercise({ name: "Row", targetSets: 3, targetReps: "6-8", targetLogReps: 8, targetWeight: 45, targetEffortPercent: 80, targetRestSeconds: 90, notes: "Keep the shoulders balanced and the upper day useful." }, preferred.upperRow),
        personalizeRoutineExercise({ name: "Bench Press", targetSets: 3, targetReps: "4-6", targetLogReps: 5, targetWeight: 40, targetEffortPercent: 82, targetRestSeconds: 120, notes: "Simple heavy press anchor." }, preferred.upperPressMain),
        personalizeRoutineExercise({ name: "Shoulder Press", targetSets: 2, targetReps: "6-8", targetLogReps: 6, targetEffortPercent: 80, targetRestSeconds: 90, notes: "Controlled path. Leave some shoulder room for surf." }, preferred.upperVerticalPress),
        personalizeRoutineExercise({ name: "Face Pull", targetSets: 2, targetReps: "10-15", targetLogReps: 12, targetEffortPercent: 72, targetRestSeconds: 60, notes: "Scap support and shoulder health." }, preferred.upperScap)
      ]
    },
    {
      systemKey: "surf-first-run-sharpener-v1",
      name: "5k Hold Sharpener",
      kind: "conditioning",
      sessionKind: "run",
      estimatedMinutes: 40,
      notes: strategy.qualityRuns > 1
        ? "Your history can still support sharper run work on flatter or lower-value surf weeks, but it fits better later in the week than right after heavy lower-body work. Use this as the later speed touch when energy and ocean both allow it."
        : "Use this as the later-week sharper run when the ocean is flat or low-value. The steadier long run now sits earlier, and this one protects the speed without landing too close to heavy lower-body work.",
      exercises: []
    },
    {
      systemKey: "surf-first-swim-reset-v1",
      name: "Paddle Swim Reset",
      kind: "conditioning",
      sessionKind: "swim",
      estimatedMinutes: 35,
      notes: "Pool support for paddling rhythm, aerobic touch, and shoulder-friendly movement. Good fallback when the ocean is poor or the shoulders want cleaner volume. Think 800 to 1500 m easy with a few smooth 100 m efforts.",
      exercises: []
    },
    {
      systemKey: "surf-first-recovery-reset-v1",
      name: "Surf Reset Mobility",
      kind: "recovery",
      sessionKind: "mobility",
      estimatedMinutes: 25,
      notes: "Low-cost movement for shoulders, hips, thoracic spine, trunk, and breathing on surf-heavy or socially busy days.",
      exercises: [
        { id: uid(), name: "Shoulder Flow", targetSets: 2, targetReps: "5 min", notes: "" },
        { id: uid(), name: "Hip Mobility Flow", targetSets: 2, targetReps: "5 min", notes: "" },
        { id: uid(), name: "Thoracic Rotation", targetSets: 2, targetReps: "90 s", notes: "" }
      ]
    }
  ];
}

function surfFirstWeekBlueprint(profile = buildTrainingHistoryProfile(), strategy = buildSurfFirstPlanStrategy(profile)) {
  const preferred = profile.preferredExercises;
  const fridayEntry = strategy.useLowerSupportReset
    ? {
        dayIndex: 4,
        dayLabel: "Fri",
        focus: "Groceries + lower B posterior support",
        detail: `Treat groceries as training support, then use a short ${preferred.lowerPosteriorMain.toLowerCase()} + ${preferred.lowerPosteriorSupport.toLowerCase()} touch so two lower days fit without wrecking the week.`,
        kind: "strength",
        routineKey: "surf-first-lower-support-v1",
        sessionTitle: "Groceries + lower support reset",
        details: "Groceries stay protected. If the morning surf was big, shrink this to the shortest useful support version only.",
        calendar: {
          startTime: "13:30",
          endTime: "14:45",
          summary: "Groceries + lower B posterior support",
          description: "Treat groceries as training support, then do the shortest useful second lower-body touch: hinge, hip thrust, and one ham / unilateral accessory if recovery is good.",
          category: "strength",
          flexible: true
        }
      }
    : {
        dayIndex: 4,
        dayLabel: "Fri",
        focus: "Recovery, groceries, and keep the day light",
        detail: "This is the day that protects the rest of the week. Surf if it is good, but otherwise use a small recovery reset and keep the admin easy.",
        kind: "mobility",
        routineKey: "surf-first-recovery-reset-v1",
        sessionTitle: "Recovery reset + groceries",
        details: "Groceries are a real training-support task. If you surf, keep the rest of the day lower-cost.",
        calendar: {
          startTime: "13:30",
          endTime: "14:45",
          summary: "Groceries + recovery reset",
          description: "Treat groceries as training support. If surf is good, surf first and keep the rest of the day low-cost.",
          category: "life",
          flexible: true
        }
      };

  return [
    {
      dayIndex: 0,
      dayLabel: "Mon",
      focus: "Surf first, then lower A squat + quads",
      detail: `Keep ${preferred.lowerSquat.toLowerCase()}, ${preferred.lowerQuadPress.toLowerCase()}, and ${preferred.lowerSingle.toLowerCase()} alive with low volume and clean reps. If the surf was heavy, shorten the lift instead of forcing full volume.`,
      kind: "strength",
      routineKey: "surf-first-lower-hold-v1",
      sessionTitle: "Surf first / Lower A squat + quads",
      details: "Morning surf if the conditions are worth it. Midday lift is the anchor. Keep it to 45 to 55 minutes and stop before grinding.",
      calendar: {
        startTime: "13:45",
        endTime: "15:00",
        summary: "Lower A squat + quads",
        description: "Keep your main squat, quad press pattern, and unilateral support alive. If morning surf was big, keep only the shortest useful version.",
        category: "strength",
        flexible: true
      }
    },
    {
      dayIndex: 1,
      dayLabel: "Tue",
      focus: "Upper A cali pull skill",
      detail: `Use the outdoor park when possible. Prioritize ${preferred.upperPullMain.toLowerCase()}, ${preferred.upperDip.toLowerCase()}, hanging work, and trunk control over fatigue for its own sake.`,
      kind: "functional",
      routineKey: "surf-first-upper-skill-v1",
      sessionTitle: "Upper A cali pull skill",
      details: "If the shoulders are cooked from surf, cut the volume in half and keep only the best-quality skill reps.",
      calendar: {
        startTime: "13:45",
        endTime: "15:00",
        summary: "Upper A cali pull skill",
        description: "Outdoor first choice. Keep the reps clean and shorten it if the shoulders are cooked from surf.",
        category: "skill",
        flexible: true
      }
    },
    {
      dayIndex: 2,
      dayLabel: "Wed",
      focus: "Weekly long run anchor",
      detail: "This is the long-run slot in the week. It fits better here than forcing the sharper speed run too close to heavy lower-body work. If the ocean is excellent or the legs feel beat up, the swim reset is the fallback, not the default.",
      kind: "run",
      routineKey: "surf-first-long-run-v1",
      sessionTitle: "Weekly long run / engine hold",
      details: "Protect the aerobic engine here with a real long run. Keep the sharper speed touch for later in the week if the ocean is flat and energy stays good.",
      calendar: {
        startTime: "13:45",
        endTime: "15:15",
        summary: "Weekly long run / swim fallback",
        description: "Use this as the fixed long-run slot and move the sharper speed touch later in the week. If the surf is excellent or recovery is off, swap to the swim reset instead.",
        category: "run",
        flexible: true
      }
    },
    {
      dayIndex: 3,
      dayLabel: "Thu",
      focus: "Upper B gym upper balance",
      detail: `Keep ${preferred.upperGymPull.toLowerCase()}, ${preferred.upperRow.toLowerCase()}, and one press / shoulder-support pattern present so the second upper touch feels like your actual gym pages rather than a pure push day.`,
      kind: "strength",
      routineKey: "surf-first-upper-pull-v1",
      sessionTitle: "Upper B gym upper balance",
      details: "Gym or calisthenics park. If surf quality is excellent, do the shortest useful version only.",
      calendar: {
        startTime: "13:45",
        endTime: "15:00",
        summary: "Upper B gym upper balance",
        description: "Keep pull, row, and one press anchor present without turning the session into a drain.",
        category: "strength",
        flexible: true
      }
    },
    fridayEntry,
    {
      dayIndex: 5,
      dayLabel: "Sat",
      focus: "Best surf, social, or later-week speed touch",
      detail: "Keep this day flexible for waves and people first, but if the ocean is average this is the better slot for the sharper speed run. That lands better than intervals only two days after the heavy lower session.",
      kind: "run",
      routineKey: "surf-first-run-sharpener-v1",
      sessionTitle: "Surf priority / later-week speed touch",
      details: "If the surf is genuinely good, surf and move the sharpener. If the ocean is average, use this as the later-week speed slot.",
      calendar: {
        startTime: "17:00",
        endTime: "18:15",
        summary: "Later-week speed touch / surf buffer",
        description: "Keep this flexible for surf and people first, but if the ocean is average this is the better place for the sharper run touch.",
        category: "run",
        flexible: true
      }
    },
    {
      dayIndex: 6,
      dayLabel: "Sun",
      focus: "Meal prep, reset, and optional swim or surf",
      detail: "Meal prep keeps the whole week easier. Add a soft swim or surf only if it gives you energy instead of taking it away.",
      kind: "swim",
      routineKey: "surf-first-swim-reset-v1",
      sessionTitle: "Meal prep / swim reset / surf",
      details: "Meal prep is non-negotiable support work. If the ocean is calling, keep the extra training easy.",
      calendar: {
        startTime: "14:00",
        endTime: "16:00",
        summary: "Meal prep + week reset",
        description: "Meal prep is a real performance habit. Add an easy swim or surf only if it gives energy back.",
        category: "life",
        flexible: false
      }
    }
  ];
}

function buildSurfFirstPlanBlock(routineIds = {}, profile = buildTrainingHistoryProfile(), strategy = buildSurfFirstPlanStrategy(profile)) {
  const sessions = surfFirstWeekBlueprint(profile, strategy).map((entry) => ({
    id: uid(),
    systemKey: `${SURF_FIRST_BLOCK_KEY}-${entry.dayLabel.toLowerCase()}`,
    dayLabel: entry.dayLabel,
    routineId: entry.routineKey ? routineIds[entry.routineKey] || null : null,
    sessionTitle: entry.sessionTitle,
    kind: entry.kind,
    details: entry.details
  }));

  return {
    systemKey: SURF_FIRST_BLOCK_KEY,
    name: "Surf-First Cafe Season",
    focus: strategy.useLowerSupportReset
      ? "Surf progression first. Hold one weekly long run plus the sharper run touch, keep two lower-body touches without making both expensive, keep two upper sessions, and still protect enough energy for work, groceries, meal prep, and social life."
      : "Surf progression first. Hold one weekly long run, keep lower strength alive, build upper-body skill, and protect enough energy for work, groceries, meal prep, and social life.",
    currentWeekIndex: 0,
    isLooping: true,
    weeks: [
      {
        id: uid(),
        systemKey: `${SURF_FIRST_BLOCK_KEY}-week-1`,
        title: "Flexible surf-first base",
        note: strategy.useLowerSupportReset
          ? "Morning surf is the first choice. Midday land work stays short and useful. The second lower touch is support volume, not another draining leg day, and the long run now has its own fixed slot."
          : "Morning surf is the first choice. Midday land work is the anchor. The long run has its own fixed slot, and social and life admin stay protected on purpose.",
        plannedSessions: sessions
      }
    ]
  };
}

function upsertSystemRoutine(routine) {
  const existing = state.routines.find((item) => item.systemKey === routine.systemKey);
  const record = normalizeRoutineRecord({
    ...routine,
    id: existing?.id || uid()
  });

  if (existing) {
    state.routines = state.routines.map((item) => item.id === existing.id ? record : item);
  } else {
    state.routines.unshift(record);
  }

  return record.id;
}

function upsertSystemBlock(block) {
  const existing = state.blocks.find((item) => item.systemKey === block.systemKey);
  const hydratedWeeks = block.weeks.map((week, weekIndex) => {
    const existingWeek = existing?.weeks?.find((item) => item.systemKey === week.systemKey) || existing?.weeks?.[weekIndex];

    return {
      ...week,
      id: existingWeek?.id || week.id || uid(),
      plannedSessions: (week.plannedSessions || []).map((session, sessionIndex) => {
        const existingSession = existingWeek?.plannedSessions?.find((item) => item.systemKey === session.systemKey)
          || existingWeek?.plannedSessions?.[sessionIndex];
        return {
          ...session,
          id: existingSession?.id || session.id || uid()
        };
      })
    };
  });

  const record = normalizeBlockRecord({
    ...block,
    id: existing?.id || uid(),
    currentWeekIndex: existing?.currentWeekIndex ?? block.currentWeekIndex ?? 0,
    weeks: hydratedWeeks
  });

  if (existing) {
    state.blocks = state.blocks.map((item) => item.id === existing.id ? record : item);
  } else {
    state.blocks.unshift(record);
  }

  return record.id;
}

async function handleGoogleCalendarAuthorize() {
  persistPlannerSettingsFromInputs();
  ui.calendarSync.processing = true;
  ui.calendarSync.status = "Connecting to Google Calendar...";
  ui.calendarSync.tone = "";
  renderPlannerPanels();

  try {
    await requestGoogleCalendarAccess({ forcePrompt: true });
    ui.calendarSync.status = "Google Calendar connected. You can sync the surf-first plan now.";
    ui.calendarSync.tone = "success";
    showToast("Google Calendar connected");
  } catch (error) {
    ui.calendarSync.status = error.message || "Could not connect to Google Calendar.";
    ui.calendarSync.tone = "error";
  } finally {
    ui.calendarSync.processing = false;
    renderPlannerPanels();
  }
}

async function handleGoogleCalendarSync() {
  persistPlannerSettingsFromInputs();
  installSurfFirstBasePlan({ silent: true });

  ui.calendarSync.processing = true;
  ui.calendarSync.status = "Syncing the surf-first base plan to Google Calendar...";
  ui.calendarSync.tone = "";
  renderPlannerPanels();

  try {
    await requestGoogleCalendarAccess();

    const settings = googleCalendarSettings();
    const syncStartDate = alignDateToMonday(settings.syncStartDate || CAFE_SEASON_START);
    const calendarId = await ensurePulseBoardGoogleCalendar();
    settings.calendarId = calendarId;

    const events = buildSurfFirstCalendarEvents(
      syncStartDate,
      settings.weeksToSync || 6,
      { includeCafeShifts: settings.includeCafeShifts }
    );

    await replacePulseBoardCalendarEvents(calendarId, events, {
      startDate: syncStartDate,
      weeksToSync: settings.weeksToSync || 6
    });

    settings.lastSyncedAt = new Date().toISOString();
    persistState();
    ui.calendarSync.status = `Synced ${events.length} calendar items into ${settings.calendarName}.`;
    ui.calendarSync.tone = "success";
    renderDataViews();
    showToast("Calendar synced");
  } catch (error) {
    ui.calendarSync.status = error.message || "Could not sync the plan to Google Calendar.";
    ui.calendarSync.tone = "error";
  } finally {
    ui.calendarSync.processing = false;
    renderPlannerPanels();
  }
}

function clearGoogleCalendarLink() {
  const settings = googleCalendarSettings();
  settings.calendarId = "";
  settings.lastSyncedAt = "";
  ui.calendarSync.accessToken = "";
  ui.calendarSync.expiresAt = 0;
  ui.calendarSync.status = "Stored Google Calendar link cleared from PulseBoard.";
  ui.calendarSync.tone = "success";
  persistState();
  renderPlannerPanels();
}

async function requestGoogleCalendarAccess({ forcePrompt = false } = {}) {
  const settings = googleCalendarSettings();
  if (location.protocol === "file:") {
    throw new Error("Google Calendar sync needs the app on a real web address because Google OAuth requires an authorized JavaScript origin.");
  }
  if (!settings.clientId.trim()) {
    throw new Error("Add a Google OAuth web client ID first.");
  }

  await waitForGoogleIdentityServices();

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: settings.clientId.trim(),
      scope: SURF_FIRST_CALENDAR_SCOPE,
      callback: (response) => {
        if (!response || response.error) {
          reject(new Error(response?.error_description || response?.error || "Google Calendar authorization failed."));
          return;
        }

        ui.calendarSync.accessToken = response.access_token;
        ui.calendarSync.expiresAt = Date.now() + ((response.expires_in || 3600) * 1000);
        resolve(response);
      }
    });

    ui.calendarSync.tokenClient = tokenClient;
    tokenClient.requestAccessToken({
      prompt: forcePrompt || !ui.calendarSync.accessToken || ui.calendarSync.expiresAt <= Date.now() + 60_000
        ? "consent"
        : ""
    });
  });
}

function waitForGoogleIdentityServices(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      if (Date.now() - started >= timeoutMs) {
        reject(new Error("Google Identity Services did not finish loading. Try again in a moment."));
        return;
      }

      window.setTimeout(check, 120);
    };

    check();
  });
}

async function ensurePulseBoardGoogleCalendar() {
  const settings = googleCalendarSettings();
  const requestedName = settings.calendarName || "PulseBoard Surf-First Base";

  if (settings.calendarId) {
    try {
      const existing = await googleCalendarApiRequest(`/calendars/${encodeURIComponent(settings.calendarId)}`);
      if (existing?.id) {
        return existing.id;
      }
    } catch {
      settings.calendarId = "";
    }
  }

  const calendarList = await googleCalendarApiRequest("/users/me/calendarList", {
    query: {
      minAccessRole: "owner",
      showHidden: true
    }
  });
  const existingMatch = (calendarList.items || []).find((item) => (
    item.summary === requestedName
    || item.description?.includes(SURF_FIRST_CALENDAR_SOURCE)
  ));

  if (existingMatch?.id) {
    return existingMatch.id;
  }

  const created = await googleCalendarApiRequest("/calendars", {
    method: "POST",
    body: {
      summary: requestedName,
      description: `Created by PulseBoard (${SURF_FIRST_CALENDAR_SOURCE}) to hold the flexible surf-first base plan.`
    }
  });

  return created.id;
}

async function replacePulseBoardCalendarEvents(calendarId, events, { startDate, weeksToSync } = {}) {
  const timeMin = buildLocalRFC3339(startDate, "00:00");
  const timeMax = buildLocalRFC3339(shiftISODate(startDate, (weeksToSync * 7) + 1), "00:00");
  const existing = await googleCalendarApiRequest(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    query: {
      singleEvents: true,
      showDeleted: false,
      timeMin,
      timeMax,
      maxResults: 2500
    }
  });

  for (const item of existing.items || []) {
    if (item.extendedProperties?.private?.pulseboardPlan !== SURF_FIRST_CALENDAR_SOURCE) {
      continue;
    }

    await googleCalendarApiRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(item.id)}`, {
      method: "DELETE"
    });
  }

  for (const event of events) {
    await googleCalendarApiRequest(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      body: event
    });
  }
}

function buildSurfFirstCalendarEvents(startDate, weeksToSync, { includeCafeShifts = true } = {}) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid";
  const firstMonday = alignDateToMonday(startDate);
  const profile = buildTrainingHistoryProfile();
  const strategy = buildSurfFirstPlanStrategy(profile);
  const blueprint = surfFirstWeekBlueprint(profile, strategy);
  const events = [];

  for (let week = 0; week < weeksToSync; week += 1) {
    const weekStart = shiftISODate(firstMonday, week * 7);
    const monday = shiftISODate(weekStart, 0);
    const tuesday = shiftISODate(weekStart, 1);
    const wednesday = shiftISODate(weekStart, 2);
    const thursday = shiftISODate(weekStart, 3);
    const friday = shiftISODate(weekStart, 4);
    const saturday = shiftISODate(weekStart, 5);
    const sunday = shiftISODate(weekStart, 6);

    [
      { date: monday, start: "06:45", end: "08:00" },
      { date: tuesday, start: "06:45", end: "08:00" },
      { date: wednesday, start: "06:45", end: "08:00" },
      { date: thursday, start: "06:45", end: "08:00" },
      { date: friday, start: "06:45", end: "08:00" },
      { date: saturday, start: "08:00", end: "10:30" },
      { date: sunday, start: "08:00", end: "10:30" }
    ].forEach((window) => {
      events.push(buildGoogleCalendarEvent({
        summary: "Surf window / flat-day fallback",
        description: "Priority order: surf if the conditions are decent. If the ocean is flat, crowded, or low-value, use the fallback land or swim session instead. Keep this window flexible.",
        date: window.date,
        startTime: window.start,
        endTime: window.end,
        timeZone,
        category: "surf",
        flexible: true
      }));
    });

    const datesByDayIndex = {
      0: monday,
      1: tuesday,
      2: wednesday,
      3: thursday,
      4: friday,
      5: saturday,
      6: sunday
    };

    const middayTemplates = blueprint.map((entry) => ({
      date: datesByDayIndex[entry.dayIndex],
      startTime: entry.calendar?.startTime || "13:45",
      endTime: entry.calendar?.endTime || "15:00",
      summary: entry.calendar?.summary || entry.sessionTitle,
      description: entry.calendar?.description || entry.details,
      category: entry.calendar?.category || entry.kind,
      flexible: entry.calendar?.flexible ?? true
    }));

    middayTemplates.forEach((item) => {
      events.push(buildGoogleCalendarEvent({
        ...item,
        timeZone
      }));
    });

    if (includeCafeShifts) {
      [monday, tuesday, wednesday, thursday, friday].forEach((date) => {
        if (compareDates(date, CAFE_SEASON_START) < 0) {
          return;
        }

        events.push(buildGoogleCalendarEvent({
          summary: "Cafe shift",
          description: "Fixed work block.",
          date,
          startTime: "08:30",
          endTime: "13:00",
          timeZone,
          category: "work",
          flexible: false
        }));
        events.push(buildGoogleCalendarEvent({
          summary: "Cafe shift",
          description: "Fixed work block.",
          date,
          startTime: "17:00",
          endTime: "20:00",
          timeZone,
          category: "work",
          flexible: false
        }));
      });
    }
  }

  return events;
}

function buildGoogleCalendarEvent({
  summary,
  description,
  date,
  startTime,
  endTime,
  timeZone,
  category = "open",
  flexible = true
} = {}) {
  return {
    summary,
    description,
    start: {
      dateTime: buildLocalRFC3339(date, startTime),
      timeZone
    },
    end: {
      dateTime: buildLocalRFC3339(date, endTime),
      timeZone
    },
    colorId: googleCalendarColorId(category),
    transparency: flexible ? "transparent" : "opaque",
    status: flexible ? "tentative" : "confirmed",
    reminders: { useDefault: false },
    extendedProperties: {
      private: {
        pulseboardPlan: SURF_FIRST_CALENDAR_SOURCE,
        pulseboardCategory: category
      }
    }
  };
}

function googleCalendarColorId(category) {
  switch (category) {
    case "surf":
      return "9";
    case "strength":
      return "6";
    case "skill":
      return "10";
    case "run":
      return "11";
    case "life":
      return "2";
    case "work":
      return "8";
    default:
      return "5";
  }
}

async function googleCalendarApiRequest(path, { method = "GET", query = {}, body = null } = {}) {
  if (!ui.calendarSync.accessToken) {
    throw new Error("Google Calendar access token missing. Connect Google Calendar first.");
  }

  const url = new URL(`https://www.googleapis.com/calendar/v3${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value == null || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${ui.calendarSync.accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    if (response.status === 401) {
      ui.calendarSync.accessToken = "";
      ui.calendarSync.expiresAt = 0;
    }

    let errorMessage = "Google Calendar request failed.";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error?.message || errorMessage;
    } catch {
      try {
        errorMessage = await response.text() || errorMessage;
      } catch {
        // Ignore secondary parse failures.
      }
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function buildLocalRFC3339(dateISO, timeValue) {
  const [year, month, day] = normalizeDateString(dateISO).split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, "0");

  return `${normalizeDateString(dateISO)}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00${sign}${offsetHours}:${offsetRemainder}`;
}

function shiftISODate(dateISO, offsetDays) {
  const [year, month, day] = normalizeDateString(dateISO).split("-").map(Number);
  const date = new Date(year, month - 1, day + offsetDays, 12, 0, 0, 0);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function alignDateToMonday(dateISO) {
  const date = localDate(dateISO);
  const offsetToMonday = (date.getDay() + 6) % 7;
  return shiftISODate(dateISO, -offsetToMonday);
}

function renderProgress() {
  const summary = buildSummary();

  refs.progressMetrics.innerHTML = summary.metrics.map((metric) => `
    <article class="metric-card">
      <div class="metric-label">${escapeHtml(metric.label)}</div>
      <div class="metric-value">${escapeHtml(metric.value)}</div>
      <div class="metric-detail">${escapeHtml(metric.detail)}</div>
    </article>
  `).join("");

  const maxMinutes = Math.max(...summary.breakdown.map((item) => item.minutes), 1);
  refs.progressBreakdown.innerHTML = summary.breakdown.length
    ? summary.breakdown.map((item) => `
      <article class="list-card">
        <div class="list-row-top">
          <div>
            <div class="list-title">${escapeHtml(sessionKinds[item.kind].label)}</div>
            <div class="list-meta">${escapeHtml(sessionKinds[item.kind].description)}</div>
          </div>
          <div class="list-title">${item.minutes} min</div>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(item.minutes / maxMinutes) * 100}%; background:linear-gradient(90deg, ${sessionKinds[item.kind].color}, ${toneDown(sessionKinds[item.kind].color)})"></div>
        </div>
      </article>
    `).join("")
    : buildEmptyCard("Not enough data yet", "Log a few sessions and you will see where your week is leaning.");

  refs.exerciseTrends.innerHTML = summary.exerciseTrends.length
    ? summary.exerciseTrends.map((trend) => `
      <article class="list-card">
        <div class="list-row-top">
          <div>
            <div class="list-title">${escapeHtml(trend.name)}</div>
            <div class="list-meta">${escapeHtml(trend.comparison)}</div>
          </div>
          <span class="emphasis-badge emphasis-strength">${escapeHtml(trend.latest)}</span>
        </div>
      </article>
    `).join("")
    : buildEmptyCard("No lift trends yet", "Log a few repeated exercises and the app will start showing your benchmarks.");
}

function renderBodyHistory() {
  const latest = latestBodyCheckIn();
  if (latest) {
    refs.bodyDate.value = latest.date;
    refs.bodySleep.value = latest.sleepHours;
    refs.bodyEnergy.value = latest.energy;
    refs.bodySoreness.value = latest.soreness;
    refs.bodyStress.value = latest.stress;
    refs.bodyNotes.value = latest.notes || "";
    ui.bodyAreas = new Set(latest.fatiguedAreas || []);
    renderChipGroup(refs.bodyAreas, ui.bodyAreas, "body");
  }

  refs.bodyHistory.innerHTML = state.bodyCheckIns.length
    ? state.bodyCheckIns.slice(0, 6).map((checkIn) => `
      <article class="list-card">
        <div class="list-row-top">
          <div>
            <div class="list-title">${escapeHtml(formatDate(checkIn.date, { weekday: "short", day: "numeric", month: "short" }))}</div>
            <div class="list-meta">Sleep ${formatNumber(checkIn.sleepHours)} h • Energy ${checkIn.energy}/5 • Soreness ${checkIn.soreness}/5 • Stress ${checkIn.stress}/5</div>
          </div>
          <span class="emphasis-badge ${checkIn.soreness >= 4 ? "emphasis-recovery" : "emphasis-mixed"}">
            ${checkIn.soreness >= 4 ? "Protect" : "Use"}
          </span>
        </div>
        <div class="helper-text" style="margin-top:0.75rem">
          Loaded areas: ${escapeHtml(areaLabels(checkIn.fatiguedAreas))}
        </div>
        ${checkIn.notes ? `<div class="list-meta" style="margin-top:0.55rem">${escapeHtml(checkIn.notes)}</div>` : ""}
        <div class="mini-actions card-actions">
          <button class="button button-danger compact" type="button" data-delete-body-check-in="${checkIn.id}">Delete check-in</button>
        </div>
      </article>
    `).join("")
    : buildEmptyCard("No body check-ins yet", "Use this screen to tell the app what is actually fatigued.");
}

function coachChatState() {
  if (!state.coachChat) {
    state.coachChat = createCoachChatState();
  }
  return state.coachChat;
}

function isLongRunWorkout(workout = {}) {
  if (workout.kind !== "run") {
    return false;
  }

  const combined = `${workout.title || ""} ${workout.notes || ""} ${workout.primaryMetric || ""}`.toLowerCase();
  return (workout.durationMinutes || 0) >= 60 || /\blong run\b/.test(combined);
}

function buildCoachChatHistorySnapshot() {
  const lastSeven = [...state.workouts]
    .filter((workout) => daysAgo(workout.date) <= 6)
    .sort((a, b) => compareDates(b.date, a.date));
  const runSessions = lastSeven.filter((workout) => workout.kind === "run");

  return {
    lastSeven,
    runSessions,
    lowerTouches: lastSeven.filter((workout) => workoutTargetsLowerStrength(workout)).length,
    upperTouches: lastSeven.filter((workout) => workoutTargetsUpperStrength(workout)).length,
    qualityRuns: runSessions.filter((workout) => isQualityRunSession(workout)).length,
    longRuns: runSessions.filter((workout) => isLongRunWorkout(workout)).length
  };
}

function coachChatPromptSuggestions() {
  const goal = coachChatState().goal.toLowerCase();
  const suggestions = [
    "What should I do today?",
    "How should I adjust this week?",
    "I feel flat today. What is smartest?",
    "Does this still fit my goal?"
  ];

  if (/\blong run|5k|run|race|pace|tempo|interval|ironman\b/.test(goal) || getActiveBlock()?.systemKey === SURF_FIRST_BLOCK_KEY) {
    suggestions.push("How do I keep the long run in?");
  }

  if (/\bstrong|strength|lower|upper|muscle|cali|pull\b/.test(goal)) {
    suggestions.push("Is my lower / upper split enough?");
  }

  if (getActiveBlock()?.systemKey === SURF_FIRST_BLOCK_KEY) {
    suggestions.push("How should surf change this week?");
  }

  return uniqueValues(suggestions).slice(0, 5);
}

function buildCoachChatSummaryMarkup() {
  const chat = coachChatState();
  const goal = chat.goal.trim();
  const summary = buildSummary();
  const latestCheckIn = latestBodyCheckIn();
  const plannerView = buildLogPlannerView();
  const profile = buildTrainingHistoryProfile();
  const history = buildCoachChatHistorySnapshot();
  const primaryGuidance = summary.guidance[0];

  const cards = [
    {
      eyebrow: "Goal",
      title: goal || "Set your main goal here",
      detail: goal
        ? "Replies will keep bending back toward this."
        : "Example: keep the long run in, hold two lower days, and stay strong for surf."
    },
    {
      eyebrow: "Today",
      title: primaryGuidance ? primaryGuidance.title : "No live guidance yet",
      detail: primaryGuidance
        ? primaryGuidance.nextBestOption
        : "Log a workout or body check-in and the coach will get more specific."
    },
    {
      eyebrow: "Week",
      title: plannerView?.summaryAction
        ? `${plannerView.summaryAction.dayDisplay}: ${plannedSessionTitle(plannerView.summaryAction.session)}`
        : (getActiveBlock()?.name || "No active block"),
      detail: plannerView?.summaryText || activeBlockSuggestion() || "Add or activate a block to make weekly suggestions tighter."
    },
    {
      eyebrow: "Pattern",
      title: `${history.lowerTouches} lower • ${history.upperTouches} upper • ${history.runSessions.length} runs`,
      detail: latestCheckIn
        ? `Latest body read: sleep ${formatNumber(latestCheckIn.sleepHours)} h, energy ${latestCheckIn.energy}/5, soreness ${latestCheckIn.soreness}/5, loaded ${areaLabels(latestCheckIn.fatiguedAreas).toLowerCase()}.`
        : `History still points to about ${formatNumber(profile.observedLowerPerWeek)} lower and ${formatNumber(profile.observedUpperPerWeek)} upper touches per week.`
    }
  ];

  return cards.map((card) => `
    <article class="coach-context-pill">
      <p class="eyebrow">${escapeHtml(card.eyebrow)}</p>
      <div class="list-title">${escapeHtml(card.title)}</div>
      <div class="helper-text">${escapeHtml(card.detail)}</div>
    </article>
  `).join("");
}

function renderCoachChatSummary() {
  refs.coachChatSummary.innerHTML = buildCoachChatSummaryMarkup();
}

function renderCoachChatPrompts() {
  refs.coachChatPrompts.innerHTML = coachChatPromptSuggestions().map((prompt) => `
    <button class="coach-chat-chip" type="button" data-coach-chat-prompt="${escapeAttribute(prompt)}">${escapeHtml(prompt)}</button>
  `).join("");
}

function pushCoachChatMessage(role, text) {
  if (!text) {
    return;
  }

  const chat = coachChatState();
  chat.messages.push({
    id: uid(),
    role,
    text
  });
  chat.messages = chat.messages.slice(-30);
}

function buildCoachChatReply(prompt) {
  const raw = String(prompt || "").trim();
  const text = raw.toLowerCase();
  const chat = coachChatState();
  const goal = chat.goal.trim();
  const summary = buildSummary();
  const primaryGuidance = summary.guidance[0];
  const latestCheckIn = latestBodyCheckIn();
  const fatiguedAreas = new Set(latestCheckIn?.fatiguedAreas || []);
  const plannerView = buildLogPlannerView();
  const profile = buildTrainingHistoryProfile();
  const history = buildCoachChatHistorySnapshot();
  const lines = [];

  if (/\b(today|now|do|session|train|feel|feeling|flat|tired|cooked|sore|recovery|recover|smartest)\b/.test(text)) {
    if (primaryGuidance?.nextBestOption) {
      lines.push(goal
        ? `With your goal of ${goal.replace(/[.?!]\s*$/, "")}, ${primaryGuidance.nextBestOption.charAt(0).toLowerCase()}${primaryGuidance.nextBestOption.slice(1)}`
        : primaryGuidance.nextBestOption);
    }

    if (fatiguedAreas.size) {
      lines.push(bodyAreaRedirect(fatiguedAreas));
    }
  }

  if (/\b(week|schedule|plan|split|move|swap|later|tomorrow|this week|surf)\b/.test(text)) {
    if (getActiveBlock()?.systemKey === SURF_FIRST_BLOCK_KEY) {
      lines.push("Keep the weekly long run in the mid-week slot and let the sharper speed run sit later in the week. That order fits your lower-body work better.");
    }

    if (plannerView?.summaryAction) {
      lines.push(`The block currently points to ${plannerView.summaryAction.dayDisplay} for ${plannedSessionTitle(plannerView.summaryAction.session)}, but you can move that session to the day that actually fits.`);
    }
  }

  if (/\b(long run|run|5k|tempo|interval|speed)\b/.test(text)) {
    lines.push(history.longRuns
      ? `You already have ${history.longRuns} long-run touch${history.longRuns === 1 ? "" : "es"} in the last 7 days, so the next run should either stay easy or stay short-and-sharp depending on how your legs feel.`
      : "You do not need random extra run volume. Keep one real long run in the week, then protect the sharper speed touch later instead of stacking both close to heavy leg work.");
  }

  if (/\b(lower|upper|frequency|balance|strength|muscle|cali|pull)\b/.test(text)) {
    lines.push(`Your history still points to roughly ${formatNumber(profile.observedLowerPerWeek)} lower and ${formatNumber(profile.observedUpperPerWeek)} upper touches per week. That is why the plan keeps two lower and two upper exposures when the week allows it.`);
  }

  if (/\b(goal|priority|priorities|focus|matter)\b/.test(text) || !lines.length) {
    const priorityLead = goal
      ? `Your current priority is ${goal.replace(/[.?!]\s*$/, "")}.`
      : "The best move is the next session that keeps the week coherent.";
    const nextMove = primaryGuidance?.nextBestOption || activeBlockSuggestion() || tiredDaySuggestion(fatiguedAreas);
    lines.push(`${priorityLead} ${nextMove}`);
  }

  return uniqueValues(lines).slice(0, 3).join(" ");
}

function scrollCoachChatThreadToBottom() {
  refs.coachChatThread.scrollTop = refs.coachChatThread.scrollHeight;
}

function renderCoachChatPage() {
  const chat = coachChatState();

  if (document.activeElement !== refs.coachChatGoal) {
    refs.coachChatGoal.value = chat.goal || "";
  }

  renderCoachChatSummary();
  renderCoachChatPrompts();
  refs.coachChatThread.innerHTML = chat.messages.length
    ? chat.messages.map((message) => `
      <article class="coach-chat-message ${message.role === "user" ? "is-user" : ""}">
        <div class="coach-chat-role">${message.role === "user" ? "You" : "Coach"}</div>
        <div class="coach-chat-text">${escapeHtml(message.text)}</div>
      </article>
    `).join("")
    : `<div class="coach-chat-empty helper-text">Ask about today, the week, your goal, your lower / upper balance, or how your body read should change the plan.</div>`;

  scrollCoachChatThreadToBottom();
}

function submitCoachChatMessage(prompt = refs.coachChatInput?.value || "") {
  const text = String(prompt || "").trim();
  if (!text) {
    return;
  }

  pushCoachChatMessage("user", text);
  pushCoachChatMessage("assistant", buildCoachChatReply(text));
  persistState();
  refs.coachChatInput.value = "";
  renderCoachChatPage();
}

function clearCoachChatConversation() {
  coachChatState().messages = [];
  persistState();
  refs.coachChatInput.value = "";
  renderCoachChatPage();
  showToast("Coach chat cleared");
}

function buildSummary() {
  const workouts = [...state.workouts].sort((a, b) => compareDates(b.date, a.date));
  const lastSeven = workouts.filter((workout) => daysAgo(workout.date) <= 6);
  const latestCheckIn = latestBodyCheckIn();
  const weeklyMinutes = sum(lastSeven.map((item) => item.durationMinutes || 0));
  const hardSessions = lastSeven.filter((item) => (item.intensity || 0) >= 4).length;
  const strengthSessions = lastSeven.filter((item) => sessionKinds[item.kind]?.emphasis === "strength").length;
  const powerSessions = lastSeven.filter((item) => sessionKinds[item.kind]?.emphasis === "power").length;
  const enduranceMinutes = lastSeven
    .filter((item) => ["endurance", "mixed"].includes(sessionKinds[item.kind]?.emphasis))
    .reduce((total, item) => total + (item.durationMinutes || 0), 0);
  const readiness = computeReadiness(latestCheckIn, lastSeven);

  const metrics = [
    { label: "Readiness", value: `${readiness.value}%`, detail: `${readiness.label} day` },
    { label: "7-day load", value: `${weeklyMinutes} min`, detail: `${lastSeven.length} sessions` },
    { label: "Strength + power", value: `${strengthSessions + powerSessions}`, detail: "Key sessions this week" },
    {
      label: "Sleep",
      value: latestCheckIn ? `${formatNumber(latestCheckIn.sleepHours)} h` : "No check-in",
      detail: latestCheckIn ? `Energy ${latestCheckIn.energy}/5 • Soreness ${latestCheckIn.soreness}/5` : "Add a body check-in"
    }
  ];

  const breakdownMap = {};
  lastSeven.forEach((workout) => {
    breakdownMap[workout.kind] = (breakdownMap[workout.kind] || 0) + (workout.durationMinutes || 0);
  });

  const breakdown = Object.entries(breakdownMap)
    .map(([kind, minutes]) => ({ kind, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  const guidance = buildGuidance({
    latestCheckIn,
    lastSeven,
    readiness,
    strengthSessions,
    powerSessions,
    enduranceMinutes
  });

  return {
    readiness,
    metrics,
    breakdown,
    guidance,
    exerciseTrends: buildExerciseTrends(workouts),
    recent: workouts.slice(0, 5)
  };
}

function computeReadiness(latestCheckIn, lastSeven) {
  let score = 68;
  const sleep = latestCheckIn?.sleepHours ?? 7;
  const energy = latestCheckIn?.energy ?? 3;
  const soreness = latestCheckIn?.soreness ?? 2;
  const weeklyMinutes = lastSeven.reduce((sumValue, item) => sumValue + (item.durationMinutes || 0), 0);
  const hardSessions = lastSeven.filter((item) => (item.intensity || 0) >= 4).length;

  score += clamp((sleep - 7) * 9, -14, 14);
  score += clamp((energy - 3) * 9, -14, 16);
  score -= clamp((soreness - 2) * 10, 0, 24);
  score -= hardSessions * 3;
  score -= weeklyMinutes > 420 ? 5 : 0;

  const value = clamp(Math.round(score), 32, 96);
  if (value >= 78) return { value, label: "Push" };
  if (value >= 62) return { value, label: "Build" };
  return { value, label: "Recover" };
}

function buildGuidance({ latestCheckIn, lastSeven, readiness, strengthSessions, powerSessions, enduranceMinutes }) {
  const fatiguedAreas = new Set(latestCheckIn?.fatiguedAreas || []);
  const sleep = latestCheckIn?.sleepHours ?? 7;
  const energy = latestCheckIn?.energy ?? 3;
  const soreness = latestCheckIn?.soreness ?? 2;
  const cards = buildSurfFirstCoachGuidance({
    latestCheckIn,
    lastSeven,
    readiness,
    strengthSessions,
    powerSessions,
    enduranceMinutes,
    fatiguedAreas,
    sleep,
    energy,
    soreness
  });

  if (sleep < 6.5 || energy <= 2 || soreness >= 4) {
    cards.push({
      emphasis: "recovery",
      title: "Keep the streak, lower the cost",
      summary: "This should still be a training day, just not an expensive one.",
      nextBestOption: tiredDaySuggestion(fatiguedAreas)
    });
  } else if (strengthSessions < 2) {
    cards.push({
      emphasis: "strength",
      title: "Strength is drifting a little",
      summary: "If the goal is to stay strong and athletic, your week needs another quality resistance session.",
      nextBestOption: fatiguedAreas.has("legs")
        ? "Legs are loaded, so make it upper-body strength plus 10 to 20 minutes of easy aerobic work."
        : "Open one of your saved strength routines and log only the key working sets."
    });
  } else if (enduranceMinutes < 120) {
    cards.push({
      emphasis: "endurance",
      title: "Your engine wants attention",
      summary: "The week is not very aerobic yet, so an endurance session would probably balance you better than more lifting.",
      nextBestOption: fatiguedAreas.has("legs")
        ? "If the legs are heavy, pick a swim, easy surf, or mobility circuit rather than forcing a hard run."
        : "A steady run, bike, swim, hike, or longer surf would fit well today."
    });
  } else if (powerSessions < 1) {
    cards.push({
      emphasis: "power",
      title: "Keep your pop alive",
      summary: "Short explosive work helps you stay athletic even when endurance or general training takes more space.",
      nextBestOption: fatiguedAreas.has("legs")
        ? "Skip hard sprinting and use med-ball throws, upper-body power, or short technique drills."
        : "Use a short explosive session before fatigue builds: jumps, sprints, or fast lift variations."
    });
  } else {
    cards.push({
      emphasis: "mixed",
      title: "Balanced enough to build",
      summary: "The last few days look usable. The best move is the next logical session, not random extra volume.",
      nextBestOption: activeBlockSuggestion() || "Repeat a saved routine, hit the key sets, and stop before the session turns into junk volume."
    });
  }

  const activeBlock = getActiveBlock();
  if (activeBlock) {
    const firstSession = currentBlockWeek(activeBlock).plannedSessions[0];
    cards.push({
      emphasis: "mixed",
      title: activeWeekLabel(activeBlock),
      summary: currentBlockWeek(activeBlock).note || "Use your block to keep the week coherent.",
      nextBestOption: firstSession
        ? `${firstSession.dayLabel}: ${plannedSessionTitle(firstSession)}`
        : "Add a planned session to this week."
    });
  }

  if (latestCheckIn && latestCheckIn.fatiguedAreas?.length) {
    cards.push({
      emphasis: "recovery",
      title: "Body map matters more than mood",
      summary: `You marked ${areaLabels(latestCheckIn.fatiguedAreas).toLowerCase()}. Use that to redirect the day, not to stop it.`,
      nextBestOption: bodyAreaRedirect(fatiguedAreas)
    });
  }

  if (readiness.label === "Recover" && !cards.some((card) => card.emphasis === "recovery")) {
    cards.unshift({
      emphasis: "recovery",
      title: "Recover does not mean do nothing",
      summary: "It means choose a session you can absorb and still feel better afterward.",
      nextBestOption: tiredDaySuggestion(fatiguedAreas)
    });
  }

  return dedupeGuidanceCards(cards).slice(0, 4);
}

function buildSurfFirstCoachGuidance({
  lastSeven,
  readiness,
  strengthSessions,
  enduranceMinutes,
  fatiguedAreas,
  sleep,
  energy,
  soreness
}) {
  const activeBlock = getActiveBlock();
  const surfFirstActive = activeBlock?.systemKey === SURF_FIRST_BLOCK_KEY || getSurfFirstBlock()?.id === activeBlock?.id;
  if (!surfFirstActive) {
    return [];
  }

  const profile = buildTrainingHistoryProfile();
  const strategy = buildSurfFirstPlanStrategy(profile);
  const cards = [];
  const surfSessions = lastSeven.filter((workout) => workout.kind === "surf").length;
  const runSessions = lastSeven.filter((workout) => workout.kind === "run");
  const qualityRuns = runSessions.filter((workout) => isQualityRunSession(workout)).length;
  const easyRuns = Math.max(0, runSessions.length - qualityRuns);
  const lowerStrengthTouches = lastSeven.filter((workout) => workoutTargetsLowerStrength(workout)).length;
  const upperStrengthTouches = lastSeven.filter((workout) => workoutTargetsUpperStrength(workout)).length;
  const hardSessions = lastSeven.filter((workout) => (workout.intensity || 0) >= 4).length;
  const today = weekdayDefinitionForDate(todayISO());
  const shouldersCooked = fatiguedAreas.has("shoulders") || fatiguedAreas.has("back");
  const legsCooked = fatiguedAreas.has("legs") || fatiguedAreas.has("glutes");
  const lowEnergyDay = readiness.label === "Recover" || sleep < 6.5 || energy <= 2 || soreness >= 4;

  cards.push({
    emphasis: lowEnergyDay ? "recovery" : "mixed",
    title: "Protect the priority ladder",
    summary: "Surf stays first. Quality runs hold your speed. Gym supports. Optional easy mileage is the first thing to cut when life gets tight.",
    nextBestOption: lowEnergyDay
      ? "If the day feels overloaded, keep the surf or the one quality run that matters and drop the optional easy run, pump work, or extra sets first."
      : "If the waves are worth it, surf and move the land session rather than forcing both."
  });

  if (today.index === 1) {
    cards.push({
      emphasis: "mixed",
      title: "Cali days work better dense",
      summary: "For the cali touch, the win condition is a lot of good reps and honest density, not long rests and dragged-out bodybuilding pacing.",
      nextBestOption: "Bare tag en masse reps. Volume over pauser. Keep it faster and more efficient for what you actually need."
    });
  }

  if (strategy.useLowerSupportReset && lowerStrengthTouches < strategy.lowerSessions) {
    cards.push({
      emphasis: "strength",
      title: "Your lower strength wants two touches",
      summary: `The history-backed version of this plan uses one squat / quad lower day plus one posterior-chain lower day so ${profile.preferredExercises.lowerSquat.toLowerCase()} and ${profile.preferredExercises.lowerPosteriorMain.toLowerCase()} do not drift.`,
      nextBestOption: legsCooked
        ? "If the legs are cooked, skip the full lower day and use the short support version later in the week instead of forcing another hard leg session."
        : `Use the short lower B session: ${profile.preferredExercises.lowerPosteriorMain}, ${profile.preferredExercises.lowerPosteriorSupport.toLowerCase()}, and one unilateral or hamstring accessory, then leave.`
    });
  }

  if (!shouldersCooked && upperStrengthTouches < strategy.upperSessions) {
    cards.push({
      emphasis: "strength",
      title: "Keep the second upper touch alive",
      summary: "This base keeps two upper sessions because your week works better with one cali touch and one mixed gym upper touch, not by doubling the same pattern twice.",
      nextBestOption: `Use the shortest useful gym upper today: ${profile.preferredExercises.upperGymPull}, ${profile.preferredExercises.upperRow.toLowerCase()}, and one press or shoulder-support movement.`
    });
  }

  if (shouldersCooked || surfSessions >= 4) {
    cards.push({
      emphasis: "recovery",
      title: "Shoulders are already doing a lot",
      summary: "Surfing already loads lats, upper back, shoulders, and trunk. Extra upper-body volume only helps if you can absorb it.",
      nextBestOption: "If your shoulders feel cooked, skip upper-body lifting today. Use lower-body strength, an easy run, groceries, or mobility instead."
    });
  }

  if (qualityRuns < strategy.qualityRuns) {
    cards.push({
      emphasis: "endurance",
      title: strategy.qualityRuns > 1 ? "Speed belongs later in the week" : "Protect the later-week sharp run",
      summary: strategy.qualityRuns > 1
        ? "Your recent pattern can still support sharper run work on flatter or lower-value surf weeks, but it lands better later in the week than close to heavy lower-body work."
        : "The week now holds the steadier long run earlier and protects the sharper run later, instead of forcing speed too close to the main lower day.",
      nextBestOption: qualityRuns === 0
        ? "If the surf is flat or average, keep the steady long run earlier and use the later-week slot for intervals or a short tempo before you add more gym work."
        : (strategy.qualityRuns > 1
          ? "You already have one sharp touch. Keep the later one short and snappy, and let the easy volume stay optional."
          : "You already have the sharp run in. Keep the rest of the week light enough that it still feels high quality.")
    });
  } else if (lowEnergyDay && easyRuns > 0) {
    cards.push({
      emphasis: "recovery",
      title: "Drop easy runs first",
      summary: "When the week gets heavy, easy mileage is the first running piece to remove. Keep the speed or tempo touch before you cut the sharp work.",
      nextBestOption: "If you need to protect energy, remove the easy run and keep the single quality session that preserves your pace."
    });
  }

  if (hardSessions >= 3 || strengthSessions >= 3 || enduranceMinutes >= 240) {
    cards.push({
      emphasis: "mixed",
      title: "Minimum dose beats junk volume",
      summary: "This block is meant to keep you strong, athletic, and fresh. Most land sessions should stay around 45 to 60 minutes and 1 to 2 reps in reserve.",
      nextBestOption: "Hit the key sets, stop before failure, and leave with energy for work, Spanish, and people."
    });
  }

  if (today.index === 4) {
    cards.push({
      emphasis: "mixed",
      title: "Friday protects next week",
      summary: "Groceries are part of the training system, not admin that happens if there is time.",
      nextBestOption: "Even if you surf, keep the grocery block light and protect the rest of the day instead of chasing another hard session."
    });
  }

  if (today.index === 6) {
    cards.push({
      emphasis: "mixed",
      title: "Meal prep buys weekday energy",
      summary: "Sunday food prep keeps work, surfing, and social energy easier to carry once the week starts moving.",
      nextBestOption: "Treat meal prep like a real support session. If you train too, keep it easy enough that the prep still happens."
    });
  }

  return cards;
}

function isQualityRunSession(workout) {
  const text = `${workout?.title || ""} ${workout?.notes || ""}`.toLowerCase();
  if (/\b(interval|tempo|threshold|sharpener|track|repeat|repeats|800|400|1k)\b/.test(text)) {
    return true;
  }

  return workout?.kind === "run" && (workout?.intensity || 0) >= 4;
}

function dedupeGuidanceCards(cards = []) {
  const seen = new Set();

  return cards.filter((card) => {
    const title = String(card?.title || "").trim();
    if (!title || seen.has(title)) {
      return false;
    }
    seen.add(title);
    return true;
  });
}

function buildExerciseTrends(workouts) {
  const grouped = {};
  workouts.forEach((workout) => {
    (workout.exerciseLogs || []).forEach((entry) => {
      const summary = summarizeExerciseLog(entry);
      if (!entry.name || summary.keyWeight == null) {
        return;
      }
      if (!grouped[entry.name]) {
        grouped[entry.name] = [];
      }
      grouped[entry.name].push({
        ...entry,
        keyWeight: summary.keyWeight,
        reps: summary.reps
      });
    });
  });

  return Object.entries(grouped)
    .map(([name, entries]) => {
      const [latest, previous] = entries;
      if (!latest) {
        return null;
      }
      let comparison = "First logged benchmark";
      if (previous?.keyWeight != null) {
        const delta = latest.keyWeight - previous.keyWeight;
        if (Math.abs(delta) < 0.05) comparison = "Holding steady";
        else comparison = delta > 0 ? `Up ${formatWeight(delta)}` : `Down ${formatWeight(Math.abs(delta))}`;
      }

      return {
        name,
        latest: formatWeight(latest.keyWeight),
        comparison
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);
}

function routineExerciseSummary(routine, { includeSets = false } = {}) {
  if (!routine?.exercises?.length) {
    return "";
  }

  const summary = routine.exercises.slice(0, 4).map((exercise) => (
    includeSets
      ? `${exercise.name} ${exercise.targetSets} x ${exercise.targetReps}`
      : exercise.name
  )).join(" • ");

  return routine.exercises.length > 4 ? `${summary} • ...` : summary;
}

function linkedRoutineForSession(session) {
  if (!session?.routineId) {
    return null;
  }
  return state.routines.find((item) => item.id === session.routineId) || null;
}

function plannedSessionExercises(session) {
  if (Array.isArray(session?.exercises) && session.exercises.length) {
    return session.exercises;
  }

  return linkedRoutineForSession(session)?.exercises || [];
}

function plannedSessionExerciseSummary(session, { includeSets = false } = {}) {
  const exercises = plannedSessionExercises(session);
  if (!exercises.length) {
    return "";
  }

  const summary = exercises.slice(0, 4).map((exercise) => (
    includeSets
      ? `${exercise.name} ${exercise.targetSets} x ${exercise.targetReps}`
      : exercise.name
  )).join(" • ");

  return exercises.length > 4 ? `${summary} • ...` : summary;
}

function plannedSessionTitle(session) {
  return linkedRoutineForSession(session)?.name || session.sessionTitle || "Planned session";
}

function plannedSessionKindValue(session) {
  return linkedRoutineForSession(session)?.sessionKind || session.kind;
}

function plannedSessionDetails(session) {
  return {
    note: session.details?.trim() || "",
    exerciseSummary: plannedSessionExerciseSummary(session, { includeSets: true }),
    fallback: sessionKinds[plannedSessionKindValue(session)]?.description || ""
  };
}

function renderPlannedSessionCard(session) {
  const kindValue = plannedSessionKindValue(session);
  const kind = sessionKinds[kindValue] || sessionKinds.recovery;
  const details = plannedSessionDetails(session);
  const buttonLabel = plannedSessionExercises(session).length ? "Start session" : "Start log";

  return `
    <div class="list-card">
      <div class="list-row-top">
        <div>
          <div class="list-title">${escapeHtml(session.dayLabel)} • ${escapeHtml(plannedSessionTitle(session))}</div>
          <div class="list-meta">${escapeHtml(kind.description)}</div>
          ${details.note ? `<div class="list-meta" style="margin-top:0.45rem">${escapeHtml(details.note)}</div>` : ""}
          ${details.exerciseSummary ? `<div class="list-meta" style="margin-top:0.45rem">${escapeHtml(details.exerciseSummary)}</div>` : ""}
          ${!details.note && !details.exerciseSummary && details.fallback ? `<div class="list-meta" style="margin-top:0.45rem">${escapeHtml(details.fallback)}</div>` : ""}
        </div>
        <span class="small-tag" style="background:${kind.color}">${escapeHtml(kind.label)}</span>
      </div>
      <div class="quick-actions tight card-actions">
        <button class="button button-primary compact" type="button" data-log-planned-session="${session.id}">${buttonLabel}</button>
      </div>
    </div>
  `;
}

function buildLogPlannerManualChoiceMarkup(entries = [], recommendedSessionId = null) {
  if (!entries.length) {
    return "";
  }

  return `
    <div>
      <div class="helper-text">Choose any planned session and start it now. The weekday is guidance, not a lock.</div>
      <div class="quick-actions tight" style="margin-top:0.75rem">
        ${entries.map((entry) => `
          <button
            class="button ${entry.session.id === recommendedSessionId ? "button-primary" : "button-secondary"} compact"
            type="button"
            data-log-planned-session="${entry.session.id}"
          >
            ${escapeHtml(`${entry.dayDisplay} • ${plannedSessionTitle(entry.session)}`)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderLogPlanner() {
  if (!refs.logSchedulePanel) {
    return;
  }

  const view = buildLogPlannerView();

  if (!view) {
    refs.logSchedulePanel.innerHTML = `
      <div class="log-planner-head">
        <div>
          <p class="eyebrow">Planned this week</p>
          <h3>Your schedule will live here</h3>
        </div>
      </div>
      <div class="empty-card">Choose an active block in Routines and the Log room will highlight today plus the rest of your week.</div>
    `;
    return;
  }

  refs.logSchedulePanel.innerHTML = `
    <div class="log-planner-head">
      <div>
        <p class="eyebrow">Planned this week</p>
        <h3>${escapeHtml(view.block.name)}</h3>
      </div>
      <div class="log-planner-week-badge">${escapeHtml(view.weekBadge)}</div>
    </div>

    <article class="log-planner-summary ${view.todayEntries.length ? "is-today" : "is-open"}">
      <div>
        <div class="log-planner-summary-kicker">${escapeHtml(view.summaryKicker)}</div>
        <div class="list-title">${escapeHtml(view.summaryTitle)}</div>
        <div class="list-meta">${escapeHtml(view.summaryText)}</div>
      </div>
      ${view.summaryAction ? `
        <button
          class="button button-primary compact"
          type="button"
          data-log-planned-session="${view.summaryAction.session.id}"
        >
          ${escapeHtml(view.summaryActionLabel)}
        </button>
      ` : ""}
      ${buildLogPlannerManualChoiceMarkup(view.entries, view.summaryAction?.session.id || null)}
    </article>

    <div class="log-planner-rail" data-log-schedule-rail>
      ${view.entries.map((entry) => renderLogPlannerCard(entry)).join("")}
    </div>
  `;

  if (view.scrollTargetId) {
    requestAnimationFrame(() => {
      const rail = refs.logSchedulePanel.querySelector("[data-log-schedule-rail]");
      const card = [...(rail?.querySelectorAll("[data-log-planned-session]") || [])]
        .find((item) => item.dataset.logPlannedSession === view.scrollTargetId);
      card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }
}

function renderLogPlannerCard(entry) {
  const classes = ["log-planner-card"];
  if (entry.isToday) {
    classes.push("is-today");
  }
  if (entry.isSelected) {
    classes.push("is-selected");
  }
  if (entry.isCompleteToday) {
    classes.push("is-complete");
  }

  const statusPills = [
    entry.isToday ? `<span class="tiny-badge">Today</span>` : "",
    entry.isSelected ? `<span class="tiny-badge">Loaded</span>` : "",
    entry.isCompleteToday ? `<span class="tiny-badge">Logged</span>` : ""
  ].filter(Boolean).join("");

  const summary = entry.details.exerciseSummary || entry.details.note || entry.details.fallback || entry.kind.description;
  const exerciseCount = plannedSessionExercises(entry.session).length;
  const footer = exerciseCount
    ? `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}`
    : `${entry.kind.label} session`;

  return `
    <button
      class="${classes.join(" ")}"
      type="button"
      data-log-planned-session="${entry.session.id}"
    >
      <div class="log-planner-card-head">
        <div>
          <div class="log-planner-day">${escapeHtml(entry.dayDisplay)}</div>
          <div class="list-title">${escapeHtml(plannedSessionTitle(entry.session))}</div>
        </div>
        <span class="small-tag" style="background:${entry.kind.color}">${escapeHtml(entry.kind.label)}</span>
      </div>
      ${statusPills ? `<div class="log-planner-pills">${statusPills}</div>` : ""}
      <div class="list-meta">${escapeHtml(summary)}</div>
      <div class="log-planner-footer">${escapeHtml(footer)}</div>
    </button>
  `;
}

function buildLogPlannerView() {
  const block = getActiveBlock();
  const week = block ? currentBlockWeek(block) : null;
  const sessions = week?.plannedSessions || [];
  if (!block || !week || !sessions.length) {
    return null;
  }

  const today = weekdayDefinitionForDate(todayISO());
  const selectedSessionId = ui.activeRoutineLogTemplate?.sourceType === "planned"
    ? ui.activeRoutineLogTemplate.sessionId
    : null;
  const loggedToday = new Set(
    state.workouts
      .filter((workout) => normalizeDateString(workout.date) === todayISO() && workout.plannedSessionId)
      .map((workout) => workout.plannedSessionId)
  );

  const entries = sessions
    .map((session, order) => {
      const dayIndex = weekdayIndexFromLabel(session.dayLabel);
      const kindValue = plannedSessionKindValue(session);
      return {
        session,
        order,
        dayIndex,
        dayDisplay: session.dayLabel || weekdayDefinitions[order]?.short || `Day ${order + 1}`,
        kind: sessionKinds[kindValue] || sessionKinds.recovery,
        details: plannedSessionDetails(session),
        isToday: dayIndex === today.index,
        isSelected: selectedSessionId === session.id,
        isCompleteToday: loggedToday.has(session.id)
      };
    })
    .sort((a, b) => {
      const aRank = a.dayIndex == null ? 99 + a.order : a.dayIndex;
      const bRank = b.dayIndex == null ? 99 + b.order : b.dayIndex;
      return aRank - bRank || a.order - b.order;
    });

  const todayEntries = entries.filter((entry) => entry.isToday);
  const primaryTodayEntry = todayEntries.find((entry) => !entry.isCompleteToday) || todayEntries[0] || null;
  const nextEntry = findNextPlannedEntry(entries, today.index);
  const summaryAction = primaryTodayEntry || nextEntry || entries[0] || null;
  const summaryActionLabel = "Start suggested workout";
  const summaryTitle = todayEntries.length
    ? (todayEntries.length === 1 ? plannedSessionTitle(primaryTodayEntry.session) : `${todayEntries.length} workouts planned today`)
    : `No workout planned for ${today.long}`;
  const summaryText = todayEntries.length
    ? buildLogPlannerTodaySummary(todayEntries, primaryTodayEntry)
    : buildLogPlannerOffDaySummary(nextEntry, today.long);
  const scrollTargetId = entries.some((entry) => entry.session.id === selectedSessionId)
    ? selectedSessionId
    : (primaryTodayEntry?.session.id || nextEntry?.session.id || entries[0]?.session.id || null);

  return {
    block,
    entries,
    todayEntries,
    summaryKicker: `${today.long} • ${week.title}`,
    summaryTitle,
    summaryText,
    summaryAction,
    summaryActionLabel,
    scrollTargetId,
    weekBadge: activeWeekLabel(block)
  };
}

function buildLogPlannerTodaySummary(todayEntries, primaryEntry) {
  if (!todayEntries.length) {
    return "";
  }

  if (todayEntries.length > 1) {
    return `${todayEntries.length} sessions are lined up today. Start the one you want first, or pick another session from the week if that fits better.`;
  }

  const details = primaryEntry.details.exerciseSummary || primaryEntry.details.note || primaryEntry.details.fallback || primaryEntry.kind.description;
  return primaryEntry.isCompleteToday
    ? `${details} Logged already today, but you can reopen it, repeat it, or start another planned session instead.`
    : `${details} Loaded from your active block, but you can still choose a different planned session if that fits better today.`;
}

function buildLogPlannerOffDaySummary(nextEntry, todayLabel) {
  if (!nextEntry) {
    return `Nothing is scheduled for ${todayLabel} yet. Add sessions in Routines and they will appear here automatically.`;
  }

  const nextLabel = nextEntry.session.dayLabel || nextEntry.dayDisplay;
  return `Nothing is scheduled for ${todayLabel}. ${nextLabel} is next with ${plannedSessionTitle(nextEntry.session)}, but you can start any session from this week if that fits better.`;
}

function findNextPlannedEntry(entries, todayIndex) {
  if (!entries.length) {
    return null;
  }

  const dayAwareEntries = entries.filter((entry) => entry.dayIndex != null);
  if (!dayAwareEntries.length) {
    return entries[0];
  }

  return [...dayAwareEntries]
    .sort((a, b) => {
      const aOffset = (a.dayIndex - todayIndex + 7) % 7;
      const bOffset = (b.dayIndex - todayIndex + 7) % 7;
      return aOffset - bOffset || a.order - b.order;
    })[0];
}

function weekdayDefinitionForDate(dateString = todayISO()) {
  return weekdayDefinitions[mondayFirstWeekdayIndex(localDate(dateString).getDay())];
}

function weekdayIndexFromLabel(label) {
  const token = normalizeLookupToken(label);
  if (!token) {
    return null;
  }

  return weekdayAliasLookup.get(token) ?? weekdayAliasLookup.get(token.slice(0, 3)) ?? null;
}

function mondayFirstWeekdayIndex(dayIndex) {
  return dayIndex === 0 ? 6 : dayIndex - 1;
}

function normalizeLookupToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function roundToStep(value, step = 0.5) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value / step) * step;
}

function resolveSetTemplateAutoWeight(template, baseWeight = null) {
  const normalizedBaseWeight = normalizeSelectNumber(baseWeight);
  const normalizedValue = normalizeSelectNumber(template?.weightValue);
  const weightMode = template?.weightMode || "same";

  if (weightMode === "bodyweight") {
    return 0;
  }
  if (weightMode === "fixed") {
    return normalizedValue;
  }
  if (weightMode === "percent") {
    if (normalizedBaseWeight == null) {
      return null;
    }
    return roundToStep(normalizedBaseWeight * ((normalizedValue ?? 50) / 100), 0.5);
  }

  return normalizedBaseWeight;
}

function normalizeExerciseSetLog(values = {}, { fallbackReps = "", rowType = "main" } = {}) {
  return {
    id: values.id || uid(),
    rowType: values.rowType || rowType,
    setIndex: values.setIndex != null ? Number(values.setIndex) : null,
    parentSetIndex: values.parentSetIndex != null ? Number(values.parentSetIndex) : null,
    templateLabel: values.templateLabel || "",
    placeholderReps: values.placeholderReps || fallbackReps,
    weightMode: values.weightMode || "same",
    weightValue: normalizeSelectNumber(values.weightValue),
    weight: normalizeSelectNumber(values.weight),
    reps: normalizeSelectNumber(values.reps),
    effortPercent: normalizeSelectNumber(values.effortPercent),
    setSeconds: normalizeSelectNumber(values.setSeconds),
    restSeconds: normalizeSelectNumber(values.restSeconds)
  };
}

function buildDefaultExerciseSetDrafts(targetSets, defaultWeight = null, fallbackReps = "", defaultSetSeconds = null, defaultRestSeconds = null, defaultEffortPercent = null) {
  const normalizedDefaultWeight = normalizeSelectNumber(defaultWeight);
  const normalizedSetSeconds = normalizeSelectNumber(defaultSetSeconds);
  const normalizedRestSeconds = normalizeSelectNumber(defaultRestSeconds);
  const normalizedEffortPercent = normalizeSelectNumber(defaultEffortPercent);
  return Array.from({ length: Math.max(1, toNumber(targetSets) || 1) }, (_, index) => normalizeExerciseSetLog({
    id: uid(),
    rowType: "main",
    setIndex: index + 1,
    weightMode: "same",
    weight: normalizedDefaultWeight,
    reps: null,
    effortPercent: normalizedEffortPercent,
    setSeconds: normalizedSetSeconds,
    restSeconds: normalizedRestSeconds
  }, { fallbackReps }));
}

function buildExerciseSetDraftsFromTemplate(exercise = {}, { defaultWeight = null, defaultSetSeconds = null, defaultRestSeconds = null, defaultEffortPercent = null } = {}) {
  const resolvedSetSeconds = normalizeSelectNumber(defaultSetSeconds)
    ?? normalizeSelectNumber(exercise.targetSetSeconds)
    ?? inferSetSecondsFromExercise(exercise);
  const resolvedRestSeconds = normalizeSelectNumber(defaultRestSeconds)
    ?? normalizeSelectNumber(exercise.targetRestSeconds)
    ?? 0;
  const resolvedEffortPercent = normalizeSelectNumber(defaultEffortPercent)
    ?? normalizeSelectNumber(exercise.targetEffortPercent)
    ?? null;
  const mainRows = buildDefaultExerciseSetDrafts(
    exercise.targetSets,
    defaultWeight,
    exercise.targetReps || String(exercise.targetLogReps || ""),
    resolvedSetSeconds,
    resolvedRestSeconds,
    resolvedEffortPercent
  );
  if (!exercise.afterSetTemplates?.length && !exercise.extraSetTemplates?.length) {
    return mainRows;
  }

  const rows = [];
  mainRows.forEach((mainRow) => {
    rows.push(mainRow);
    (exercise.afterSetTemplates || []).forEach((template) => {
      rows.push(normalizeExerciseSetLog({
        rowType: "after-each",
        parentSetIndex: mainRow.setIndex,
        templateLabel: template.label,
        placeholderReps: template.targetReps,
        weightMode: template.weightMode,
        weightValue: template.weightValue,
        weight: resolveSetTemplateAutoWeight(template, defaultWeight),
        reps: null,
        effortPercent: resolvedEffortPercent,
        setSeconds: resolvedSetSeconds,
        restSeconds: resolvedRestSeconds
      }, { rowType: "after-each" }));
    });
  });
  (exercise.extraSetTemplates || []).forEach((template) => {
    rows.push(normalizeExerciseSetLog({
      rowType: "extra",
      templateLabel: template.label,
      placeholderReps: template.targetReps,
      weightMode: template.weightMode,
      weightValue: template.weightValue,
      weight: resolveSetTemplateAutoWeight(template, defaultWeight),
      reps: null,
      effortPercent: resolvedEffortPercent,
      setSeconds: resolvedSetSeconds,
      restSeconds: resolvedRestSeconds
    }, { rowType: "extra" }));
  });

  return rows;
}

function getExerciseSetLogs(entry, { fallbackReps = "" } = {}) {
  if (Array.isArray(entry?.setLogs) && entry.setLogs.length) {
    return entry.setLogs.map((setLog) => normalizeExerciseSetLog(setLog, {
      fallbackReps: setLog.rowType === "main" ? fallbackReps : ""
    }));
  }

  if (entry?.keyWeight != null || entry?.reps != null) {
    return [normalizeExerciseSetLog({
      rowType: "main",
      setIndex: 1,
      weightMode: "same",
      weight: entry.keyWeight ?? null,
      reps: entry.reps ?? null,
      effortPercent: entry.effortPercent ?? null,
      setSeconds: entry.setSeconds ?? null,
      restSeconds: entry.restSeconds ?? null
    }, { fallbackReps })];
  }

  return [];
}

function summarizeExerciseSetLogs(setLogs = []) {
  if (!setLogs.length) {
    return { keyWeight: null, reps: null };
  }

  const withWeight = setLogs.filter((setLog) => setLog.weight != null);
  const reference = withWeight.length
    ? [...withWeight].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0]
    : setLogs[setLogs.length - 1];

  return {
    keyWeight: reference?.weight ?? null,
    reps: reference?.reps ?? null
  };
}

function buildResolvedExerciseSetRows(setLogs = [], {
  targetReps = "",
  defaultWeight = null,
  defaultSetSeconds = null,
  defaultRestSeconds = null,
  defaultEffortPercent = null
} = {}) {
  const normalizedDefaultWeight = normalizeSelectNumber(defaultWeight);
  const normalizedDefaultSetSeconds = normalizeSelectNumber(defaultSetSeconds);
  const normalizedDefaultRestSeconds = normalizeSelectNumber(defaultRestSeconds);
  const normalizedDefaultEffortPercent = normalizeSelectNumber(defaultEffortPercent);
  const rows = setLogs.length
    ? setLogs.map((setLog) => {
      const normalizedSetLog = normalizeExerciseSetLog(setLog, {
        fallbackReps: setLog.rowType === "main" ? targetReps : ""
      });
      return {
        ...normalizedSetLog,
        weight: normalizedSetLog.weight ?? resolveSetTemplateAutoWeight(normalizedSetLog, normalizedDefaultWeight)
      };
    })
    : buildDefaultExerciseSetDrafts(1, normalizedDefaultWeight, targetReps, normalizedDefaultSetSeconds, normalizedDefaultRestSeconds, normalizedDefaultEffortPercent);
  let extraCount = 0;
  let followupCount = 0;

  return rows.map((setLog, index) => {
    let label = `Set ${setLog.setIndex || index + 1}`;
    let meta = setLog.templateLabel || "";
    if (setLog.rowType === "after-each") {
      followupCount += 1;
      const letter = String.fromCharCode(64 + ((followupCount - 1) % 26) + 1);
      label = `Superset ${setLog.parentSetIndex || 1}${letter}`;
      meta = setLog.templateLabel || `After set ${setLog.parentSetIndex || 1}`;
    } else if (setLog.rowType === "extra") {
      extraCount += 1;
      label = `Extra set ${extraCount}`;
      meta = setLog.templateLabel || "Bonus / back-off set";
    } else {
      followupCount = 0;
    }
    const placeholderReps = setLog.placeholderReps || (setLog.rowType === "main" ? targetReps : "");

    return {
      ...setLog,
      label,
      meta,
      placeholderReps,
      showFollowupButton: setLog.rowType === "main",
      effortPercent: normalizeSelectNumber(setLog.effortPercent) ?? normalizedDefaultEffortPercent,
      setSeconds: normalizeSelectNumber(setLog.setSeconds) ?? normalizedDefaultSetSeconds,
      restSeconds: normalizeSelectNumber(setLog.restSeconds) ?? normalizedDefaultRestSeconds
    };
  });
}

function buildExercisePhaseSequence(exercise = {}, {
  targetReps = "",
  defaultWeight = null,
  defaultSetSeconds = null,
  defaultRestSeconds = null
} = {}) {
  const safeExercise = exercise || {};
  const fallbackTargetReps = targetReps || safeExercise.targetReps || String(safeExercise.targetLogReps || "");
  const baseRows = Array.isArray(safeExercise.setLogs) && safeExercise.setLogs.length
    ? safeExercise.setLogs
    : buildExerciseSetDraftsFromTemplate(safeExercise, {
      defaultWeight,
      defaultSetSeconds,
      defaultRestSeconds
    });
  const rows = buildResolvedExerciseSetRows(baseRows, {
    targetReps: fallbackTargetReps,
    defaultWeight,
    defaultSetSeconds,
    defaultRestSeconds
  });
  const phases = [];
  let totalWorkSeconds = 0;
  let totalRestSeconds = 0;
  let cursor = 0;

  rows.forEach((row, rowIndex) => {
    const setSeconds = Math.max(0, normalizeSelectNumber(row.setSeconds) ?? 0);
    const restSeconds = Math.max(0, normalizeSelectNumber(row.restSeconds) ?? 0);

    if (setSeconds > 0) {
      phases.push({
        type: "work",
        rowIndex,
        rowId: row.id || `${rowIndex}`,
        label: row.label,
        meta: row.meta,
        title: row.meta ? `${row.label} • ${row.meta}` : row.label,
        durationSeconds: setSeconds,
        startOffsetSeconds: cursor,
        endOffsetSeconds: cursor + setSeconds
      });
      cursor += setSeconds;
      totalWorkSeconds += setSeconds;
    }

    if (restSeconds > 0) {
      phases.push({
        type: "break",
        rowIndex,
        rowId: row.id || `${rowIndex}`,
        label: row.label,
        meta: row.meta,
        title: `Break after ${row.label}`,
        durationSeconds: restSeconds,
        startOffsetSeconds: cursor,
        endOffsetSeconds: cursor + restSeconds
      });
      cursor += restSeconds;
      totalRestSeconds += restSeconds;
    }
  });

  return {
    rows,
    phases,
    totalWorkSeconds,
    totalRestSeconds,
    totalDurationSeconds: cursor
  };
}

function calculateElapsedPhaseTypeSeconds(sequence = {}, elapsedSeconds = 0, phaseType = "break") {
  const safeElapsedSeconds = Math.max(0, elapsedSeconds || 0);
  const phases = Array.isArray(sequence?.phases) ? sequence.phases : [];
  if (!phases.length) {
    return 0;
  }

  let total = 0;
  phases.forEach((phase) => {
    if (phase.type !== phaseType) {
      return;
    }

    total += clamp(
      safeElapsedSeconds - phase.startOffsetSeconds,
      0,
      phase.durationSeconds
    );
  });

  if (safeElapsedSeconds > (sequence.totalDurationSeconds || 0)) {
    const lastPhase = phases[phases.length - 1];
    if (lastPhase?.type === phaseType) {
      total += safeElapsedSeconds - (sequence.totalDurationSeconds || 0);
    }
  }

  return total;
}

function buildExerciseSetRowsMarkup(setLogs = [], targetReps = "", defaultWeight = null, defaultSetSeconds = null, defaultRestSeconds = null, defaultEffortPercent = null) {
  const rows = buildResolvedExerciseSetRows(setLogs, {
    targetReps,
    defaultWeight,
    defaultSetSeconds,
    defaultRestSeconds,
    defaultEffortPercent
  });

  return rows.map((setLog) => {
    const placeholderReps = setLog.placeholderReps || (setLog.rowType === "main" ? targetReps : "");

    return `
    <article class="exercise-set-row ${setLog.rowType === "after-each" ? "is-followup" : ""} ${setLog.rowType === "extra" ? "is-extra" : ""}" data-set-row data-set-id="${escapeAttribute(setLog.id || "")}" data-row-type="${escapeAttribute(setLog.rowType || "main")}" data-set-index="${escapeAttribute(setLog.setIndex ?? "")}" data-parent-set-index="${escapeAttribute(setLog.parentSetIndex ?? "")}" data-template-label="${escapeAttribute(setLog.templateLabel || "")}" data-placeholder-reps="${escapeAttribute(placeholderReps)}" data-weight-mode="${escapeAttribute(setLog.weightMode || "same")}" data-weight-value="${escapeAttribute(setLog.weightValue ?? "")}" data-default-set-seconds="${escapeAttribute(setLog.setSeconds ?? "")}" data-default-rest-seconds="${escapeAttribute(setLog.restSeconds ?? "")}" data-default-effort-percent="${escapeAttribute(setLog.effortPercent ?? "")}">
      <div class="exercise-set-top">
        <div>
          <div class="exercise-set-label">${escapeHtml(setLog.label)}</div>
          ${setLog.meta ? `<div class="exercise-set-meta">${escapeHtml(setLog.meta)}</div>` : ""}
        </div>
        <div class="exercise-set-actions">
          ${setLog.showFollowupButton ? `<button class="button button-secondary compact" type="button" data-add-followup-set>Superset</button>` : ""}
          <button class="button button-secondary compact" type="button" data-remove-set>Remove</button>
        </div>
      </div>
      <div class="field-grid two-up">
        <label class="field">
          <span>Set weight</span>
          <select class="roller-select" data-set-weight>
            <option value="">Choose</option>
            ${buildExerciseWeightOptionsMarkup(setLog.weight ?? "", defaultWeight)}
          </select>
        </label>

        <label class="field">
          <span>Set reps</span>
          <select class="roller-select" data-set-reps>
            <option value="">Choose</option>
            ${buildExerciseRepsOptionsMarkup(setLog.reps ?? "", placeholderReps)}
          </select>
        </label>
      </div>
      <div class="field-grid two-up">
        <label class="field">
          <span>Set effort</span>
          <select class="roller-select" data-set-effort-percent>
            <option value="">Choose</option>
            ${buildExerciseEffortOptionsMarkup(setLog.effortPercent ?? "")}
          </select>
        </label>

        <label class="field">
          <span>Set time</span>
          <select class="roller-select" data-set-log-seconds>
            <option value="">Choose</option>
            ${buildExerciseSetTimeOptionsMarkup(setLog.setSeconds)}
          </select>
        </label>

        <label class="field">
          <span>Break after</span>
          <select class="roller-select" data-set-log-rest-seconds>
            <option value="">Choose</option>
            ${buildExerciseRestOptionsMarkup(setLog.restSeconds)}
          </select>
        </label>
      </div>
    </article>
  `;
  }).join("");
}

function buildExerciseRollerFieldsMarkup({
  exercise,
  sessionKind,
  repsValue = "",
  effortPercent = "",
  weightValue = "",
  setSeconds = "",
  restSeconds = "",
  lastWeight = null
} = {}) {
  const requiresLiftFields = exerciseNeedsLiftFields(exercise, sessionKind);
  const requiredAttribute = requiresLiftFields ? "required" : "";
  const autoSetSeconds = inferSetSecondsFromTargetReps(repsValue || exercise?.targetLogReps || exercise?.targetReps);
  const resolvedSetSeconds = normalizeSelectNumber(setSeconds) ?? autoSetSeconds;

  return `
    <div class="exercise-roller-grid ${requiresLiftFields ? "is-lift" : "is-compact"}">
      <label class="roller-field">
        <span>${exercisePrimaryMetricLabel(exercise, sessionKind)}</span>
        <select class="roller-select" data-reps-picker ${requiredAttribute}>
          <option value="">Choose</option>
          ${buildExerciseRepsOptionsMarkup(repsValue, exercise?.targetReps)}
        </select>
      </label>

      <label class="roller-field">
        <span>Effort</span>
        <select class="roller-select" data-effort-percent ${requiredAttribute}>
          <option value="">Choose</option>
          ${buildExerciseEffortOptionsMarkup(effortPercent)}
        </select>
      </label>

      ${requiresLiftFields ? `
        <label class="roller-field">
          <span>Weight</span>
          <select class="roller-select" data-lift-weight required>
            <option value="">Choose</option>
            ${buildExerciseWeightOptionsMarkup(weightValue, lastWeight)}
          </select>
        </label>

        <label class="roller-field">
          <span>Set time</span>
          <select class="roller-select" data-set-seconds data-auto-set-seconds="${escapeAttribute(resolvedSetSeconds)}" required>
            <option value="">Choose</option>
            ${buildExerciseSetTimeOptionsMarkup(resolvedSetSeconds)}
          </select>
        </label>

        <label class="roller-field">
          <span>Break</span>
          <select class="roller-select" data-rest-seconds required>
            <option value="">Choose</option>
            ${buildExerciseRestOptionsMarkup(restSeconds)}
          </select>
        </label>
      ` : ""}
    </div>
  `;
}

function buildExerciseRepsOptionsMarkup(selectedValue = "", targetReps = "") {
  const normalizedValue = normalizeSelectNumber(selectedValue);
  const targets = extractNumericTargets(targetReps);
  const minimum = targets.length ? Math.max(1, Math.min(...targets) - 3) : 1;
  const maximum = targets.length ? clamp(Math.max(...targets) + 8, 8, 30) : 20;
  const options = [];

  for (let value = minimum; value <= maximum; value += 1) {
    options.push(value);
  }

  if (normalizedValue != null && Number.isFinite(normalizedValue) && !options.includes(normalizedValue)) {
    options.push(normalizedValue);
    options.sort((a, b) => a - b);
  }

  return buildNumericSelectOptionsMarkup(options, normalizedValue, (value) => `${value}`);
}

function exercisePrimaryMetricLabel(exercise, sessionKind) {
  return exerciseNeedsLiftFields(exercise, sessionKind) ? "Reps" : "Reached";
}

function buildExerciseEffortOptionsMarkup(selectedValue = "") {
  return buildNumericSelectOptionsMarkup(
    effortPercentOptions,
    normalizeSelectNumber(selectedValue),
    (value) => `${value}%`
  );
}

function buildExerciseWeightOptionsMarkup(selectedValue = "", lastWeight = null) {
  const normalizedValue = normalizeSelectNumber(selectedValue);
  const ceiling = Math.max(lastWeight || 0, normalizedValue || 0, 60);
  const maximum = Math.ceil((ceiling + 40) / 5) * 5;
  const options = [];

  for (let value = 0; value <= maximum; value += 2.5) {
    options.push(Number(value.toFixed(1)));
  }

  return buildNumericSelectOptionsMarkup(options, normalizedValue, (value) => formatWeight(value));
}

function buildExerciseRestOptionsMarkup(selectedValue = "") {
  const normalizedValue = normalizeSelectNumber(selectedValue);
  const availableOptions = normalizedValue != null && Number.isFinite(normalizedValue)
    ? [...new Set([...exerciseRestOptions, normalizedValue])].sort((a, b) => a - b)
    : exerciseRestOptions;

  return buildNumericSelectOptionsMarkup(availableOptions, normalizedValue, (value) => formatDurationCompact(value));
}

function buildExerciseSetTimeOptionsMarkup(selectedValue = "") {
  const normalizedValue = normalizeSelectNumber(selectedValue);
  const availableOptions = normalizedValue != null && Number.isFinite(normalizedValue)
    ? [...new Set([...exerciseSetTimeOptions, normalizedValue])].sort((a, b) => a - b)
    : exerciseSetTimeOptions;

  return buildNumericSelectOptionsMarkup(availableOptions, normalizedValue, (value) => formatDurationCompact(value));
}

function buildNumericSelectOptionsMarkup(options, selectedValue, formatter) {
  return options.map((value) => `
    <option value="${value}" ${selectedValue != null && Math.abs(value - selectedValue) < 0.001 ? "selected" : ""}>${escapeHtml(formatter(value))}</option>
  `).join("");
}

function normalizedWeightValue(value) {
  const normalizedValue = normalizeSelectNumber(value);
  return normalizedValue != null ? String(normalizedValue) : "";
}

function progressionWeightStep(weight) {
  return weight >= 0 ? 2.5 : 0;
}

function getSuggestedExerciseWeight(exercise = {}, sessionKind = "strength", { latestEntry = null } = {}) {
  const templateWeight = normalizeSelectNumber(exercise?.targetWeight);
  if (!exerciseNeedsLiftFields(exercise, sessionKind)) {
    return templateWeight;
  }

  const previousEntry = latestEntry || getPreviousExerciseEntry(exercise.name);
  const previousSummary = previousEntry ? summarizeExerciseLog(previousEntry) : null;
  const previousWeight = previousSummary?.keyWeight ?? templateWeight;

  if (previousWeight == null) {
    return templateWeight;
  }

  const targetReps = normalizeSelectNumber(exercise?.targetLogReps) ?? extractPreferredRepValue(exercise);
  const previousReps = previousSummary?.reps ?? null;
  const previousEffortPercent = previousEntry ? getExerciseEffortPercent(previousEntry) : null;
  const hitRepTarget = targetReps != null && previousReps != null && previousReps >= targetReps;
  const hadComfortableEffort = previousEffortPercent != null && previousEffortPercent <= 85;
  let suggestion = previousWeight;

  if (hitRepTarget && (previousEffortPercent == null || previousEffortPercent <= 97)) {
    suggestion += progressionWeightStep(previousWeight);
  } else if (hadComfortableEffort) {
    suggestion += progressionWeightStep(previousWeight);
  }

  if (templateWeight != null) {
    suggestion = Math.max(suggestion, templateWeight);
  }

  return Math.max(0, Math.round((suggestion / 2.5)) * 2.5);
}

function applySuggestedWeightToSetLogs(setLogs = [], {
  nextWeight = null,
  previousWeight = null,
  targetSets = 1
} = {}) {
  const normalizedNextWeight = normalizeSelectNumber(nextWeight);
  const normalizedPreviousWeight = normalizeSelectNumber(previousWeight);
  const rows = setLogs.length
    ? setLogs.map((setLog) => normalizeExerciseSetLog(setLog))
    : buildDefaultExerciseSetDrafts(targetSets, normalizedNextWeight);

  return rows.map((setLog) => {
    const currentWeight = normalizeSelectNumber(setLog.weight);
    const previousAutoWeight = resolveSetTemplateAutoWeight(setLog, normalizedPreviousWeight);
    const nextAutoWeight = resolveSetTemplateAutoWeight(setLog, normalizedNextWeight);
    const shouldReplace = currentWeight == null
      || (
        previousAutoWeight != null
        && currentWeight != null
        && Math.abs(currentWeight - previousAutoWeight) < 0.001
      );

    return {
      ...setLog,
      weight: shouldReplace ? nextAutoWeight : setLog.weight
    };
  });
}

function syncSetEffortInputs(container, {
  nextEffortPercent = null,
  previousEffortPercent = null
} = {}) {
  if (!container) {
    return;
  }

  const normalizedNextEffortPercent = normalizeSelectNumber(nextEffortPercent);
  const normalizedPreviousEffortPercent = normalizeSelectNumber(previousEffortPercent);
  [...container.querySelectorAll("[data-set-row]")].forEach((row) => {
    const input = row.querySelector("[data-set-effort-percent]");
    if (!input) {
      return;
    }

    const currentEffortPercent = normalizeSelectNumber(input.value);
    const defaultEffortPercent = normalizeSelectNumber(row.dataset.defaultEffortPercent);
    const shouldReplace = currentEffortPercent == null
      || (
        normalizedPreviousEffortPercent != null
        && currentEffortPercent != null
        && Math.abs(currentEffortPercent - normalizedPreviousEffortPercent) < 0.001
      )
      || (
        defaultEffortPercent != null
        && currentEffortPercent != null
        && Math.abs(currentEffortPercent - defaultEffortPercent) < 0.001
      );

    row.dataset.defaultEffortPercent = normalizedNextEffortPercent != null ? String(normalizedNextEffortPercent) : "";
    input.innerHTML = `
      <option value="">Choose</option>
      ${buildExerciseEffortOptionsMarkup(shouldReplace ? normalizedNextEffortPercent : currentEffortPercent)}
    `;
    input.value = shouldReplace
      ? (normalizedNextEffortPercent != null ? String(normalizedNextEffortPercent) : "")
      : (currentEffortPercent != null ? String(currentEffortPercent) : "");
  });
}

function syncSetWeightInputs(container, {
  nextWeight = null,
  previousWeight = null
} = {}) {
  if (!container) {
    return;
  }

  const normalizedNextWeight = normalizeSelectNumber(nextWeight);
  const normalizedPreviousWeight = normalizeSelectNumber(previousWeight);
  [...container.querySelectorAll("[data-set-row]")].forEach((row) => {
    const input = row.querySelector("[data-set-weight]");
    if (!input) {
      return;
    }

    const setLog = normalizeExerciseSetLog({
      rowType: row.dataset.rowType,
      setIndex: row.dataset.setIndex,
      parentSetIndex: row.dataset.parentSetIndex,
      templateLabel: row.dataset.templateLabel,
      placeholderReps: row.dataset.placeholderReps,
      weightMode: row.dataset.weightMode,
      weightValue: row.dataset.weightValue
    }, {
      fallbackReps: row.dataset.placeholderReps || ""
    });
    const currentWeight = normalizeSelectNumber(input.value);
    const previousAutoWeight = resolveSetTemplateAutoWeight(setLog, normalizedPreviousWeight);
    const nextAutoWeight = resolveSetTemplateAutoWeight(setLog, normalizedNextWeight);
    const shouldReplace = currentWeight == null
      || (
        previousAutoWeight != null
        && currentWeight != null
        && Math.abs(currentWeight - previousAutoWeight) < 0.001
      );

    if (shouldReplace) {
      input.value = normalizedWeightValue(nextAutoWeight);
    }
  });
}

function syncSetTimingInputs(container, {
  nextSetSeconds = null,
  nextRestSeconds = null
} = {}) {
  if (!container) {
    return;
  }

  const normalizedNextSetSeconds = normalizeSelectNumber(nextSetSeconds);
  const normalizedNextRestSeconds = normalizeSelectNumber(nextRestSeconds);

  [...container.querySelectorAll("[data-set-row]")].forEach((row) => {
    const setField = row.querySelector("[data-set-log-seconds]");
    const restField = row.querySelector("[data-set-log-rest-seconds]");
    const currentSetSeconds = normalizeSelectNumber(setField?.value);
    const currentRestSeconds = normalizeSelectNumber(restField?.value);
    const defaultSetSeconds = normalizeSelectNumber(row.dataset.defaultSetSeconds);
    const defaultRestSeconds = normalizeSelectNumber(row.dataset.defaultRestSeconds);
    const nextRowSetSeconds = currentSetSeconds == null
      || (defaultSetSeconds != null && currentSetSeconds != null && Math.abs(currentSetSeconds - defaultSetSeconds) < 0.001)
      ? normalizedNextSetSeconds
      : currentSetSeconds;
    const nextRowRestSeconds = currentRestSeconds == null
      || (defaultRestSeconds != null && currentRestSeconds != null && Math.abs(currentRestSeconds - defaultRestSeconds) < 0.001)
      ? normalizedNextRestSeconds
      : currentRestSeconds;

    row.dataset.defaultSetSeconds = normalizedNextSetSeconds != null ? String(normalizedNextSetSeconds) : "";
    row.dataset.defaultRestSeconds = normalizedNextRestSeconds != null ? String(normalizedNextRestSeconds) : "";

    if (setField) {
      setField.innerHTML = `
        <option value="">Choose</option>
        ${buildExerciseSetTimeOptionsMarkup(nextRowSetSeconds)}
      `;
      setField.value = nextRowSetSeconds != null ? String(nextRowSetSeconds) : "";
    }

    if (restField) {
      restField.innerHTML = `
        <option value="">Choose</option>
        ${buildExerciseRestOptionsMarkup(nextRowRestSeconds)}
      `;
      restField.value = nextRowRestSeconds != null ? String(nextRowRestSeconds) : "";
    }
  });
}

function currentExerciseCardSetWeight(card) {
  if (!card) {
    return "";
  }

  return card.querySelector("[data-lift-weight]")?.value || card.dataset.defaultSetWeight || "";
}

function currentExerciseCardEffortPercent(card) {
  if (!card) {
    return "";
  }

  return card.querySelector("[data-effort-percent]")?.value || card.dataset.defaultEffortPercent || "";
}

function currentExerciseCardSetSeconds(card) {
  if (!card) {
    return "";
  }

  const field = card.querySelector("[data-set-seconds]");
  return field?.value || field?.dataset.autoSetSeconds || "";
}

function currentExerciseCardRestSeconds(card) {
  if (!card) {
    return "";
  }

  return card.querySelector("[data-rest-seconds]")?.value || "";
}

function exerciseWorkUnitCount(exercise = {}) {
  if (Array.isArray(exercise?.setLogs) && exercise.setLogs.length) {
    return exercise.setLogs.length;
  }

  const mainSets = Math.max(1, toNumber(exercise?.targetSets) || 1);
  const followupCount = Array.isArray(exercise?.afterSetTemplates) ? exercise.afterSetTemplates.length : 0;
  const extraSetCount = Array.isArray(exercise?.extraSetTemplates) ? exercise.extraSetTemplates.length : 0;

  return mainSets * (1 + followupCount) + extraSetCount;
}

function plannedExerciseWorkSeconds(exercise = {}, setSeconds = null) {
  return buildExercisePhaseSequence(exercise, {
    targetReps: exercise?.targetReps || String(exercise?.targetLogReps || ""),
    defaultWeight: exercise?.targetWeight,
    defaultSetSeconds: setSeconds,
    defaultRestSeconds: exercise?.targetRestSeconds
  }).totalWorkSeconds;
}

function collectRoutineTimingBudget() {
  const template = currentRoutineLogTemplate();
  if (!template?.exercises?.length) {
    return null;
  }

  const cards = [...refs.routineExerciseFields.querySelectorAll("[data-exercise-name]")];
  const totals = template.exercises.reduce((budget, exercise, index) => {
    const card = cards[index];
    const repsValue = card?.querySelector("[data-reps-picker]")?.value || exercise.targetLogReps || extractPreferredRepValue(exercise);
    const setSeconds = normalizeSelectNumber(currentExerciseCardSetSeconds(card))
      ?? exercise.targetSetSeconds
      ?? inferSetSecondsFromTargetReps(repsValue);
    const restSeconds = normalizeSelectNumber(card?.querySelector("[data-rest-seconds]")?.value)
      ?? exercise.targetRestSeconds
      ?? 0;
    const setLogs = collectExerciseSetLogsFromContainer(card?.querySelector("[data-set-list]"), { includeUntouched: true });
    const phaseSequence = buildExercisePhaseSequence({
      ...exercise,
      targetLogReps: repsValue,
      setLogs
    }, {
      targetReps: exercise.targetReps,
      defaultWeight: normalizeSelectNumber(currentExerciseCardSetWeight(card)) ?? exercise.targetWeight,
      defaultSetSeconds: setSeconds,
      defaultRestSeconds: restSeconds
    });

    budget.workSeconds += phaseSequence.totalWorkSeconds;
    budget.restSeconds += phaseSequence.totalRestSeconds;
    return budget;
  }, { workSeconds: 0, restSeconds: 0 });

  return totals.workSeconds || totals.restSeconds ? totals : null;
}

function syncExerciseCardSetTime(card, { force = false } = {}) {
  if (!card) {
    return;
  }

  const repsField = card.querySelector("[data-reps-picker]");
  const setTimeField = card.querySelector("[data-set-seconds]");
  if (!repsField || !setTimeField) {
    return;
  }

  const previousAuto = normalizeSelectNumber(setTimeField.dataset.autoSetSeconds);
  const nextAuto = inferSetSecondsFromTargetReps(repsField.value || card.dataset.targetReps || "");
  const currentValue = normalizeSelectNumber(setTimeField.value);

  if (force || currentValue == null || (previousAuto != null && Math.abs(currentValue - previousAuto) < 0.001)) {
    setTimeField.value = String(nextAuto);
  }

  setTimeField.dataset.autoSetSeconds = String(nextAuto);
}

function syncBuilderExerciseSetTime(row, { force = false } = {}) {
  if (!row) {
    return;
  }

  const repsField = row.querySelector("[data-builder-exercise-log-reps]");
  const targetField = row.querySelector("[data-builder-exercise-reps]");
  const setTimeField = row.querySelector("[data-builder-exercise-set-time]");
  if (!setTimeField) {
    return;
  }

  const previousAuto = normalizeSelectNumber(setTimeField.dataset.autoSetSeconds);
  const nextAuto = inferSetSecondsFromTargetReps(repsField?.value || targetField?.value || "");
  const currentValue = normalizeSelectNumber(setTimeField.value);

  if (force || currentValue == null || (previousAuto != null && Math.abs(currentValue - previousAuto) < 0.001)) {
    setTimeField.value = String(nextAuto);
  }

  setTimeField.dataset.autoSetSeconds = String(nextAuto);
}

function buildExerciseHistoryHintMarkup({
  suggestedWeight = null,
  lastWeight = null,
  lastSetSeconds = null,
  lastRestSeconds = null,
  lastEffortPercent = null
} = {}) {
  const parts = [];

  if (suggestedWeight != null) {
    parts.push(`Suggested today: ${formatWeight(suggestedWeight)}`);
  }
  if (lastWeight != null && (suggestedWeight == null || Math.abs(lastWeight - suggestedWeight) >= 0.001)) {
    parts.push(`Last key set: ${formatWeight(lastWeight)}`);
  }
  if (lastSetSeconds != null) {
    parts.push(`Last set: ${formatDurationCompact(lastSetSeconds)}`);
  }
  if (lastRestSeconds != null) {
    parts.push(`Last break: ${formatDurationCompact(lastRestSeconds)}`);
  }
  if (lastEffortPercent != null) {
    parts.push(`Last effort: ${lastEffortPercent}%`);
  }

  return parts.length ? `<div class="helper-text">${parts.join(" • ")}</div>` : "";
}

function exerciseTemplateDefaultsSummary(exercise) {
  const parts = [];

  if (exercise?.targetLogReps != null) {
    parts.push(`${exercise.targetLogReps} reps`);
  }
  if (exercise?.targetEffortPercent != null) {
    parts.push(`${exercise.targetEffortPercent}% effort`);
  }
  if (exercise?.targetWeight != null) {
    parts.push(formatWeight(exercise.targetWeight));
  }
  if (exercise?.targetSetSeconds != null) {
    parts.push(`Set ${formatDurationCompact(exercise.targetSetSeconds)}`);
  }
  if (exercise?.targetRestSeconds != null) {
    parts.push(`Break ${formatDurationCompact(exercise.targetRestSeconds)}`);
  }
  if (exercise?.afterSetTemplates?.length) {
    parts.push(`${exercise.afterSetTemplates.length} follow-up superset${exercise.afterSetTemplates.length === 1 ? "" : "s"} / set`);
  }
  if (exercise?.extraSetTemplates?.length) {
    parts.push(`${exercise.extraSetTemplates.length} extra set${exercise.extraSetTemplates.length === 1 ? "" : "s"}`);
  }

  return parts.join(" • ");
}

function normalizeSelectNumber(value) {
  if (value === "" || value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferRestSecondsFromText(text) {
  const match = String(text || "").toLowerCase().match(/(\d+(?:\.\d+)?)\s*(sec|secs|second|seconds|min|mins|minute|minutes)\b/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return null;
  }

  return match[2].startsWith("m") ? Math.round(value * 60) : Math.round(value);
}

function inferSetSecondsFromTargetReps(targetReps) {
  const reps = normalizeSelectNumber(targetReps) ?? extractNumericTargets(targetReps)[0];
  if (!Number.isFinite(reps)) {
    return 45;
  }

  // Jeff Nippard's 2024 hypertrophy review recommends controlled 2-8 s reps.
  // We use a middle-ground ~5 s per rep and clamp to a practical hypertrophy range.
  return clamp(Math.round(reps * 5), 20, 70);
}

function inferSetSecondsFromExercise(exercise = {}) {
  return inferSetSecondsFromTargetReps(
    normalizeSelectNumber(exercise?.targetLogReps) ?? extractPreferredRepValue(exercise)
  );
}

function inferEffortPercentFromTargetReps(targetReps) {
  const reps = extractNumericTargets(targetReps)[0];
  if (!Number.isFinite(reps)) {
    return 75;
  }
  if (reps <= 3) {
    return 90;
  }
  if (reps <= 6) {
    return 80;
  }
  if (reps <= 10) {
    return 75;
  }
  return 70;
}

function extractNumericTargets(value) {
  return [...String(value || "").matchAll(/\d+/g)]
    .map((match) => Number(match[0]))
    .filter((number) => Number.isFinite(number));
}

function extractPreferredRepValue(exercise) {
  const targets = extractNumericTargets(exercise?.targetReps);
  return targets.length ? targets[0] : "";
}

function toggleExercisePanel(card, panelName) {
  const panel = card?.querySelector(`[data-exercise-panel="${panelName}"]`);
  if (!card || !panel) {
    return;
  }

  setExercisePanelOpen(card, panelName, panel.classList.contains("hidden"));
}

function setExercisePanelOpen(card, panelName, isOpen) {
  const panel = card?.querySelector(`[data-exercise-panel="${panelName}"]`);
  const button = card?.querySelector(`[data-toggle-exercise-panel="${panelName}"]`);

  if (!panel || !button) {
    return;
  }

  panel.classList.toggle("hidden", !isOpen);
  button.classList.toggle("is-open", isOpen);
}

function toggleBuilderPanel(row, panelName) {
  const panel = row?.querySelector(`[data-builder-panel="${panelName}"]`);
  if (!row || !panel) {
    return;
  }

  setBuilderPanelOpen(row, panelName, panel.classList.contains("hidden"));
}

function setBuilderPanelOpen(row, panelName, isOpen) {
  const panel = row?.querySelector(`[data-builder-panel="${panelName}"]`);
  const button = row?.querySelector(`[data-toggle-builder-panel="${panelName}"]`);

  if (!panel || !button) {
    return;
  }

  panel.classList.toggle("hidden", !isOpen);
  button.classList.toggle("is-open", isOpen);
}

function appendExerciseSetRow(container, {
  targetReps = "",
  defaultWeight = null,
  defaultSetSeconds = null,
  defaultRestSeconds = null,
  defaultEffortPercent = null
} = {}) {
  if (!container) {
    return;
  }

  container.insertAdjacentHTML("beforeend", buildExerciseSetRowsMarkup([normalizeExerciseSetLog({
    id: uid(),
    rowType: "extra",
    weightMode: "same",
    weight: normalizeSelectNumber(defaultWeight),
    reps: null,
    effortPercent: normalizeSelectNumber(defaultEffortPercent),
    setSeconds: normalizeSelectNumber(defaultSetSeconds),
    restSeconds: normalizeSelectNumber(defaultRestSeconds)
  }, {
    rowType: "extra"
  })], targetReps, defaultWeight, defaultSetSeconds, defaultRestSeconds, defaultEffortPercent));
  renumberExerciseSetRows(container);
}

function renumberExerciseSetRows(container) {
  let mainCount = 0;
  let extraCount = 0;
  let currentMainCount = 0;
  let followupCount = 0;

  [...container.querySelectorAll("[data-set-row]")].forEach((row) => {
    const rowType = row.dataset.rowType || "main";
    const label = row.querySelector(".exercise-set-label");
    const meta = row.querySelector(".exercise-set-meta");
    let nextLabel = "";
    let nextMeta = row.dataset.templateLabel || "";

    if (rowType === "after-each") {
      followupCount += 1;
      row.dataset.parentSetIndex = currentMainCount ? String(currentMainCount) : "1";
      const letter = String.fromCharCode(64 + ((followupCount - 1) % 26) + 1);
      nextLabel = `Superset ${row.dataset.parentSetIndex}${letter}`;
      nextMeta = row.dataset.templateLabel || `After set ${row.dataset.parentSetIndex}`;
    } else if (rowType === "extra") {
      extraCount += 1;
      followupCount = 0;
      nextLabel = `Extra set ${extraCount}`;
      nextMeta = row.dataset.templateLabel || "Bonus / back-off set";
      row.dataset.setIndex = "";
      row.dataset.parentSetIndex = "";
    } else {
      mainCount += 1;
      currentMainCount = mainCount;
      followupCount = 0;
      nextLabel = `Set ${mainCount}`;
      nextMeta = row.dataset.templateLabel || "";
      row.dataset.setIndex = String(mainCount);
      row.dataset.parentSetIndex = "";
    }

    row.classList.toggle("is-followup", rowType === "after-each");
    row.classList.toggle("is-extra", rowType === "extra");
    if (label) {
      label.textContent = nextLabel;
    }
    if (meta) {
      meta.textContent = nextMeta;
      meta.classList.toggle("hidden", !nextMeta);
    }
  });
}

function appendExerciseFollowupRow(row, {
  defaultWeight = null,
  defaultSetSeconds = null,
  defaultRestSeconds = null,
  defaultEffortPercent = null
} = {}) {
  const container = row?.closest("[data-set-list]");
  if (!row || !container) {
    return;
  }

  const rows = [...container.querySelectorAll("[data-set-row]")];
  const sourceIndex = rows.indexOf(row);
  const mainRow = row.dataset.rowType === "main"
    ? row
    : [...rows.slice(0, sourceIndex + 1)].reverse().find((candidate) => candidate.dataset.rowType === "main");
  const parentSetIndex = Number(mainRow?.dataset.setIndex || row.dataset.parentSetIndex || 1);
  let insertAfter = mainRow || row;

  rows.slice(sourceIndex + 1).forEach((candidate) => {
    if (candidate.dataset.rowType === "after-each" && Number(candidate.dataset.parentSetIndex || 0) === parentSetIndex) {
      insertAfter = candidate;
    }
  });

  insertAfter.insertAdjacentHTML("afterend", buildExerciseSetRowsMarkup([normalizeExerciseSetLog({
    id: uid(),
    rowType: "after-each",
    parentSetIndex,
    templateLabel: "Follow-up",
    weightMode: "same",
    weight: normalizeSelectNumber(defaultWeight),
    reps: null,
    effortPercent: normalizeSelectNumber(defaultEffortPercent),
    setSeconds: normalizeSelectNumber(defaultSetSeconds),
    restSeconds: normalizeSelectNumber(defaultRestSeconds)
  }, {
    rowType: "after-each"
  })], "", defaultWeight, defaultSetSeconds, defaultRestSeconds, defaultEffortPercent));
  renumberExerciseSetRows(container);
}

function removeExerciseSetRow(row) {
  if (!row) {
    return;
  }

  if ((row.dataset.rowType || "main") === "main") {
    let nextRow = row.nextElementSibling;
    while (nextRow?.matches?.("[data-set-row]") && nextRow.dataset.rowType === "after-each") {
      const rowToRemove = nextRow;
      nextRow = nextRow.nextElementSibling;
      rowToRemove.remove();
    }
  }

  row.remove();
}

function renderWorkoutCard(workout) {
  const kind = sessionKinds[workout.kind];
  const durationLabel = workout.elapsedSeconds
    ? formatDurationCompact(workout.elapsedSeconds)
    : `${workout.durationMinutes} min`;
  const metricLine = workout.primaryMetric ? ` • ${escapeHtml(workout.primaryMetric)}` : "";
  const areas = workout.loadedAreas?.length ? ` • ${escapeHtml(areaLabels(workout.loadedAreas))}` : "";
  const restLine = workout.restSeconds ? ` • Rest ${escapeHtml(formatDurationCompact(workout.restSeconds))}` : "";
  const notes = workout.notes ? `<div class="list-meta" style="margin-top:0.55rem">${escapeHtml(workout.notes)}</div>` : "";

  return `
    <article class="list-card">
      <div class="list-row-top">
        <div>
          <div class="list-title">${escapeHtml(workout.title)}</div>
          <div class="list-meta">${escapeHtml(formatDate(workout.date, { weekday: "short", day: "numeric", month: "short" }))} • ${escapeHtml(durationLabel)} • Intensity ${workout.intensity}/5${restLine}${metricLine}${areas}</div>
        </div>
        <span class="small-tag" style="background:${kind.color}">${escapeHtml(kind.label)}</span>
      </div>
      ${notes}
      <div class="quick-actions tight card-actions">
        <button class="button button-secondary compact" type="button" data-edit-workout="${workout.id}">Edit workout</button>
        <button class="button button-danger compact" type="button" data-delete-workout="${workout.id}">Delete workout</button>
      </div>
    </article>
  `;
}

function normalizeSetTemplate(values = {}, kind = "after-each") {
  const weightMode = Object.prototype.hasOwnProperty.call(setWeightModeOptions, values.weightMode)
    ? values.weightMode
    : (kind === "after-each" ? "percent" : "same");
  const normalizedWeightValue = normalizeSelectNumber(values.weightValue);

  return {
    id: values.id || uid(),
    kind,
    label: values.label || "",
    targetReps: values.targetReps || "",
    weightMode,
    weightValue: normalizedWeightValue != null
      ? normalizedWeightValue
      : (weightMode === "percent" ? 50 : null)
  };
}

function normalizeSetTemplateList(values, kind) {
  return Array.isArray(values) ? values.map((value) => normalizeSetTemplate(value, kind)) : [];
}

function normalizeExerciseTemplate(values = {}) {
  return {
    id: values.id || uid(),
    name: values.name || "",
    targetSets: Math.max(1, toNumber(values.targetSets) || 3),
    targetReps: values.targetReps || "",
    notes: values.notes || "",
    targetLogReps: normalizeSelectNumber(values.targetLogReps),
    targetEffortPercent: normalizeSelectNumber(values.targetEffortPercent),
    targetWeight: normalizeSelectNumber(values.targetWeight),
    targetSetSeconds: normalizeSelectNumber(values.targetSetSeconds),
    targetRestSeconds: normalizeSelectNumber(values.targetRestSeconds),
    afterSetTemplates: normalizeSetTemplateList(values.afterSetTemplates, "after-each"),
    extraSetTemplates: normalizeSetTemplateList(values.extraSetTemplates, "extra")
  };
}

function hydrateExerciseTemplate(values = {}, sessionKind = "strength") {
  const exercise = normalizeExerciseTemplate(values);

  if (exercise.targetLogReps == null) {
    exercise.targetLogReps = extractPreferredRepValue(exercise) || null;
  }

  if (exercise.targetRestSeconds == null) {
    exercise.targetRestSeconds = inferRestSecondsFromText(exercise.notes);
  }

  if (exercise.targetEffortPercent == null && exerciseNeedsLiftFields(exercise, sessionKind)) {
    exercise.targetEffortPercent = inferEffortPercentFromTargetReps(exercise.targetReps);
  }

  if (exercise.targetSetSeconds == null && exerciseNeedsLiftFields(exercise, sessionKind)) {
    exercise.targetSetSeconds = inferSetSecondsFromExercise(exercise);
  }

  return exercise;
}

function normalizeRoutineRecord(routine = {}) {
  return {
    ...routine,
    exercises: (routine.exercises || []).map((exercise) => hydrateExerciseTemplate(exercise, routine.sessionKind))
  };
}

function normalizeBlockRecord(block = {}) {
  return {
    ...block,
    weeks: (block.weeks || []).map((week) => ({
      ...week,
      plannedSessions: (week.plannedSessions || []).map((session) => ({
        ...session,
        exercises: (session.exercises || []).map((exercise) => hydrateExerciseTemplate(exercise, session.kind))
      }))
    }))
  };
}

function cloneRoutineExercises(routine) {
  return (routine?.exercises || []).map((exercise) => normalizeExerciseTemplate({
    name: exercise.name,
    targetSets: exercise.targetSets,
    targetReps: exercise.targetReps,
    notes: exercise.notes,
    targetLogReps: exercise.targetLogReps,
    targetEffortPercent: exercise.targetEffortPercent,
    targetWeight: exercise.targetWeight,
    targetSetSeconds: exercise.targetSetSeconds,
    targetRestSeconds: exercise.targetRestSeconds,
    afterSetTemplates: exercise.afterSetTemplates,
    extraSetTemplates: exercise.extraSetTemplates
  }));
}

function readBuilderSetTemplateRows(container, kind) {
  if (!container) {
    return [];
  }

  return [...container.querySelectorAll("[data-builder-set-template-row]")].map((row) => normalizeSetTemplate({
    id: row.dataset.builderSetTemplateId || uid(),
    label: row.querySelector("[data-builder-set-template-label]")?.value.trim() || "",
    targetReps: row.querySelector("[data-builder-set-template-reps]")?.value.trim() || "",
    weightMode: row.querySelector("[data-builder-set-template-weight-mode]")?.value,
    weightValue: row.querySelector("[data-builder-set-template-weight-value]")?.value
  }, kind));
}

function readExerciseBuilderRows(container) {
  if (!container) {
    return [];
  }

  return [...container.querySelectorAll("[data-builder-exercise-row]")].map((row) => {
    const exerciseName = row.querySelector("[data-builder-exercise-name]")?.value.trim();
    if (!exerciseName) {
      return null;
    }

    return normalizeExerciseTemplate({
      id: row.dataset.builderExerciseId || uid(),
      name: exerciseName,
      targetSets: row.querySelector("[data-builder-exercise-sets]")?.value,
      targetReps: row.querySelector("[data-builder-exercise-reps]")?.value.trim() || "-",
      notes: row.querySelector("[data-builder-exercise-notes]")?.value.trim() || "",
      targetLogReps: row.querySelector("[data-builder-exercise-log-reps]")?.value,
      targetEffortPercent: row.querySelector("[data-builder-exercise-effort]")?.value,
      targetWeight: row.querySelector("[data-builder-exercise-weight]")?.value,
      targetSetSeconds: row.querySelector("[data-builder-exercise-set-time]")?.value,
      targetRestSeconds: row.querySelector("[data-builder-exercise-rest]")?.value,
      afterSetTemplates: readBuilderSetTemplateRows(row.querySelector("[data-builder-after-set-list]"), "after-each"),
      extraSetTemplates: readBuilderSetTemplateRows(row.querySelector("[data-builder-extra-set-list]"), "extra")
    });
  }).filter(Boolean);
}

function buildSetTemplateWeightModeOptionsMarkup(selectedValue = "same") {
  return Object.entries(setWeightModeOptions).map(([value, label]) => `
    <option value="${value}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>
  `).join("");
}

function setTemplateWeightValuePlaceholder(template) {
  if (template.weightMode === "percent") {
    return "50";
  }
  if (template.weightMode === "fixed") {
    return "20";
  }

  return "";
}

function formatSetTemplateWeightRule(template) {
  if (template.weightMode === "percent") {
    return `${template.weightValue ?? 50}% of main`;
  }
  if (template.weightMode === "fixed") {
    return template.weightValue != null ? `${formatWeight(template.weightValue)}` : "Fixed kg";
  }
  if (template.weightMode === "bodyweight") {
    return "No weight";
  }

  return "Main weight";
}

function buildSetTemplateRowMarkup(values = {}, kind = "after-each") {
  const template = normalizeSetTemplate(values, kind);
  const valueLabel = template.weightMode === "percent" ? "Weight %" : "Weight";

  return `
    <article class="builder-set-template-row" data-builder-set-template-row data-builder-set-template-id="${escapeAttribute(template.id)}" data-builder-set-kind="${kind}">
      <div class="field-grid two-up">
        <label class="field">
          <span>Label</span>
          <input type="text" data-builder-set-template-label value="${escapeAttribute(template.label)}" placeholder="${kind === "after-each" ? "Half weight" : "Back-off"}">
        </label>

        <label class="field">
          <span>Reps</span>
          <input type="text" data-builder-set-template-reps value="${escapeAttribute(template.targetReps)}" placeholder="4">
        </label>

        <label class="field">
          <span>Weight rule</span>
          <select class="roller-select" data-builder-set-template-weight-mode>
            ${buildSetTemplateWeightModeOptionsMarkup(template.weightMode)}
          </select>
        </label>

        <label class="field">
          <span>${valueLabel}</span>
          <input type="number" inputmode="decimal" step="0.5" data-builder-set-template-weight-value value="${template.weightValue ?? ""}" placeholder="${escapeAttribute(setTemplateWeightValuePlaceholder(template))}">
        </label>
      </div>

      <div class="list-row-top">
        <div class="helper-text">${escapeHtml(formatSetTemplateWeightRule(template))}</div>
        <button class="button button-secondary compact" type="button" data-remove-builder-set-template>Remove</button>
      </div>
    </article>
  `;
}

function buildSetTemplateListMarkup(templates = [], kind = "after-each") {
  return templates.length
    ? templates.map((template) => buildSetTemplateRowMarkup(template, kind)).join("")
    : `<div class="helper-text">No ${kind === "after-each" ? "follow-up supersets" : "extra sets"} yet.</div>`;
}

function syncBuilderSetTemplateList(container, kind = "after-each") {
  if (!container) {
    return;
  }

  const rows = container.querySelectorAll("[data-builder-set-template-row]");
  if (!rows.length) {
    container.innerHTML = buildSetTemplateListMarkup([], kind);
  } else {
    [...container.querySelectorAll(".helper-text")].forEach((node) => {
      if (!node.closest("[data-builder-set-template-row]")) {
        node.remove();
      }
    });
  }
}

function appendBuilderSetTemplateRow(container, kind = "after-each", values = {}) {
  if (!container) {
    return;
  }

  if (!container.querySelector("[data-builder-set-template-row]")) {
    container.innerHTML = "";
  }
  container.insertAdjacentHTML("beforeend", buildSetTemplateRowMarkup(values, kind));
}

function buildExerciseBuilderRowMarkup(values = {}) {
  const exercise = normalizeExerciseTemplate(values);
  const defaultSetSeconds = exercise.targetSetSeconds ?? inferSetSecondsFromExercise(exercise);
  const defaultSummary = exerciseTemplateDefaultsSummary({
    ...exercise,
    targetSetSeconds: defaultSetSeconds
  });
  const hasSupersetTemplates = exercise.afterSetTemplates.length || exercise.extraSetTemplates.length;

  return `
    <article class="builder-row exercise-builder-row" data-builder-exercise-row data-builder-exercise-id="${escapeAttribute(exercise.id)}">
      <button class="remove-row" type="button" data-remove-builder-exercise aria-label="Remove exercise">×</button>
      <div class="field-grid two-up">
        <label class="field">
          <span>Exercise</span>
          <input type="text" data-builder-exercise-name value="${escapeAttribute(exercise.name)}" placeholder="Front squat">
        </label>

        <label class="field">
          <span>Sets</span>
          <input type="number" min="1" step="1" data-builder-exercise-sets value="${escapeAttribute(exercise.targetSets)}">
        </label>

        <label class="field">
          <span>Rep target</span>
          <input type="text" data-builder-exercise-reps value="${escapeAttribute(exercise.targetReps)}" placeholder="4-6">
        </label>
      </div>

      <div class="exercise-roller-grid is-lift">
        <label class="roller-field">
          <span>Reps</span>
          <select class="roller-select" data-builder-exercise-log-reps>
            <option value="">Optional</option>
            ${buildExerciseRepsOptionsMarkup(exercise.targetLogReps, exercise.targetReps)}
          </select>
        </label>

        <label class="roller-field">
          <span>Effort</span>
          <select class="roller-select" data-builder-exercise-effort>
            <option value="">Optional</option>
            ${buildExerciseEffortOptionsMarkup(exercise.targetEffortPercent)}
          </select>
        </label>

        <label class="roller-field">
          <span>Weight</span>
          <select class="roller-select" data-builder-exercise-weight>
            <option value="">Optional</option>
            ${buildExerciseWeightOptionsMarkup(exercise.targetWeight, exercise.targetWeight)}
          </select>
        </label>

        <label class="roller-field">
          <span>Set time</span>
          <select class="roller-select" data-builder-exercise-set-time data-auto-set-seconds="${escapeAttribute(defaultSetSeconds)}">
            <option value="">Optional</option>
            ${buildExerciseSetTimeOptionsMarkup(defaultSetSeconds)}
          </select>
        </label>

        <label class="roller-field">
          <span>Break</span>
          <select class="roller-select" data-builder-exercise-rest>
            <option value="">Optional</option>
            ${buildExerciseRestOptionsMarkup(exercise.targetRestSeconds)}
          </select>
        </label>
      </div>

      ${defaultSummary ? `<div class="helper-text">${defaultSummary}</div>` : ""}

      <div class="exercise-tools">
        <button class="exercise-tool ${hasSupersetTemplates ? "is-open" : ""}" type="button" data-toggle-builder-panel="supersets">Supersets</button>
        <button class="exercise-tool ${exercise.notes ? "is-open" : ""}" type="button" data-toggle-builder-panel="notes">Notes</button>
      </div>

      <div class="exercise-panel ${hasSupersetTemplates ? "" : "hidden"}" data-builder-panel="supersets">
        <div class="builder-set-group">
          <div class="list-row-top">
            <div>
              <div class="list-title">After every set</div>
              <div class="helper-text">Use this for things like half-weight or bodyweight follow-ups after each main set.</div>
            </div>
            <button class="button button-secondary compact" type="button" data-add-builder-after-set>Add follow-up</button>
          </div>
          <div class="builder-set-template-list" data-builder-after-set-list>
            ${buildSetTemplateListMarkup(exercise.afterSetTemplates, "after-each")}
          </div>
        </div>

        <div class="builder-set-group">
          <div class="list-row-top">
            <div>
              <div class="list-title">Extra sets</div>
              <div class="helper-text">Add back-off or bonus sets that happen after the main work.</div>
            </div>
            <button class="button button-secondary compact" type="button" data-add-builder-extra-set>Add extra set</button>
          </div>
          <div class="builder-set-template-list" data-builder-extra-set-list>
            ${buildSetTemplateListMarkup(exercise.extraSetTemplates, "extra")}
          </div>
        </div>
      </div>

      <label class="field exercise-panel ${exercise.notes ? "" : "hidden"}" data-builder-panel="notes">
        <span>Notes</span>
        <textarea rows="2" data-builder-exercise-notes placeholder="Optional">${escapeHtml(exercise.notes)}</textarea>
      </label>
    </article>
  `;
}

function appendRoutineBuilderExerciseRow(values = {}) {
  refs.routineExerciseBuilder.insertAdjacentHTML("beforeend", buildExerciseBuilderRowMarkup(values));
}

function ensureBuilderRows() {
  if (!refs.routineExerciseBuilder.children.length) {
    appendRoutineBuilderExerciseRow();
  }
}

function renderSessionExerciseEmptyState(container) {
  if (!container || container.querySelector(".block-exercise-empty")) {
    return;
  }

  container.insertAdjacentHTML("beforeend", `
    <div class="empty-card block-exercise-empty">
      Add exercises here if this block session needs its own lift list instead of only a routine link.
    </div>
  `);
}

function syncSessionExerciseListUI(container) {
  if (!container) {
    return;
  }

  const hasRows = container.querySelector("[data-builder-exercise-row]");
  const emptyState = container.querySelector(".block-exercise-empty");

  if (hasRows) {
    emptyState?.remove();
  } else {
    renderSessionExerciseEmptyState(container);
  }
}

function replaceSessionExerciseRows(container, exercises = [], { sourceRoutineId = "" } = {}) {
  if (!container) {
    return;
  }

  container.innerHTML = "";
  container.dataset.exerciseSourceRoutine = sourceRoutineId;
  exercises.forEach((exercise) => {
    container.insertAdjacentHTML("beforeend", buildExerciseBuilderRowMarkup(exercise));
  });
  syncSessionExerciseListUI(container);
}

function appendSessionExerciseRow(container, values = {}) {
  if (!container) {
    return;
  }

  container.dataset.exerciseSourceRoutine = "";
  container.querySelector(".block-exercise-empty")?.remove();
  container.insertAdjacentHTML("beforeend", buildExerciseBuilderRowMarkup(values));
}

function sessionBuilderHasExercises(row) {
  return readExerciseBuilderRows(row?.querySelector("[data-session-exercise-list]")).length > 0;
}

function prefillSessionBuilderFromRoutine(row, routine) {
  const exerciseList = row?.querySelector("[data-session-exercise-list]");
  const sourceRoutineId = exerciseList?.dataset.exerciseSourceRoutine || "";
  const canReplace = !sessionBuilderHasExercises(row) || Boolean(sourceRoutineId);

  if (!row || !routine || !canReplace || !routine.exercises.length) {
    return;
  }

  replaceSessionExerciseRows(exerciseList, cloneRoutineExercises(routine), { sourceRoutineId: routine.id });
}

function appendBlockWeek(values = {}) {
  const title = values.title || `Week ${refs.blockWeeksBuilder.children.length + 1}`;
  refs.blockWeeksBuilder.insertAdjacentHTML("beforeend", `
    <section class="week-builder" data-week-id="${escapeAttribute(values.id || "")}">
      <button class="remove-row" type="button" data-remove-week aria-label="Remove week">×</button>
      <div class="week-builder-title">${escapeHtml(title)}</div>
      <div class="field-grid two-up">
        <label class="field">
          <span>Week title</span>
          <input type="text" data-week-title value="${escapeAttribute(title)}" placeholder="Base load">
        </label>

        <label class="field">
          <span>Week note</span>
          <input type="text" data-week-note value="${escapeAttribute(values.note || "")}" placeholder="What matters this week?">
        </label>
      </div>

      <div class="session-list"></div>
      <button class="button button-secondary compact" type="button" data-add-session>Add planned session</button>
    </section>
  `);

  const sessionList = refs.blockWeeksBuilder.lastElementChild.querySelector(".session-list");
  if (values.plannedSessions?.length) {
    values.plannedSessions.forEach((session) => appendPlannedSessionRow(sessionList, session));
  } else {
    appendPlannedSessionRow(sessionList);
  }
}

function appendPlannedSessionRow(container, values = {}) {
  if (!container) {
    return;
  }

  container.insertAdjacentHTML("beforeend", `
    <article class="session-builder" data-session-id="${escapeAttribute(values.id || "")}">
      <button class="remove-row" type="button" data-remove-session aria-label="Remove session">×</button>
      <div class="field-grid two-up">
        <label class="field">
          <span>Day label</span>
          <input type="text" data-planned-day value="${escapeAttribute(values.dayLabel || "")}" placeholder="Mon">
        </label>

        <label class="field">
          <span>Routine</span>
          <select data-planned-routine>
            ${buildRoutineOptions(values.routineId)}
          </select>
        </label>

        <label class="field">
          <span>Session title</span>
          <input type="text" data-planned-title value="${escapeAttribute(values.sessionTitle || "")}" placeholder="Lower body power">
        </label>

        <label class="field">
          <span>Type</span>
          <select data-planned-kind>
            ${buildKindOptions(values.kind)}
          </select>
        </label>
      </div>
      <label class="field">
        <span>Session note</span>
        <textarea data-planned-details rows="2" placeholder="What matters in this session? Keep it short and useful.">${escapeHtml(values.details || "")}</textarea>
      </label>
      <div class="session-exercise-section">
        <div class="session-exercise-head">
          <div>
            <div class="eyebrow">Exercises</div>
            <div class="helper-text">Build this session directly inside the block if you want custom lifts here.</div>
          </div>
          <button class="button button-secondary compact" type="button" data-add-session-exercise>Add exercise</button>
        </div>
        <div class="builder-stack session-exercise-list" data-session-exercise-list></div>
      </div>
    </article>
  `);

  const row = container.lastElementChild;
  const exerciseList = row?.querySelector("[data-session-exercise-list]");
  if (values.exercises?.length) {
    replaceSessionExerciseRows(exerciseList, values.exercises);
  } else {
    syncSessionExerciseListUI(exerciseList);
  }

  if (row?.querySelector("[data-planned-routine]")?.value) {
    const routine = state.routines.find((item) => item.id === row.querySelector("[data-planned-routine]").value);
    if (routine) {
      if (!row.querySelector("[data-planned-details]").value.trim() && routine.notes) {
        row.querySelector("[data-planned-details]").value = routine.notes;
      }
      prefillSessionBuilderFromRoutine(row, routine);
    }
  }
}

function ensureAtLeastOneWeek() {
  if (!refs.blockWeeksBuilder.children.length) {
    appendBlockWeek();
  }
}

function rerenderBlockBuilderRoutineSelects() {
  refs.blockWeeksBuilder.querySelectorAll("[data-planned-routine]").forEach((select) => {
    const current = select.value;
    select.innerHTML = buildRoutineOptions(current);
    select.value = current;
  });
}

function buildRoutineOptions(selectedId) {
  const customOption = `<option value="">Custom session</option>`;
  const options = state.routines.map((routine) => `
    <option value="${routine.id}" ${routine.id === selectedId ? "selected" : ""}>${escapeHtml(routine.name)}</option>
  `).join("");
  return customOption + options;
}

function buildKindOptions(selectedKind) {
  return Object.entries(sessionKinds)
    .map(([value, meta]) => `<option value="${value}" ${value === selectedKind ? "selected" : ""}>${escapeHtml(meta.label)}</option>`)
    .join("");
}

function syncBodyFormFromLatest() {
  const latest = latestBodyCheckIn();
  if (!latest) {
    return;
  }
  refs.bodySleep.value = latest.sleepHours;
  refs.bodyEnergy.value = latest.energy;
  refs.bodySoreness.value = latest.soreness;
  refs.bodyStress.value = latest.stress;
  refs.bodyNotes.value = latest.notes || "";
  ui.bodyAreas = new Set(latest.fatiguedAreas || []);
}

function exportBackup() {
  const backup = JSON.stringify(state, null, 2);
  const blob = new Blob([backup], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pulseboard-backup-${todayISO()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast("Backup exported");
}

function importBackup(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = normalizeState(imported);
      persistState();
      refreshRoutineLogOptions();
      rerenderBlockBuilderRoutineSelects();
      renderDataViews();
      showToast("Backup imported");
    } catch {
      showToast("That backup could not be read");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function showToast(message) {
  clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    refs.toast.classList.remove("is-visible");
  }, 2200);
}

function advanceActiveBlockWeek() {
  if (!state.activeBlockId) {
    showToast("No active block yet");
    return;
  }
  advanceBlockWeek(state.activeBlockId);
}

function advanceBlockWeek(blockId) {
  const block = state.blocks.find((item) => item.id === blockId);
  if (!block || !block.weeks.length) {
    return;
  }

  const nextIndex = block.currentWeekIndex + 1;
  if (nextIndex < block.weeks.length) {
    block.currentWeekIndex = nextIndex;
  } else if (block.isLooping) {
    block.currentWeekIndex = 0;
  }
  persistState();
  renderDataViews();
  showToast("Week advanced");
}

function deleteWorkout(workoutId) {
  const workout = state.workouts.find((item) => item.id === workoutId);
  if (!workout) {
    return;
  }

  const confirmed = window.confirm(
    `Delete "${workout.title}" from ${formatDate(workout.date, { weekday: "short", day: "numeric", month: "short" })}?`
  );
  if (!confirmed) {
    return;
  }

  state.workouts = state.workouts.filter((item) => item.id !== workoutId);
  if (ui.editingWorkoutId === workoutId) {
    cancelWorkoutEdit();
  }
  persistState();
  renderDataViews();
  showToast("Workout deleted");
}

function deleteBodyCheckIn(checkInId) {
  const checkIn = state.bodyCheckIns.find((item) => item.id === checkInId);
  if (!checkIn) {
    return;
  }

  const confirmed = window.confirm(
    `Delete the body check-in from ${formatDate(checkIn.date, { weekday: "short", day: "numeric", month: "short" })}?`
  );
  if (!confirmed) {
    return;
  }

  state.bodyCheckIns = state.bodyCheckIns.filter((item) => item.id !== checkInId);
  persistState();
  renderDataViews();
  showToast("Body check-in deleted");
}

function deleteRoutine(routineId) {
  const routine = state.routines.find((item) => item.id === routineId);
  if (!routine) {
    return;
  }

  const linkedWorkouts = state.workouts.filter((item) => item.routineId === routineId).length;
  const linkedSessions = state.blocks.reduce((count, block) => (
    count + block.weeks.reduce((weekCount, week) => (
      weekCount + week.plannedSessions.filter((session) => session.routineId === routineId).length
    ), 0)
  ), 0);

  const confirmed = window.confirm(
    `Delete routine "${routine.name}"? Past workouts will be kept, and ${linkedSessions} planned session${linkedSessions === 1 ? "" : "s"} plus ${linkedWorkouts} logged workout${linkedWorkouts === 1 ? "" : "s"} will be detached from it.`
  );
  if (!confirmed) {
    return;
  }

  state.routines = state.routines.filter((item) => item.id !== routineId);
  state.workouts = state.workouts.map((item) => item.routineId === routineId
    ? { ...item, routineId: null }
    : item);
  state.blocks = state.blocks.map((block) => ({
    ...block,
    weeks: block.weeks.map((week) => ({
      ...week,
      plannedSessions: week.plannedSessions.map((session) => session.routineId === routineId
        ? {
          ...session,
          routineId: null,
          exercises: Array.isArray(session.exercises) && session.exercises.length
            ? session.exercises
            : cloneRoutineExercises(routine)
        }
        : session)
    }))
  }));

  if (ui.editingRoutineId === routineId) {
    resetRoutineBuilderForm();
    refs.routineBuilder.classList.add("hidden");
  }
  if (ui.editingWorkoutId) {
    cancelWorkoutEdit();
  }

  persistState();
  refreshRoutineLogOptions();
  rerenderBlockBuilderRoutineSelects();
  renderDataViews();
  showToast("Routine deleted");
}

function deleteBlock(blockId) {
  const block = state.blocks.find((item) => item.id === blockId);
  if (!block) {
    return;
  }

  const confirmed = window.confirm(`Delete block "${block.name}"?`);
  if (!confirmed) {
    return;
  }

  state.blocks = state.blocks.filter((item) => item.id !== blockId);
  if (state.activeBlockId === blockId) {
    state.activeBlockId = state.blocks[0]?.id || null;
  }
  if (plannerSettings().surfFirstBlockId === blockId) {
    plannerSettings().surfFirstBlockId = null;
  }
  if (ui.editingBlockId === blockId) {
    resetBlockBuilderForm();
    refs.blockBuilder.classList.add("hidden");
  }

  persistState();
  renderDataViews();
  showToast("Block deleted");
}

function getActiveBlock() {
  return state.blocks.find((block) => block.id === state.activeBlockId) || null;
}

function currentBlockWeek(block) {
  return block.weeks[block.currentWeekIndex] || block.weeks[0];
}

function activeWeekLabel(block) {
  return `Week ${block.currentWeekIndex + 1}: ${currentBlockWeek(block).title}`;
}

function latestBodyCheckIn() {
  return [...state.bodyCheckIns].sort((a, b) => compareDates(b.date, a.date))[0] || null;
}

function getLastWeight(exerciseName) {
  for (const workout of [...state.workouts].sort((a, b) => compareDates(b.date, a.date))) {
    for (const entry of workout.exerciseLogs || []) {
      if (entry.name?.toLowerCase() === exerciseName.toLowerCase()) {
        const summary = summarizeExerciseLog(entry);
        if (summary.keyWeight != null) {
          return summary.keyWeight;
        }
      }
    }
  }
  return null;
}

function getLastRestSeconds(exerciseName) {
  for (const workout of [...state.workouts].sort((a, b) => compareDates(b.date, a.date))) {
    for (const entry of workout.exerciseLogs || []) {
      if (entry.name?.toLowerCase() === exerciseName.toLowerCase() && entry.restSeconds != null) {
        return entry.restSeconds;
      }
    }
  }

  return null;
}

function getLastSetSeconds(exerciseName) {
  for (const workout of [...state.workouts].sort((a, b) => compareDates(b.date, a.date))) {
    for (const entry of workout.exerciseLogs || []) {
      if (entry.name?.toLowerCase() === exerciseName.toLowerCase() && entry.setSeconds != null) {
        return entry.setSeconds;
      }
    }
  }

  return null;
}

function getExercisePersonalBest(exerciseName, { excludeWorkoutId = null } = {}) {
  let personalBest = null;

  for (const workout of state.workouts) {
    if (excludeWorkoutId && workout.id === excludeWorkoutId) {
      continue;
    }

    for (const entry of workout.exerciseLogs || []) {
      if (entry.name?.toLowerCase() !== exerciseName.toLowerCase()) {
        continue;
      }

      const summary = summarizeExerciseLog(entry);
      if (summary.keyWeight == null) {
        continue;
      }

      personalBest = personalBest == null
        ? summary.keyWeight
        : Math.max(personalBest, summary.keyWeight);
    }
  }

  return personalBest;
}

function countExercisePersonalBests(exerciseLogs = [], { excludeWorkoutId = null } = {}) {
  return exerciseLogs.reduce((count, entry) => {
    const summary = summarizeExerciseLog(entry);
    if (summary.keyWeight == null) {
      return count;
    }

    const previousBest = getExercisePersonalBest(entry.name, { excludeWorkoutId });
    return previousBest == null || summary.keyWeight > previousBest ? count + 1 : count;
  }, 0);
}

function getPreviousExerciseEntry(exerciseName, { excludeWorkoutId = null } = {}) {
  return getPreviousExerciseEntryFromWorkouts(exerciseName, state.workouts, { excludeWorkoutId });
}

function getExerciseHistory(exerciseName, { limit = 4 } = {}) {
  const history = [];

  for (const workout of [...state.workouts].sort((a, b) => compareDates(b.date, a.date))) {
    for (const entry of workout.exerciseLogs || []) {
      if (entry.name?.toLowerCase() !== exerciseName.toLowerCase()) {
        continue;
      }

      history.push({
        ...entry,
        workoutDate: workout.date,
        workoutTitle: workout.title,
        ...summarizeExerciseLog(entry)
      });
    }
  }

  return history.slice(0, limit);
}

function formatExerciseHistoryLine(entry) {
  const parts = [
    formatDate(entry.workoutDate, { day: "numeric", month: "short" })
  ];
  const effortPercent = getExerciseEffortPercent(entry);

  if (entry.keyWeight != null) {
    parts.push(formatWeight(entry.keyWeight));
  }
  if (entry.reps != null) {
    parts.push(`${entry.reps} reps`);
  }
  if (entry.setCount) {
    parts.push(`${entry.setCount} sets`);
  }
  const setTimeSummary = formatLoggedExerciseSetTime(entry);
  if (setTimeSummary) {
    parts.push(setTimeSummary);
  }
  const restSummary = formatLoggedExerciseRest(entry);
  if (restSummary) {
    parts.push(restSummary);
  }
  if (effortPercent != null) {
    parts.push(`${effortPercent}% effort`);
  } else if (entry.effort != null) {
    parts.push(`Effort ${entry.effort}`);
  }

  return parts.join(" • ");
}

function formatLoggedExerciseSetTime(entry) {
  const setSeconds = Number.isFinite(entry?.setSeconds) ? entry.setSeconds : null;
  return setSeconds != null ? `Set ${formatDurationCompact(setSeconds)}` : "";
}

function formatLoggedExerciseRest(entry) {
  const actualRest = Number.isFinite(entry?.restSeconds) ? entry.restSeconds : null;
  const plannedRest = Number.isFinite(entry?.plannedRestSeconds) ? entry.plannedRestSeconds : null;

  if (actualRest == null) {
    return "";
  }
  if (plannedRest == null || Math.abs(plannedRest - actualRest) < 1) {
    return `Break ${formatDurationCompact(actualRest)}`;
  }
  if (actualRest < plannedRest) {
    return `Break ${formatDurationCompact(actualRest)} (${formatDurationCompact(plannedRest - actualRest)} skipped)`;
  }

  return `Break ${formatDurationCompact(actualRest)} (+${formatDurationCompact(actualRest - plannedRest)} extra)`;
}

function getExerciseEffortPercent(entry) {
  if (entry?.effortPercent != null && Number.isFinite(entry.effortPercent)) {
    return entry.effortPercent;
  }

  if (entry?.effort != null && Number.isFinite(entry.effort) && entry.effort > 10) {
    return entry.effort;
  }

  return null;
}

function summarizeExerciseLog(entry) {
  const setLogs = getExerciseSetLogs(entry);
  const setSummary = summarizeExerciseSetLogs(setLogs);

  return {
    keyWeight: entry.keyWeight ?? setSummary.keyWeight,
    reps: entry.reps ?? setSummary.reps,
    setCount: setLogs.length
  };
}

function exerciseNeedsLiftFields(exercise, sessionKind) {
  if (!exercise || !liftSessionKinds.has(sessionKind)) {
    return false;
  }

  const exerciseName = `${exercise.name || ""}`.toLowerCase();
  const target = `${exercise.targetReps || ""}`.toLowerCase();

  if (/\b(?:jump|jumps|sprint|bounds?|slam|slams|throw|throws|mobility|flow|opener|spin|bike|swim|surf|run|hike)\b/.test(exerciseName)) {
    return false;
  }

  if (/\b(?:sec|secs|second|seconds|min|mins|minute|minutes|hour|hours|km|mile|miles|meter|meters|metre|metres)\b/.test(target)) {
    return false;
  }

  if (/\b\d+\s*(?:s|m)\b/.test(target)) {
    return false;
  }

  return true;
}

function setQuickAreasFromKind(kind) {
  ui.quickAreas = new Set(defaultAreasForKind(kind));
}

function defaultAreasForKind(kind) {
  switch (kind) {
    case "strength":
    case "explosive":
      return ["legs", "core"];
    case "run":
    case "bike":
    case "hike":
      return ["legs"];
    case "swim":
    case "surf":
      return ["shoulders", "back", "core"];
    case "functional":
      return ["legs", "shoulders", "core"];
    default:
      return [];
  }
}

function suggestAreasForRoutine(routine) {
  const name = `${routine.name} ${routine.notes}`.toLowerCase();

  if (routine.sessionKind === "strength") {
    if (name.includes("upper")) {
      return ["chest", "back", "shoulders", "arms"];
    }
    if (name.includes("lower")) {
      return ["legs", "glutes", "core"];
    }
    return ["legs", "core"];
  }

  return defaultAreasForKind(routine.sessionKind);
}

function tiredDaySuggestion(fatiguedAreas) {
  if (fatiguedAreas.has("legs") && !fatiguedAreas.has("shoulders") && !fatiguedAreas.has("back")) {
    return "Skip heavy leg work. Do upper-body strength, easy swim, or mobility plus a short recovery circuit.";
  }
  if (fatiguedAreas.has("shoulders") || fatiguedAreas.has("back")) {
    return "Avoid stacking more paddling and pulling. Bike, hike, easy run, lower-body accessories, or mobility fit better.";
  }
  return "Use a recovery ride, walk, hike, easy surf, or 30 to 45 minutes of zone 2 so you still move forward without digging deeper.";
}

function bodyAreaRedirect(fatiguedAreas) {
  if (fatiguedAreas.has("legs")) {
    return "Legs are loaded, so bias upper body, swim technique, mobility, or very easy aerobic work.";
  }
  if (fatiguedAreas.has("shoulders") || fatiguedAreas.has("back")) {
    return "Back or shoulders are loaded, so avoid extra surf-style pulling and choose lower body or bike instead.";
  }
  return "Pick the session with the least overlap instead of forcing everything into one day.";
}

function activeBlockSuggestion() {
  const view = buildLogPlannerView();
  if (!view) {
    return "";
  }

  const todayEntry = view.todayEntries.find((entry) => !entry.isCompleteToday) || view.todayEntries[0] || null;
  if (todayEntry) {
    return `The block points to ${todayEntry.dayDisplay} for ${plannedSessionTitle(todayEntry.session)}, but you can still open a different session if today needs another fit.`;
  }

  const nextEntry = findNextPlannedEntry(view.entries, weekdayDefinitionForDate(todayISO()).index);
  return nextEntry ? `${nextEntry.dayDisplay} is next for ${plannedSessionTitle(nextEntry.session)}, but the week stays flexible if you want another session instead.` : "";
}

function areaLabels(keys = []) {
  if (!keys.length) {
    return "nothing marked";
  }
  return keys
    .map((key) => bodyAreas.find((area) => area.key === key)?.label || key)
    .join(", ");
}

function emphasisClass(emphasis) {
  return `emphasis-${emphasis}`;
}

function normalizeCoachChatMessage(message = {}) {
  const text = String(message.text || "").trim();
  if (!text) {
    return null;
  }

  return {
    id: message.id || uid(),
    role: message.role === "assistant" ? "assistant" : "user",
    text
  };
}

function normalizeCoachChatState(rawChat = {}, fallbackChat = createCoachChatState()) {
  return {
    goal: typeof rawChat?.goal === "string" ? rawChat.goal : fallbackChat.goal,
    messages: (Array.isArray(rawChat?.messages) ? rawChat.messages : fallbackChat.messages)
      .map((message) => normalizeCoachChatMessage(message))
      .filter(Boolean)
      .slice(-30)
  };
}

function normalizeState(raw) {
  const fallback = sampleState();
  const workouts = Array.isArray(raw?.workouts) ? raw.workouts : fallback.workouts;
  const routines = ensureSystemStarterRoutines(Array.isArray(raw?.routines) ? raw.routines : fallback.routines, workouts)
    .map((routine) => normalizeRoutineRecord(routine));
  const blocks = (Array.isArray(raw?.blocks) ? raw.blocks : fallback.blocks)
    .map((block) => normalizeBlockRecord(block));
  const bodyCheckIns = Array.isArray(raw?.bodyCheckIns) ? raw.bodyCheckIns : fallback.bodyCheckIns;
  const requestedActiveBlockId = typeof raw?.activeBlockId === "string" ? raw.activeBlockId : null;
  const activeBlockId = requestedActiveBlockId && blocks.some((block) => block.id === requestedActiveBlockId)
    ? requestedActiveBlockId
    : (blocks[0]?.id || null);
  const planner = normalizePlannerState(raw?.planner, fallback.planner);
  if (planner.surfFirstBlockId && !blocks.some((block) => block.id === planner.surfFirstBlockId)) {
    planner.surfFirstBlockId = blocks.find((block) => block.systemKey === SURF_FIRST_BLOCK_KEY)?.id || null;
  }

  return {
    routines,
    blocks,
    workouts,
    bodyCheckIns,
    activeBlockId,
    planner,
    coachChat: normalizeCoachChatState(raw?.coachChat, fallback.coachChat)
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeState(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        const migrated = migrateLegacyLogs(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }

  const seeded = sampleState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function sortState() {
  state.workouts.sort((a, b) => compareDates(b.date, a.date));
  state.bodyCheckIns.sort((a, b) => compareDates(b.date, a.date));
}

function migrateLegacyLogs(legacyLogs) {
  const seeded = sampleState();
  const workouts = legacyLogs
    .filter((entry) => entry.activity !== "sleep")
    .map((entry) => ({
      id: uid(),
      date: normalizeDateString(entry.date),
      title: activityTitleMap(entry.activity),
      kind: activityKindMap(entry.activity),
      durationMinutes: entry.duration || 0,
      intensity: entry.intensity || 3,
      notes: entry.notes || "",
      primaryMetric: entry.metric ? String(entry.metric) : "",
      routineId: null,
      loadedAreas: defaultAreasForKind(activityKindMap(entry.activity)),
      exerciseLogs: []
    }));

  const bodyCheckIns = legacyLogs
    .filter((entry) => entry.sleep || entry.energy || entry.soreness)
    .map((entry) => ({
      id: uid(),
      date: normalizeDateString(entry.date),
      sleepHours: entry.sleep || 0,
      energy: clamp(entry.energy || 3, 1, 5),
      soreness: clamp(entry.soreness || 2, 1, 5),
      stress: 2,
      fatiguedAreas: defaultAreasForKind(activityKindMap(entry.activity)),
      notes: entry.notes || ""
    }));

  seeded.workouts = [...workouts, ...seeded.workouts].sort((a, b) => compareDates(b.date, a.date));
  seeded.bodyCheckIns = [...bodyCheckIns, ...seeded.bodyCheckIns].sort((a, b) => compareDates(b.date, a.date));
  return seeded;
}

function sampleState() {
  const systemRoutines = buildSystemStarterRoutines();
  const lowerBodyId = uid();
  const upperBodyId = uid();
  const bikeId = uid();
  const explosiveId = uid();
  const recoveryId = uid();
  const blockId = uid();

  return {
    routines: [
      ...systemRoutines,
      {
        id: lowerBodyId,
        name: "Lower Body Power",
        kind: "strength",
        sessionKind: "strength",
        notes: "Key lower-body session. Log the important working sets, not the warm-up clutter.",
        estimatedMinutes: 75,
        exercises: [
          { id: uid(), name: "Front Squat", targetSets: 4, targetReps: "4-6", notes: "Top sets" },
          { id: uid(), name: "Romanian Deadlift", targetSets: 3, targetReps: "6-8", notes: "Controlled" },
          { id: uid(), name: "Bulgarian Split Squat", targetSets: 3, targetReps: "6 each", notes: "" },
          { id: uid(), name: "Box Jump", targetSets: 4, targetReps: "3", notes: "Stay sharp" }
        ]
      },
      {
        id: upperBodyId,
        name: "Upper Body Push + Pull",
        kind: "strength",
        sessionKind: "strength",
        notes: "Upper-body session that still leaves room for easy aerobic work.",
        estimatedMinutes: 65,
        exercises: [
          { id: uid(), name: "Bench Press", targetSets: 4, targetReps: "4-6", notes: "" },
          { id: uid(), name: "Weighted Pull-Up", targetSets: 4, targetReps: "4-6", notes: "" },
          { id: uid(), name: "Single-Arm Row", targetSets: 3, targetReps: "8", notes: "" },
          { id: uid(), name: "Landmine Press", targetSets: 3, targetReps: "8", notes: "" }
        ]
      },
      {
        id: bikeId,
        name: "Iron Build Bike",
        kind: "conditioning",
        sessionKind: "bike",
        notes: "Steady aerobic builder or controlled intervals.",
        estimatedMinutes: 75,
        exercises: []
      },
      {
        id: explosiveId,
        name: "Sprint + Elasticity",
        kind: "mixed",
        sessionKind: "explosive",
        notes: "Short power session to keep the nervous system awake.",
        estimatedMinutes: 35,
        exercises: [
          { id: uid(), name: "Bounds", targetSets: 3, targetReps: "20 m", notes: "" },
          { id: uid(), name: "Hill Sprint", targetSets: 6, targetReps: "10 s", notes: "Full recovery" },
          { id: uid(), name: "Med Ball Slam", targetSets: 4, targetReps: "5", notes: "" }
        ]
      },
      {
        id: recoveryId,
        name: "Flush + Mobility",
        kind: "recovery",
        sessionKind: "mobility",
        notes: "For tired days where you still want to do something useful.",
        estimatedMinutes: 30,
        exercises: [
          { id: uid(), name: "Easy Spin / Walk", targetSets: 1, targetReps: "20 min", notes: "" },
          { id: uid(), name: "Hip Mobility Flow", targetSets: 2, targetReps: "5 min", notes: "" },
          { id: uid(), name: "Thoracic Opener", targetSets: 2, targetReps: "90 s", notes: "" }
        ]
      }
    ],
    blocks: [
      {
        id: blockId,
        name: "Hybrid Base Loop",
        focus: "Balance endurance and strength while keeping speed alive.",
        currentWeekIndex: 0,
        isLooping: true,
        weeks: [
          {
            id: uid(),
            title: "Base load",
            note: "Accumulate good work without chasing failure.",
            plannedSessions: [
              { id: uid(), dayLabel: "Mon", routineId: lowerBodyId, sessionTitle: "Lower Body Power", kind: "strength" },
              { id: uid(), dayLabel: "Wed", routineId: bikeId, sessionTitle: "Iron Build Bike", kind: "bike" },
              { id: uid(), dayLabel: "Fri", routineId: upperBodyId, sessionTitle: "Upper Body Push + Pull", kind: "strength" }
            ]
          },
          {
            id: uid(),
            title: "Build",
            note: "Same structure, slightly higher intent.",
            plannedSessions: [
              { id: uid(), dayLabel: "Mon", routineId: lowerBodyId, sessionTitle: "Lower Body Power", kind: "strength" },
              { id: uid(), dayLabel: "Thu", routineId: explosiveId, sessionTitle: "Sprint + Elasticity", kind: "explosive" },
              { id: uid(), dayLabel: "Sat", routineId: bikeId, sessionTitle: "Long aerobic bike", kind: "bike" }
            ]
          },
          {
            id: uid(),
            title: "Power bias",
            note: "Keep the engine work, but make room for faster output.",
            plannedSessions: [
              { id: uid(), dayLabel: "Tue", routineId: explosiveId, sessionTitle: "Sprint + Elasticity", kind: "explosive" },
              { id: uid(), dayLabel: "Thu", routineId: upperBodyId, sessionTitle: "Upper Body Push + Pull", kind: "strength" },
              { id: uid(), dayLabel: "Sun", routineId: bikeId, sessionTitle: "Iron Build Bike", kind: "bike" }
            ]
          },
          {
            id: uid(),
            title: "Deload / reset",
            note: "Move often, reduce cost, and set up the next loop.",
            plannedSessions: [
              { id: uid(), dayLabel: "Mon", routineId: recoveryId, sessionTitle: "Flush + Mobility", kind: "mobility" },
              { id: uid(), dayLabel: "Thu", routineId: bikeId, sessionTitle: "Easy aerobic ride", kind: "bike" }
            ]
          }
        ]
      }
    ],
    activeBlockId: blockId,
    workouts: [
      {
        id: uid(),
        date: offsetISO(-1),
        title: "Upper Body Push + Pull",
        kind: "strength",
        durationMinutes: 68,
        intensity: 4,
        notes: "Strong bench. Pulling volume felt heavy after surf earlier in the week.",
        primaryMetric: "",
        routineId: upperBodyId,
        loadedAreas: ["chest", "back", "arms", "shoulders"],
        exerciseLogs: [
          {
            id: uid(),
            name: "Bench Press",
            keyWeight: 62.5,
            reps: 5,
            effort: 8,
            note: "Strong and clean.",
            setLogs: [
              { id: uid(), weight: 50, reps: 6 },
              { id: uid(), weight: 57.5, reps: 5 },
              { id: uid(), weight: 62.5, reps: 5 }
            ]
          },
          {
            id: uid(),
            name: "Weighted Pull-Up",
            keyWeight: 10,
            reps: 5,
            effort: 8,
            note: "Felt heavy after surf.",
            setLogs: [
              { id: uid(), weight: 0, reps: 6 },
              { id: uid(), weight: 5, reps: 5 },
              { id: uid(), weight: 10, reps: 5 }
            ]
          }
        ]
      },
      {
        id: uid(),
        date: offsetISO(-2),
        title: "Iron Build Bike",
        kind: "bike",
        durationMinutes: 82,
        intensity: 3,
        notes: "Steady aerobic ride.",
        primaryMetric: "42 km",
        routineId: bikeId,
        loadedAreas: ["legs"],
        exerciseLogs: []
      },
      {
        id: uid(),
        date: offsetISO(-3),
        title: "Surf Session",
        kind: "surf",
        durationMinutes: 95,
        intensity: 3,
        notes: "Shoulders got a solid dose. Great day in the water.",
        primaryMetric: "Messy but fun",
        routineId: null,
        loadedAreas: ["shoulders", "back", "core"],
        exerciseLogs: []
      },
      {
        id: uid(),
        date: offsetISO(-4),
        title: "Lower Body Power",
        kind: "strength",
        durationMinutes: 74,
        intensity: 4,
        notes: "Front squat moved well. Left leg a little heavy.",
        primaryMetric: "",
        routineId: lowerBodyId,
        loadedAreas: ["legs", "glutes", "core"],
        exerciseLogs: [
          {
            id: uid(),
            name: "Front Squat",
            keyWeight: 72.5,
            reps: 5,
            effort: 8,
            note: "Left leg felt a little heavy.",
            setLogs: [
              { id: uid(), weight: 60, reps: 6 },
              { id: uid(), weight: 67.5, reps: 5 },
              { id: uid(), weight: 72.5, reps: 5 }
            ]
          },
          {
            id: uid(),
            name: "Romanian Deadlift",
            keyWeight: 80,
            reps: 6,
            effort: 7,
            note: "Controlled.",
            setLogs: [
              { id: uid(), weight: 70, reps: 8 },
              { id: uid(), weight: 75, reps: 6 },
              { id: uid(), weight: 80, reps: 6 }
            ]
          }
        ]
      },
      {
        id: uid(),
        date: offsetISO(-6),
        title: "Sprint + Elasticity",
        kind: "explosive",
        durationMinutes: 34,
        intensity: 4,
        notes: "Fast but short. Nice pop.",
        primaryMetric: "6 hill sprints",
        routineId: explosiveId,
        loadedAreas: ["legs", "core"],
        exerciseLogs: [
          { id: uid(), name: "Hill Sprint", keyWeight: null, reps: 6, effort: 9, note: "Fast but short." }
        ]
      }
    ],
    bodyCheckIns: [
      {
        id: uid(),
        date: todayISO(),
        sleepHours: 7.2,
        energy: 3,
        soreness: 3,
        stress: 2,
        fatiguedAreas: ["shoulders", "back"],
        notes: "Upper body is a bit cooked, legs are decent."
      }
    ],
    planner: defaultPlannerState(),
    coachChat: createCoachChatState()
  };
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    return;
  }
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `pb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  return normalizeDateString(new Date().toISOString());
}

function offsetISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return normalizeDateString(date.toISOString());
}

function normalizeDateString(value) {
  return String(value).slice(0, 10);
}

function compareDates(a, b) {
  return localDate(a) - localDate(b);
}

function localDate(value) {
  return new Date(`${normalizeDateString(value)}T12:00:00`);
}

function daysAgo(dateString) {
  const today = localDate(todayISO());
  const target = localDate(dateString);
  return Math.round((today - target) / 86400000);
}

function formatDate(value, options) {
  const wantsTime = Boolean(options?.hour || options?.minute || options?.second || options?.timeStyle);
  const rawValue = value instanceof Date ? value : String(value ?? "");
  const parsedDate = rawValue instanceof Date
    ? rawValue
    : (wantsTime && /[tT ]\d{1,2}:\d{2}/.test(rawValue) ? new Date(rawValue) : null);

  return new Intl.DateTimeFormat(navigator.language || "en-GB", options).format(
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate
      : localDate(rawValue)
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat(navigator.language || "en-GB", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value);
}

function formatWeight(value) {
  return `${formatNumber(value)} kg`;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function toNumber(value) {
  return Number(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildEmptyCard(title, text) {
  return `
    <article class="empty-card">
      <div class="list-title">${escapeHtml(title)}</div>
      <div class="empty-copy" style="margin-top:0.45rem">${escapeHtml(text)}</div>
    </article>
  `;
}

function activityKindMap(activity) {
  const mapping = {
    strength: "strength",
    explosive: "explosive",
    ironman: "bike",
    speed: "run",
    functional: "functional",
    surfing: "surf",
    mobility: "mobility",
    sleep: "recovery"
  };
  return mapping[activity] || "recovery";
}

function activityTitleMap(activity) {
  return sessionKinds[activityKindMap(activity)]?.label || "Session";
}

function toneDown(color) {
  return `${color}99`;
}
